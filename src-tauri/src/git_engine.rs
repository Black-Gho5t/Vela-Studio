use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct GitFileChange {
    pub path: String,
    pub status: String,
    pub staged: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct GitRepoStatus {
    pub branch: String,
    pub is_repo: bool,
    pub staged: Vec<GitFileChange>,
    pub unstaged: Vec<GitFileChange>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct GitCommitItem {
    pub id: String,
    pub short_id: String,
    pub author_name: String,
    pub author_email: String,
    pub timestamp: i64,
    pub relative_date: String,
    pub message: String,
}

fn expand_path(path: &str) -> String {
    if path.starts_with('~') {
        if let Some(home) = std::env::var("HOME").ok().or_else(|| std::env::var("USERPROFILE").ok()) {
            path.replacen('~', &home, 1)
        } else {
            path.to_string()
        }
    } else {
        path.to_string()
    }
}

pub fn parse_porcelain_status(output: &str) -> (Vec<GitFileChange>, Vec<GitFileChange>) {
    let mut staged = Vec::new();
    let mut unstaged = Vec::new();

    for line in output.lines() {
        if line.len() < 4 {
            continue;
        }

        let bytes = line.as_bytes();
        let index_char = bytes[0] as char;
        let worktree_char = bytes[1] as char;
        let file_path = line[3..].trim().trim_matches('"').to_string();

        if index_char == '?' && worktree_char == '?' {
            unstaged.push(GitFileChange {
                path: file_path,
                status: "U".to_string(),
                staged: false,
            });
        } else {
            if index_char != ' ' && index_char != '?' {
                staged.push(GitFileChange {
                    path: file_path.clone(),
                    status: index_char.to_string(),
                    staged: true,
                });
            }
            if worktree_char != ' ' && worktree_char != '?' {
                unstaged.push(GitFileChange {
                    path: file_path,
                    status: worktree_char.to_string(),
                    staged: false,
                });
            }
        }
    }

    (staged, unstaged)
}

pub fn parse_git_log(output: &str) -> Vec<GitCommitItem> {
    let mut commits = Vec::new();

    for line in output.lines() {
        let parts: Vec<&str> = line.splitn(7, '|').collect();
        if parts.len() == 7 {
            commits.push(GitCommitItem {
                id: parts[0].to_string(),
                short_id: parts[1].to_string(),
                author_name: parts[2].to_string(),
                author_email: parts[3].to_string(),
                timestamp: parts[4].parse::<i64>().unwrap_or(0),
                relative_date: parts[5].to_string(),
                message: parts[6].to_string(),
            });
        }
    }

    commits
}

pub fn get_repo_status(project_path: &str) -> Result<GitRepoStatus, String> {
    let expanded = expand_path(project_path);

    // 1. Get current branch
    let branch_out = Command::new("git")
        .arg("-C")
        .arg(&expanded)
        .arg("rev-parse")
        .arg("--abbrev-ref")
        .arg("HEAD")
        .output()
        .map_err(|e| format!("Failed to run git: {}", e))?;

    if !branch_out.status.success() {
        return Ok(GitRepoStatus {
            branch: String::new(),
            is_repo: false,
            staged: Vec::new(),
            unstaged: Vec::new(),
        });
    }

    let branch = String::from_utf8_lossy(&branch_out.stdout).trim().to_string();

    // 2. Get status porcelain
    let status_out = Command::new("git")
        .arg("-C")
        .arg(&expanded)
        .args(["status", "--porcelain=v1", "-uall"])
        .output()
        .map_err(|e| format!("Failed to get git status: {}", e))?;

    let status_text = String::from_utf8_lossy(&status_out.stdout);
    let (staged, unstaged) = parse_porcelain_status(&status_text);

    Ok(GitRepoStatus {
        branch,
        is_repo: true,
        staged,
        unstaged,
    })
}

pub fn get_repo_log(project_path: &str, limit: usize) -> Result<Vec<GitCommitItem>, String> {
    let expanded = expand_path(project_path);

    let output = Command::new("git")
        .arg("-C")
        .arg(&expanded)
        .args([
            "log",
            &format!("-n{}", limit),
            "--pretty=format:%H|%h|%an|%ae|%at|%cr|%s",
        ])
        .output()
        .map_err(|e| format!("Failed to read git log: {}", e))?;

    if !output.status.success() {
        return Ok(Vec::new());
    }

    let log_text = String::from_utf8_lossy(&output.stdout);
    Ok(parse_git_log(&log_text))
}

pub fn stage_file(project_path: &str, file_path: &str) -> Result<(), String> {
    let expanded = expand_path(project_path);
    let output = Command::new("git")
        .arg("-C")
        .arg(&expanded)
        .args(["add", file_path])
        .output()
        .map_err(|e| format!("Failed to run git add: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

pub fn unstage_file(project_path: &str, file_path: &str) -> Result<(), String> {
    let expanded = expand_path(project_path);
    let output = Command::new("git")
        .arg("-C")
        .arg(&expanded)
        .args(["restore", "--staged", file_path])
        .output()
        .map_err(|e| format!("Failed to run git restore: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

pub fn stage_all(project_path: &str) -> Result<(), String> {
    let expanded = expand_path(project_path);
    let output = Command::new("git")
        .arg("-C")
        .arg(&expanded)
        .args(["add", "-A"])
        .output()
        .map_err(|e| format!("Failed to run git add: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

pub fn commit(project_path: &str, message: &str) -> Result<String, String> {
    let expanded = expand_path(project_path);

    // Check if anything is staged
    let staged_check = Command::new("git")
        .arg("-C")
        .arg(&expanded)
        .args(["diff", "--cached", "--quiet"])
        .status();

    if let Ok(status) = staged_check {
        if status.success() {
            // Nothing staged, auto-stage all tracked and untracked files
            stage_all(project_path)?;
        }
    }

    let output = Command::new("git")
        .arg("-C")
        .arg(&expanded)
        .args(["commit", "-m", message])
        .output()
        .map_err(|e| format!("Failed to commit: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let err = String::from_utf8_lossy(&output.stderr).trim().to_string();
        if err.is_empty() {
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        } else {
            Err(err)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_porcelain_status() {
        let sample = " M src/lib.rs\nM  src/main.rs\n?? test.txt\nD  old.rs\n";
        let (staged, unstaged) = parse_porcelain_status(sample);

        assert_eq!(staged.len(), 2);
        assert_eq!(staged[0].path, "src/main.rs");
        assert_eq!(staged[0].status, "M");
        assert!(staged[0].staged);

        assert_eq!(staged[1].path, "old.rs");
        assert_eq!(staged[1].status, "D");

        assert_eq!(unstaged.len(), 2);
        assert_eq!(unstaged[0].path, "src/lib.rs");
        assert_eq!(unstaged[0].status, "M");
        assert!(!unstaged[0].staged);

        assert_eq!(unstaged[1].path, "test.txt");
        assert_eq!(unstaged[1].status, "U");
    }

    #[test]
    fn test_parse_git_log() {
        let sample = "3eda89e5|3eda89e|Brian|brian@example.com|1794101971|2 minutes ago|feat: implement file watcher\n";
        let commits = parse_git_log(sample);

        assert_eq!(commits.len(), 1);
        assert_eq!(commits[0].id, "3eda89e5");
        assert_eq!(commits[0].short_id, "3eda89e");
        assert_eq!(commits[0].author_name, "Brian");
        assert_eq!(commits[0].message, "feat: implement file watcher");
        assert_eq!(commits[0].relative_date, "2 minutes ago");
    }
}
