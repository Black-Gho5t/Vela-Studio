use ignore::WalkBuilder;
use regex::{Regex, RegexBuilder};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMatch {
    pub line_number: usize,
    pub line_text: String,
    pub match_start: usize,
    pub match_end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSearchResult {
    pub file_path: String,
    pub relative_path: String,
    pub matches: Vec<SearchMatch>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQueryOptions {
    pub query: String,
    pub match_case: bool,
    pub whole_word: bool,
    pub is_regex: bool,
    pub max_results: Option<usize>,
    pub file_pattern: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResponse {
    pub results: Vec<FileSearchResult>,
    pub total_matches: usize,
    pub total_files: usize,
    pub truncated: bool,
}

pub fn build_search_regex(
    query: &str,
    match_case: bool,
    whole_word: bool,
    is_regex: bool,
) -> Result<Regex, String> {
    if query.is_empty() {
        return Err("Search query cannot be empty".to_string());
    }

    let pattern = if is_regex {
        query.to_string()
    } else {
        regex::escape(query)
    };

    let pattern = if whole_word {
        format!(r"\b{}\b", pattern)
    } else {
        pattern
    };

    RegexBuilder::new(&pattern)
        .case_insensitive(!match_case)
        .multi_line(false)
        .build()
        .map_err(|e| format!("Invalid regex: {}", e))
}

pub fn search_directory(
    root_path: &str,
    options: &SearchQueryOptions,
) -> Result<SearchResponse, String> {
    let re = build_search_regex(
        &options.query,
        options.match_case,
        options.whole_word,
        options.is_regex,
    )?;

    let max_results = options.max_results.unwrap_or(500);
    let root = Path::new(root_path);
    if !root.exists() {
        return Err(format!("Directory does not exist: {}", root_path));
    }

    let mut results = Vec::new();
    let mut total_matches = 0;
    let mut truncated = false;

    let mut walker = WalkBuilder::new(root);
    walker
        .hidden(true)
        .git_ignore(true)
        .git_global(true)
        .git_exclude(true)
        .parents(true);

    for result in walker.build() {
        if total_matches >= max_results {
            truncated = true;
            break;
        }

        let entry = match result {
            Ok(e) => e,
            Err(_) => continue,
        };

        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let path_str = path.to_string_lossy();
        if path_str.contains("/.git/")
            || path_str.contains("/build/")
            || path_str.contains("/.dart_tool/")
            || path_str.contains("/node_modules/")
        {
            continue;
        }

        if let Some(ref pattern) = options.file_pattern {
            if !pattern.is_empty() && pattern != "*" {
                let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                let pat = pattern.trim_start_matches("*.");
                if !file_name.ends_with(pat) {
                    continue;
                }
            }
        }

        if let Ok(meta) = path.metadata() {
            if meta.len() > 5 * 1024 * 1024 {
                continue;
            }
        }

        let content = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let mut file_matches = Vec::new();

        for (line_idx, line) in content.lines().enumerate() {
            if total_matches >= max_results {
                truncated = true;
                break;
            }

            for mat in re.find_iter(line) {
                file_matches.push(SearchMatch {
                    line_number: line_idx + 1,
                    line_text: line.to_string(),
                    match_start: mat.start(),
                    match_end: mat.end(),
                });
                total_matches += 1;
                if total_matches >= max_results {
                    break;
                }
            }
        }

        if !file_matches.is_empty() {
            let relative_path = path
                .strip_prefix(root)
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|_| path_str.to_string());

            results.push(FileSearchResult {
                file_path: path_str.to_string(),
                relative_path,
                matches: file_matches,
            });
        }
    }

    let total_files = results.len();
    Ok(SearchResponse {
        results,
        total_matches,
        total_files,
        truncated,
    })
}

pub fn replace_in_file(
    file_path: &str,
    query: &str,
    replacement: &str,
    match_case: bool,
    whole_word: bool,
    is_regex: bool,
) -> Result<usize, String> {
    let re = build_search_regex(query, match_case, whole_word, is_regex)?;
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read {}: {}", file_path, e))?;

    let count = re.find_iter(&content).count();
    if count == 0 {
        return Ok(0);
    }

    let new_content = re.replace_all(&content, replacement).to_string();
    fs::write(file_path, new_content)
        .map_err(|e| format!("Failed to write {}: {}", file_path, e))?;

    Ok(count)
}

pub fn replace_in_files(
    root_path: &str,
    options: &SearchQueryOptions,
    replacement: &str,
) -> Result<usize, String> {
    let search_res = search_directory(root_path, options)?;
    let mut total_replaced = 0;

    for file_res in &search_res.results {
        let count = replace_in_file(
            &file_res.file_path,
            &options.query,
            replacement,
            options.match_case,
            options.whole_word,
            options.is_regex,
        )?;
        total_replaced += count;
    }

    Ok(total_replaced)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;

    #[test]
    fn test_build_search_regex() {
        let re_case = build_search_regex("Hello", true, false, false).unwrap();
        assert!(re_case.is_match("Hello World"));
        assert!(!re_case.is_match("hello world"));

        let re_word = build_search_regex("foo", false, true, false).unwrap();
        assert!(re_word.is_match("a foo bar"));
        assert!(!re_word.is_match("a foobar"));

        let re_special = build_search_regex("Widget.builder()", false, false, false).unwrap();
        assert!(re_special.is_match("return Widget.builder();"));
    }

    #[test]
    fn test_search_and_replace() {
        let temp_dir = std::env::temp_dir().join(format!("vela_search_test_{}", std::process::id()));
        let _ = fs::create_dir_all(&temp_dir);

        let file1_path = temp_dir.join("test1.dart");
        let mut file1 = File::create(&file1_path).unwrap();
        writeln!(file1, "class HomeScreen extends StatelessWidget {{").unwrap();
        writeln!(file1, "  final String title = 'Hello World';").unwrap();
        writeln!(file1, "}}").unwrap();

        let opts = SearchQueryOptions {
            query: "Hello World".to_string(),
            match_case: true,
            whole_word: false,
            is_regex: false,
            max_results: Some(50),
            file_pattern: None,
        };

        let res = search_directory(temp_dir.to_str().unwrap(), &opts).unwrap();
        assert_eq!(res.total_matches, 1);
        assert_eq!(res.results[0].matches[0].line_number, 2);

        let replaced = replace_in_file(
            file1_path.to_str().unwrap(),
            "Hello World",
            "Hola Mundo",
            true,
            false,
            false,
        ).unwrap();
        assert_eq!(replaced, 1);

        let content_after = fs::read_to_string(&file1_path).unwrap();
        assert!(content_after.contains("Hola Mundo"));
        assert!(!content_after.contains("Hello World"));

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
