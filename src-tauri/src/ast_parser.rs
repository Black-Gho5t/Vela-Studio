use serde::{Deserialize, Serialize};
use tree_sitter::{Node, Parser};
use std::fs;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WidgetNode {
    pub id: String,
    pub r#type: String,
    pub props: serde_json::Value,
    pub start_byte: usize,
    pub end_byte: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<WidgetNode>>,
}

// Walks the AST to find flutter widgets.
fn walk_node(node: Node, source: &[u8]) -> Option<WidgetNode> {
    let kind = node.kind();
    if kind == "creation_expression" || kind == "invocation_expression" || kind == "call_expression" || kind == "const_object_expression" {
        // A creation expression usually has an identifier (or a type_identifier) as its name
        let mut text_opt = None;
        let mut widget_type = String::new();
        let mut stable_id = String::new();
        let mut start_b = 0;
        let mut end_b = 0;
        
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "identifier" || child.kind() == "type_identifier" {
                if let Ok(text) = std::str::from_utf8(&source[child.start_byte()..child.end_byte()]) {
                    if text.chars().next().map_or(false, |c| c.is_uppercase()) {
                        let non_widgets = [
                            "Color", "Colors", "TextStyle", "EdgeInsets", "BoxDecoration",
                            "BorderRadius", "Key", "MaterialPageRoute", "ThemeData",
                            "ColorScheme", "Duration", "Offset", "Radius", "State",
                        ];
                        if !non_widgets.contains(&text) {
                            text_opt = Some(text.to_string());
                            widget_type = text.to_string();
                            stable_id = format!("{}-{}", text.to_lowercase(), node.start_byte());
                            start_b = child.start_byte();
                            end_b = child.end_byte();
                            break;
                        }
                    }
                }
            }
        }
        
        if let Some(text) = text_opt {
            let mut props = serde_json::Map::new();
            let mut children = vec![];
            
            // Now parse properties and children from the arguments
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "arguments" {
                    let mut arg_cursor = child.walk();
                    for arg in child.children(&mut arg_cursor) {
                        if arg.kind() == "named_argument" {
                            let mut label_text = String::new();
                            let mut value_node_opt = None;
                            
                            let mut inner_cursor = arg.walk();
                            for inner in arg.children(&mut inner_cursor) {
                                if inner.kind() == "label" {
                                    if let Ok(l) = std::str::from_utf8(&source[inner.start_byte()..inner.end_byte()]) {
                                        label_text = l.trim_matches(|c| c == ':' || c == ' ').to_string();
                                    }
                                } else {
                                    value_node_opt = Some(inner);
                                }
                            }
                            
                            let is_child_prop = matches!(
                                label_text.as_str(),
                                "child" | "body" | "appBar" | "title" | "leading" | "trailing" | "bottom" | "floatingActionButton" | "content" | "separator" | "header" | "footer"
                            );
                            let is_children_prop = matches!(
                                label_text.as_str(),
                                "children" | "slivers" | "actions"
                            );

                            if let Some(val_node) = value_node_opt {
                                if is_child_prop {
                                    if let Some(child_widget) = walk_node(val_node, source) {
                                        if (label_text == "child" || label_text == "body") && (text.ends_with("Button") || text == "ElevatedButton") && child_widget.r#type == "Text" {
                                            if let Some(data) = child_widget.props.get("data") {
                                                props.insert("childText".to_string(), data.clone());
                                            }
                                        }
                                        children.push(child_widget);
                                    }
                                } else if is_children_prop {
                                    // It's a list!
                                    if val_node.kind() == "list_literal" {
                                        let mut elem_cursor = val_node.walk();
                                        for elem in val_node.children(&mut elem_cursor) {
                                            if let Some(child_widget) = walk_node(elem, source) {
                                                children.push(child_widget);
                                            }
                                        }
                                    }
                                } else {
                                    // Treat as a property (try to parse string, number, or identifier)
                                    if let Ok(prop_val) = std::str::from_utf8(&source[val_node.start_byte()..val_node.end_byte()]) {
                                        let clean = prop_val.trim_matches(|c| c == '"' || c == '\'');
                                        props.insert(label_text.clone(), serde_json::Value::String(clean.to_string()));
                                    }
                                }
                            }
                        } else if text == "Text" {
                            let arg_kind = arg.kind();
                            if arg_kind != "(" && arg_kind != ")" && arg_kind != "," && !props.contains_key("data") {
                                if let Ok(str_val) = std::str::from_utf8(&source[arg.start_byte()..arg.end_byte()]) {
                                    let clean_str = str_val.trim_matches(|c| c == '"' || c == '\'');
                                    props.insert("data".to_string(), serde_json::Value::String(clean_str.to_string()));
                                }
                            }
                        } else {
                            // If it's a positional child widget
                            if let Some(child_widget) = walk_node(arg, source) {
                                children.push(child_widget);
                            }
                        }
                    }
                }
            }
            
            return Some(WidgetNode {
                id: stable_id,
                r#type: widget_type,
                props: serde_json::Value::Object(props),
                start_byte: start_b,
                end_byte: end_b,
                children: if children.is_empty() { None } else { Some(children) },
            });
        }
    }
    
    // If not a recognized creation expression, just recurse down to find children
    let mut children = vec![];
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if let Some(child_widget) = walk_node(child, source) {
            children.push(child_widget);
        }
    }
    
    if !children.is_empty() {
        return Some(children.remove(0));
    }
    
    None
}

pub fn parse_dart_to_widget_tree(source_code: &str) -> Option<WidgetNode> {
    let mut parser = Parser::new();
    let language = tree_sitter_dart::LANGUAGE;
    parser.set_language(&language.into()).ok()?;

    let tree = parser.parse(source_code, None)?;
    let root_node = tree.root_node();
    let source_bytes = source_code.as_bytes();
    
    walk_node(root_node, source_bytes)
}

// Fase 3.5: Bidirectional Code Injection!
// This function parses the file, finds the parent node using the stable ID (which contains the start_byte),
// and injects the new widget code into the Dart file.
pub fn inject_widget_to_dart_file(file_path: &str, parent_id: &str, new_widget_type: &str, current_source: Option<&str>) -> Result<(), String> {
    let source_code = match current_source {
        Some(s) => s.to_string(),
        None => fs::read_to_string(file_path).map_err(|e| format!("Failed to read file: {}", e))?,
    };
    
    // parent_id format is "column-1240"
    let parts: Vec<&str> = parent_id.split('-').collect();
    if parts.len() != 2 {
        return Err("Invalid parent ID format".into());
    }
    
    let target_start_byte: usize = parts[1].parse()
        .map_err(|_| "Invalid byte offset in parent ID")?;

    let mut parser = Parser::new();
    let language = tree_sitter_dart::LANGUAGE;
    parser.set_language(&language.into()).unwrap();
    let tree = parser.parse(&source_code, None).ok_or("Failed to parse dart code")?;
    
    // Find the actual node corresponding to the parent ID.
    // In our simplified MVP, we just find the node covering `target_start_byte`.
    let root_node = tree.root_node();
    let parent_node = root_node.descendant_for_byte_range(target_start_byte, target_start_byte + 1)
        .ok_or("Could not find parent node in AST")?;
        
    // Now we need to figure out where to insert the new child.
    // In Dart, a widget's instantiation parent node is usually `creation_expression`.
    // The `parent_node` is just the `identifier` (e.g. "Column"). Its parent is `creation_expression`.
    let creation_expr = parent_node.parent()
        .ok_or("Parent node has no enclosing creation expression")?;
        
    // For MVP, we will do string replacement at the end of the creation expression, or inside `children: [...]`
    // To keep it simple and unbreakable, we just find the closing parenthesis of the widget's arguments
    // and insert the new widget before it.
    let mut insert_idx = creation_expr.end_byte();
    // Move backward to find the closing ')'
    let bytes = source_code.as_bytes();
    while insert_idx > 0 && bytes[insert_idx - 1] != b')' {
        insert_idx -= 1;
    }
    
    if insert_idx == 0 || bytes[insert_idx - 1] != b')' {
        return Err("Could not find closing parenthesis for parent widget".into());
    }
    
    // Determine the string to insert based on the new widget type
    let snippet = match new_widget_type {
        "Text" => "Text('New Text'), ",
        "ElevatedButton" => "ElevatedButton(onPressed: (){}, child: Text('Button')), ",
        "Container" => "Container(), ",
        "Column" => "Column(children: []), ",
        "Row" => "Row(children: []), ",
        _ => return Err(format!("Unsupported widget type for injection: {}", new_widget_type)),
    };
    
    // Splice the string!
    let mut new_source = String::new();
    new_source.push_str(&source_code[..insert_idx - 1]);
    
    // If it's a layout widget, we should technically inject inside `children: [` but to make it resilient for MVP,
    // if `children: [` doesn't exist, this simple slice might break.
    // A more advanced tree-sitter edit would safely append to the children list.
    // For now, we inject a generic `child:` or `children:` if it's missing, or just append the snippet if it's a layout.
    // We'll append the raw snippet. If the code already has children: [...], we can inject before the closing `]`.
    
    // Let's do a smarter regex-like heuristic around the insert area just for the MVP
    let substr = &source_code[target_start_byte..insert_idx];
    if substr.contains("children:") || substr.contains("children :") {
        // We find the closing ']'
        let mut bracket_idx = insert_idx - 1;
        while bracket_idx > 0 && bytes[bracket_idx] != b']' {
            bracket_idx -= 1;
        }
        if bytes[bracket_idx] == b']' {
            new_source = String::new();
            new_source.push_str(&source_code[..bracket_idx]);
            new_source.push_str(&format!("\n        {}", snippet));
            new_source.push_str(&source_code[bracket_idx..]);
        } else {
            new_source.push_str(&format!(", child: {}", snippet));
            new_source.push_str(&source_code[insert_idx - 1..]);
        }
    } else {
        // If no children array, inject as a single child
        new_source.push_str(&format!(", child: {}", snippet));
        new_source.push_str(&source_code[insert_idx - 1..]);
    }
    
    fs::write(file_path, new_source).map_err(|e| format!("Failed to save dart file: {}", e))?;
    
    Ok(())
}

pub fn update_widget_property(file_path: &str, node_id: &str, prop_key: &str, prop_val: &str, current_source: Option<&str>) -> Result<(), String> {
    let source_code = match current_source {
        Some(s) => s.to_string(),
        None => fs::read_to_string(file_path).map_err(|e| format!("Failed to read file: {}", e))?,
    };
    
    // node_id format is "text-1240"
    let parts: Vec<&str> = node_id.split('-').collect();
    if parts.len() != 2 {
        return Err("Invalid node ID format".into());
    }
    
    let target_start_byte: usize = parts[1].parse()
        .map_err(|_| "Invalid byte offset in node ID")?;

    let mut parser = Parser::new();
    let language = tree_sitter_dart::LANGUAGE;
    parser.set_language(&language.into()).unwrap();
    let tree = parser.parse(&source_code, None).ok_or("Failed to parse dart code")?;
    
    let root_node = tree.root_node();
    let parent_node = root_node.descendant_for_byte_range(target_start_byte, target_start_byte + 1)
        .ok_or("Could not find parent node in AST")?;
        
    let creation_expr = parent_node.parent()
        .ok_or("Parent node has no enclosing creation expression")?;
        
    // Find the arguments
    let mut args_node_opt = None;
    let mut cursor = creation_expr.walk();
    for child in creation_expr.children(&mut cursor) {
        if child.kind() == "arguments" {
            args_node_opt = Some(child);
            break;
        }
    }
    
    let args_node = args_node_opt.ok_or("No arguments found")?;
    
    let mut target_replace_start = 0;
    let mut target_replace_end = 0;
    
    let mut arg_cursor = args_node.walk();
    for arg in args_node.children(&mut arg_cursor) {
        if prop_key == "data" && arg.kind() == "string_literal" {
            target_replace_start = arg.start_byte();
            target_replace_end = arg.end_byte();
            break;
        } else if arg.kind() == "named_argument" {
            let mut label = String::new();
            let mut val_node = None;
            let mut inner_cursor = arg.walk();
            for inner in arg.children(&mut inner_cursor) {
                if inner.kind() == "label" {
                    if let Ok(l) = std::str::from_utf8(&source_code.as_bytes()[inner.start_byte()..inner.end_byte()]) {
                        label = l.trim_matches(|c| c == ':' || c == ' ').to_string();
                    }
                } else {
                    val_node = Some(inner);
                }
            }
            if label == prop_key {
                if let Some(vn) = val_node {
                    target_replace_start = vn.start_byte();
                    target_replace_end = vn.end_byte();
                    break;
                }
            }
        }
    }
    
    if target_replace_start > 0 {
        let mut new_source = String::new();
        new_source.push_str(&source_code[..target_replace_start]);
        
        // Wrap in quotes if it was a string literal originally, or if it's data
        if prop_key == "data" || prop_key == "title" || prop_key == "childText" || prop_key == "text" || prop_key == "tipografia" || prop_key == "color" || prop_key == "estilo" {
            new_source.push_str(&format!("'{}'", prop_val));
        } else {
            new_source.push_str(prop_val);
        }
        
        new_source.push_str(&source_code[target_replace_end..]);
        
        fs::write(file_path, new_source).map_err(|e| format!("Failed to save dart file: {}", e))?;
        return Ok(());
    } else {
        // Insert new property before the closing parenthesis of arguments!
        let insert_idx = args_node.end_byte() - 1;
        
        let mut new_source = String::new();
        new_source.push_str(&source_code[..insert_idx]);
        
        if prop_key == "data" {
            new_source.push_str(&format!("'{}', ", prop_val));
        } else if prop_key == "childText" || prop_key == "text" {
            new_source.push_str(&format!(", child: Text('{}')", prop_val));
        } else if prop_key == "title" || prop_key == "tipografia" || prop_key == "color" || prop_key == "estilo" {
            new_source.push_str(&format!(", {}: '{}'", prop_key, prop_val));
        } else {
            new_source.push_str(&format!(", {}: {}", prop_key, prop_val));
        }
        
        new_source.push_str(&source_code[insert_idx..]);
        
        fs::write(file_path, new_source).map_err(|e| format!("Failed to save dart file: {}", e))?;
        return Ok(());
    }
}

// ---------------------------------------------------------------------------
// Flutter Theme & Color Variable AST Engine (Tree-sitter)
// ---------------------------------------------------------------------------

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct ColorVariableItem {
    pub id: String,
    pub name: String,
    pub value: String,
    pub description: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct ThemeScanResult {
    pub variables: Vec<ColorVariableItem>,
    pub source_file: Option<String>,
}

fn get_flutter_material_color(name: &str) -> Option<&'static str> {
    match name {
        "deepPurple" => Some("#6750a4"),
        "purple" => Some("#9c27b0"),
        "blue" => Some("#2196f3"),
        "lightBlue" => Some("#03a9f4"),
        "cyan" => Some("#00bcd4"),
        "teal" => Some("#009688"),
        "green" => Some("#4caf50"),
        "lightGreen" => Some("#8bc34a"),
        "lime" => Some("#cddc39"),
        "yellow" => Some("#ffeb3b"),
        "amber" => Some("#ffc107"),
        "orange" => Some("#ff9800"),
        "deepOrange" => Some("#ff5722"),
        "red" => Some("#f44336"),
        "pink" => Some("#e91e63"),
        "indigo" => Some("#3f51b5"),
        "blueGrey" => Some("#607d8b"),
        "grey" => Some("#9e9e9e"),
        "brown" => Some("#795548"),
        "black" => Some("#000000"),
        "white" => Some("#ffffff"),
        _ => None,
    }
}

pub fn parse_color_from_node(node: Node, source: &[u8]) -> Option<String> {
    let kind = node.kind();
    if kind == "call_expression" {
        let mut callee_name = String::new();
        let mut args_node = None;
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "identifier" || child.kind() == "member_expression" {
                if let Ok(text) = child.utf8_text(source) {
                    callee_name = text.to_string();
                }
            } else if child.kind() == "arguments" {
                args_node = Some(child);
            }
        }

        if let Some(args) = args_node {
            let mut arg_cursor = args.walk();
            let positional_args: Vec<Node> = args
                .children(&mut arg_cursor)
                .filter(|c| c.kind() != "(" && c.kind() != ")" && c.kind() != ",")
                .collect();

            if callee_name == "Color" && !positional_args.is_empty() {
                let first_arg = positional_args[0];
                if let Ok(raw) = first_arg.utf8_text(source) {
                    let trimmed = raw.trim();
                    if trimmed.starts_with("0x") || trimmed.starts_with("0X") {
                        let hex_digits = &trimmed[2..];
                        if hex_digits.len() == 8 {
                            let a = &hex_digits[0..2];
                            let rgb = &hex_digits[2..8];
                            if a.eq_ignore_ascii_case("ff") {
                                return Some(format!("#{}", rgb.to_lowercase()));
                            } else {
                                return Some(format!("#{a}{rgb}", a = a.to_lowercase(), rgb = rgb.to_lowercase()));
                            }
                        } else if hex_digits.len() == 6 {
                            return Some(format!("#{}", hex_digits.to_lowercase()));
                        }
                    } else if let Ok(int_val) = trimmed.parse::<u64>() {
                        let hex_digits = format!("{:08x}", int_val);
                        if hex_digits.len() == 8 {
                            let a = &hex_digits[0..2];
                            let rgb = &hex_digits[2..8];
                            if a == "ff" {
                                return Some(format!("#{}", rgb));
                            } else {
                                return Some(format!("#{}{}", a, rgb));
                            }
                        }
                    }
                }
            } else if callee_name == "Color.fromRGBO" && positional_args.len() >= 3 {
                if let (Ok(r_str), Ok(g_str), Ok(b_str)) = (
                    positional_args[0].utf8_text(source),
                    positional_args[1].utf8_text(source),
                    positional_args[2].utf8_text(source),
                ) {
                    if let (Ok(r), Ok(g), Ok(b)) = (
                        r_str.trim().parse::<u8>(),
                        g_str.trim().parse::<u8>(),
                        b_str.trim().parse::<u8>(),
                    ) {
                        return Some(format!("#{:02x}{:02x}{:02x}", r, g, b));
                    }
                }
            } else if callee_name == "Color.fromARGB" && positional_args.len() >= 4 {
                if let (Ok(a_str), Ok(r_str), Ok(g_str), Ok(b_str)) = (
                    positional_args[0].utf8_text(source),
                    positional_args[1].utf8_text(source),
                    positional_args[2].utf8_text(source),
                    positional_args[3].utf8_text(source),
                ) {
                    if let (Ok(a), Ok(r), Ok(g), Ok(b)) = (
                        a_str.trim().parse::<u8>(),
                        r_str.trim().parse::<u8>(),
                        g_str.trim().parse::<u8>(),
                        b_str.trim().parse::<u8>(),
                    ) {
                        if a == 255 {
                            return Some(format!("#{:02x}{:02x}{:02x}", r, g, b));
                        } else {
                            return Some(format!("#{:02x}{:02x}{:02x}{:02x}", a, r, g, b));
                        }
                    }
                }
            }
        }
    } else if kind == "member_expression" {
        if let Ok(text) = node.utf8_text(source) {
            let parts: Vec<&str> = text.split('.').collect();
            if parts.len() == 2 && parts[0] == "Colors" {
                if let Some(color) = get_flutter_material_color(parts[1]) {
                    return Some(color.to_string());
                }
            }
        }
    }

    None
}

fn extract_named_arg<'a>(node: Node<'a>, source: &'a [u8]) -> (Option<String>, Option<Node<'a>>) {
    let mut label = None;
    let mut value_node = None;
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.kind() == "label" {
            if let Ok(text) = child.utf8_text(source) {
                label = Some(text.trim_matches(|c| c == ':' || c == ' ').to_string());
            }
        } else if child.kind() != ":" && child.kind() != "," {
            value_node = Some(child);
        }
    }
    (label, value_node)
}

pub fn extract_color_variables_from_dart(source_code: &str) -> Vec<ColorVariableItem> {
    let mut parser = Parser::new();
    let language = tree_sitter_dart::LANGUAGE;
    if parser.set_language(&language.into()).is_err() {
        return vec![];
    }

    let tree = match parser.parse(source_code, None) {
        Some(t) => t,
        None => return vec![],
    };

    let source = source_code.as_bytes();
    let mut variables = Vec::new();
    let mut seen_ids = std::collections::HashSet::new();

    let mut add_item = |name: &str, value: &str, desc: &str| {
        let clean_id = name.to_lowercase().replace(|c: char| !c.is_alphanumeric(), "-");
        if !seen_ids.contains(&clean_id) {
            seen_ids.insert(clean_id.clone());
            variables.push(ColorVariableItem {
                id: clean_id,
                name: name.to_string(),
                value: value.to_string(),
                description: desc.to_string(),
            });
        }
    };

    fn walk_for_colors<F>(node: Node, source: &[u8], add_item: &mut F)
    where
        F: FnMut(&str, &str, &str),
    {
        let kind = node.kind();

        if kind == "static_final_declaration" || kind == "initialized_identifier" {
            let mut name_opt = None;
            let mut val_node_opt = None;

            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "identifier" && name_opt.is_none() {
                    if let Ok(name) = child.utf8_text(source) {
                        name_opt = Some(name);
                    }
                } else if child.kind() == "call_expression" || child.kind() == "member_expression" {
                    val_node_opt = Some(child);
                }
            }

            if let (Some(name), Some(val_node)) = (name_opt, val_node_opt) {
                if let Some(color_hex) = parse_color_from_node(val_node, source) {
                    add_item(name, &color_hex, &format!("Variable Flutter: {}", name));
                }
            }
        }

        if kind == "call_expression" {
            let mut callee = "";
            let mut args_opt = None;
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "identifier" || child.kind() == "member_expression" {
                    if let Ok(c) = child.utf8_text(source) {
                        callee = c;
                    }
                } else if child.kind() == "arguments" {
                    args_opt = Some(child);
                }
            }

            if callee.starts_with("ColorScheme") {
                if let Some(args) = args_opt {
                    let mut arg_cursor = args.walk();
                    let mut has_seed = false;
                    for arg in args.children(&mut arg_cursor) {
                        if arg.kind() == "named_argument" {
                            let (label, val_node) = extract_named_arg(arg, source);
                            if let (Some(l), Some(v)) = (label, val_node) {
                                if let Some(hex) = parse_color_from_node(v, source) {
                                    if l == "seedColor" {
                                        has_seed = true;
                                        add_item("seedColor", &hex, "Material 3 seedColor");
                                        add_item("primary", &hex, "ColorScheme.primary (seedColor)");
                                    } else {
                                        add_item(&l, &hex, &format!("ColorScheme.{}", l));
                                    }
                                }
                            }
                        }
                    }
                    if has_seed {
                        add_item("secondary", "#625b71", "Material 3 secondary");
                        add_item("surface", "#fef7ff", "Material 3 surface");
                        add_item("background", "#fef7ff", "Material 3 background");
                        add_item("error", "#b3261e", "Material 3 error");
                    }
                }
            } else if callee == "ThemeData" {
                if let Some(args) = args_opt {
                    let mut arg_cursor = args.walk();
                    for arg in args.children(&mut arg_cursor) {
                        if arg.kind() == "named_argument" {
                            let (label, val_node) = extract_named_arg(arg, source);
                            if let (Some(l), Some(v)) = (label, val_node) {
                                if l.to_lowercase().contains("color") && l != "colorScheme" {
                                    if let Some(hex) = parse_color_from_node(v, source) {
                                        add_item(&l, &hex, &format!("ThemeData.{}", l));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            walk_for_colors(child, source, add_item);
        }
    }

    walk_for_colors(tree.root_node(), source, &mut add_item);
    variables
}

pub fn scan_flutter_theme_in_project(project_path: &str) -> ThemeScanResult {
    let p = std::path::Path::new(project_path);
    let candidates = [
        "lib/theme/app_colors.dart",
        "lib/theme/colors.dart",
        "lib/theme/app_theme.dart",
        "lib/theme/theme.dart",
        "lib/constants/colors.dart",
        "lib/colors.dart",
        "lib/theme.dart",
        "lib/main.dart",
    ];

    for rel in &candidates {
        let file_path = p.join(rel);
        if file_path.is_file() {
            if let Ok(content) = fs::read_to_string(&file_path) {
                let vars = extract_color_variables_from_dart(&content);
                if !vars.is_empty() {
                    return ThemeScanResult {
                        variables: vars,
                        source_file: Some(rel.to_string()),
                    };
                }
            }
        }
    }

    let lib_dir = p.join("lib");
    if lib_dir.is_dir() {
        if let Ok(entries) = fs::read_dir(&lib_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() && path.extension().map_or(false, |ext| ext == "dart") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if content.contains("Color(") || content.contains("Colors.") || content.contains("ColorScheme") {
                            let vars = extract_color_variables_from_dart(&content);
                            if !vars.is_empty() {
                                let rel = path.strip_prefix(p).unwrap_or(&path).to_string_lossy().to_string();
                                return ThemeScanResult {
                                    variables: vars,
                                    source_file: Some(rel),
                                };
                            }
                        }
                    }
                }
            }
        }
    }

    ThemeScanResult {
        variables: vec![],
        source_file: None,
    }
}

pub fn generate_flutter_colors_code(variables: &[ColorVariableItem]) -> String {
    let mut fields = Vec::new();
    for v in variables {
        let clean_hex = v.value.trim_start_matches('#').to_uppercase();
        let color_arg = if clean_hex.len() == 6 {
            format!("0xFF{}", clean_hex)
        } else if clean_hex.len() == 8 {
            let rgb = &clean_hex[..6];
            let a = &clean_hex[6..8];
            format!("0x{}{}", a, rgb)
        } else {
            format!("0xFF{:0<6}", clean_hex)
        };
        let desc = if v.description.is_empty() { &v.name } else { &v.description };
        fields.push(format!("  /// {}\n  static const Color {} = Color({});", desc, v.name, color_arg));
    }

    format!(
        "import 'package:flutter/material.dart';\n\n/// Variables y tokens de color del proyecto Flutter\n/// Generado por Vela Studio (Rust AST Engine)\nclass AppColors {{\n  AppColors._();\n\n{}\n}}\n",
        fields.join("\n\n")
    )
}

pub fn update_theme_color_in_file(file_path: &str, var_name: &str, new_hex: &str) -> Result<(), String> {
    let source_code = fs::read_to_string(file_path).map_err(|e| format!("Failed to read file: {}", e))?;
    let mut parser = Parser::new();
    let language = tree_sitter_dart::LANGUAGE;
    parser.set_language(&language.into()).map_err(|e| e.to_string())?;

    let tree = parser.parse(&source_code, None).ok_or("Failed to parse dart code")?;
    let source = source_code.as_bytes();

    fn find_var<'a>(node: Node<'a>, source: &'a [u8], var_name: &str) -> Option<Node<'a>> {
        let kind = node.kind();
        if kind == "static_final_declaration" || kind == "initialized_identifier" {
            let mut name_matches = false;
            let mut val_node = None;
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "identifier" && child.utf8_text(source).ok() == Some(var_name) {
                    name_matches = true;
                } else if child.kind() == "call_expression" || child.kind() == "member_expression" {
                    val_node = Some(child);
                }
            }
            if name_matches && val_node.is_some() {
                return val_node;
            }
        }
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if let Some(found) = find_var(child, source, var_name) {
                return Some(found);
            }
        }
        None
    }

    let target_val_node = find_var(tree.root_node(), source, var_name);

    if let Some(val_node) = target_val_node {
        let clean_hex = new_hex.trim_start_matches('#').to_uppercase();
        let color_arg = if clean_hex.len() == 6 {
            format!("Color(0xFF{})", clean_hex)
        } else if clean_hex.len() == 8 {
            let rgb = &clean_hex[..6];
            let a = &clean_hex[6..8];
            format!("Color(0x{}{})", a, rgb)
        } else {
            format!("Color(0xFF{})", clean_hex)
        };

        let start = val_node.start_byte();
        let end = val_node.end_byte();

        let mut new_source = String::new();
        new_source.push_str(&source_code[..start]);
        new_source.push_str(&color_arg);
        new_source.push_str(&source_code[end..]);

        fs::write(file_path, new_source).map_err(|e| format!("Failed to save dart file: {}", e))?;
        Ok(())
    } else {
        Err(format!("Variable '{}' not found in file", var_name))
    }
}

// ---------------------------------------------------------------------------
// Canvas & Screen AST Patching / Extraction Engine
// ---------------------------------------------------------------------------

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct CanvasWidgetElement {
    pub id: String,
    pub r#type: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    pub x: f64,
    pub y: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(rename = "textColor", skip_serializing_if = "Option::is_none")]
    pub text_color: Option<String>,
    #[serde(rename = "fontSize", skip_serializing_if = "Option::is_none")]
    pub font_size: Option<f64>,
    #[serde(rename = "borderRadius", skip_serializing_if = "Option::is_none")]
    pub border_radius: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct CanvasSyncResult {
    pub elements: Vec<CanvasWidgetElement>,
    pub layout_flow: String,
    pub screen_layout: String,
}

fn find_scaffold_node<'a>(node: Node<'a>, source: &'a [u8]) -> Option<Node<'a>> {
    let kind = node.kind();
    if kind == "creation_expression"
        || kind == "invocation_expression"
        || kind == "call_expression"
        || kind == "const_object_expression"
    {
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "identifier" || child.kind() == "type_identifier" {
                if let Ok(text) = child.utf8_text(source) {
                    if text == "Scaffold" {
                        return Some(node);
                    }
                }
            }
        }
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if let Some(found) = find_scaffold_node(child, source) {
            return Some(found);
        }
    }

    None
}

/// Surgically patches the `body: ...` property inside a Scaffold widget in source code,
/// preserving all existing functions, comments, imports, and other Scaffold properties.
pub fn patch_scaffold_body_in_source(source_code: &str, new_body: &str) -> Result<String, String> {
    let mut parser = Parser::new();
    let language = tree_sitter_dart::LANGUAGE;
    parser
        .set_language(&language.into())
        .map_err(|e| format!("Failed to set language: {:?}", e))?;

    let tree = parser
        .parse(source_code, None)
        .ok_or_else(|| "Failed to parse Dart source".to_string())?;

    let root_node = tree.root_node();
    let source_bytes = source_code.as_bytes();

    let scaffold_node = find_scaffold_node(root_node, source_bytes)
        .ok_or_else(|| "No Scaffold found in Dart source".to_string())?;

    let mut args_node = None;
    let mut cursor = scaffold_node.walk();
    for child in scaffold_node.children(&mut cursor) {
        if child.kind() == "arguments" {
            args_node = Some(child);
            break;
        }
    }

    let args = args_node.ok_or_else(|| "Scaffold has no arguments node".to_string())?;

    // Search for named_argument with label "body"
    let mut body_arg = None;
    let mut arg_cursor = args.walk();
    for child in args.children(&mut arg_cursor) {
        if child.kind() == "named_argument" {
            let mut is_body = false;
            let mut label_cursor = child.walk();
            for sub in child.children(&mut label_cursor) {
                if sub.kind() == "label" {
                    if let Ok(label_str) = sub.utf8_text(source_bytes) {
                        let clean = label_str.trim_matches(|c| c == ':' || c == ' ');
                        if clean == "body" {
                            is_body = true;
                            break;
                        }
                    }
                }
            }
            if is_body {
                body_arg = Some(child);
                break;
            }
        }
    }

    if let Some(body_node) = body_arg {
        let mut val_node = None;
        let mut inner_cursor = body_node.walk();
        for child in body_node.children(&mut inner_cursor) {
            if child.kind() != "label" && child.kind() != ":" {
                val_node = Some(child);
            }
        }

        if let Some(val) = val_node {
            let mut new_source = String::with_capacity(source_code.len() + new_body.len());
            new_source.push_str(&source_code[..val.start_byte()]);
            new_source.push_str(new_body.trim());
            new_source.push_str(&source_code[val.end_byte()..]);
            return Ok(new_source);
        }
    }

    // If body named_argument was not found, insert body before closing ')'
    let end_b = args.end_byte();
    if end_b > 0 && source_bytes[end_b - 1] == b')' {
        let insert_idx = end_b - 1;
        let mut new_source = String::with_capacity(source_code.len() + new_body.len() + 32);
        new_source.push_str(&source_code[..insert_idx]);

        let trimmed_before = source_code[..insert_idx].trim_end();
        if !trimmed_before.ends_with('(') && !trimmed_before.ends_with(',') {
            new_source.push_str(",\n      body: ");
        } else {
            new_source.push_str("\n      body: ");
        }
        new_source.push_str(new_body.trim());
        new_source.push_str(",\n    ");
        new_source.push_str(&source_code[insert_idx..]);
        return Ok(new_source);
    }

    Err("Could not find closing parenthesis in Scaffold arguments".to_string())
}

fn detect_layouts_from_ast(
    node: Node,
    source: &[u8],
    screen_layout: &mut String,
    layout_flow: &mut String,
) {
    let kind = node.kind();
    if kind == "creation_expression"
        || kind == "invocation_expression"
        || kind == "call_expression"
        || kind == "const_object_expression"
    {
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "identifier" || child.kind() == "type_identifier" {
                if let Ok(text) = child.utf8_text(source) {
                    match text {
                        "CustomScrollView" | "SliverAppBar" => {
                            *screen_layout = "scrollable".to_string();
                        }
                        "Stack" => {
                            *screen_layout = "stack".to_string();
                            *layout_flow = "none".to_string();
                        }
                        "Row" => {
                            if *layout_flow != "none" {
                                *layout_flow = "horizontal".to_string();
                            }
                        }
                        "Wrap" => {
                            if *layout_flow != "none" {
                                *layout_flow = "wrap".to_string();
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        detect_layouts_from_ast(child, source, screen_layout, layout_flow);
    }
}

/// Parses Dart source code and directly extracts elements and layout metadata for the Designer Canvas.
pub fn parse_dart_to_canvas_data(source_code: &str) -> CanvasSyncResult {
    let mut layout_flow = "vertical".to_string();
    let mut screen_layout = "scaffold".to_string();

    let mut parser = Parser::new();
    let language = tree_sitter_dart::LANGUAGE;
    if parser.set_language(&language.into()).is_ok() {
        if let Some(tree) = parser.parse(source_code, None) {
            let root_node = tree.root_node();
            let source_bytes = source_code.as_bytes();
            detect_layouts_from_ast(root_node, source_bytes, &mut screen_layout, &mut layout_flow);
        }
    }

    let root_ast = parse_dart_to_widget_tree(source_code);
    let mut elements = Vec::new();

    if let Some(root) = root_ast {
        fn collect_elements(node: &WidgetNode, elements: &mut Vec<CanvasWidgetElement>) {
            let mut el_type = None;
            let label = node
                .props
                .get("data")
                .or_else(|| node.props.get("label"))
                .or_else(|| node.props.get("labelText"))
                .or_else(|| node.props.get("childText"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            let mut font_size = node
                .props
                .get("fontSize")
                .and_then(|v| v.as_str().and_then(|s| s.parse::<f64>().ok()).or_else(|| v.as_f64()));

            let color = node
                .props
                .get("color")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            match node.r#type.as_str() {
                "Text" => {
                    if label.as_deref() != Some("Diseña tus widgets aquí")
                        && label.as_deref() != Some("No real AST found yet")
                    {
                        el_type = Some("text");
                    }
                }
                "ElevatedButton" | "FilledButton" | "OutlinedButton" | "TextButton" | "IconButton" => {
                    el_type = Some("button");
                }
                "TextField" | "TextFormField" => {
                    el_type = Some("input");
                }
                "Card" => {
                    el_type = Some("card");
                }
                "Icon" => {
                    el_type = Some("icon");
                    if font_size.is_none() {
                        font_size = Some(32.0);
                    }
                }
                "Container" => {
                    el_type = Some("container");
                }
                "Image" => {
                    el_type = Some("image");
                }
                "SizedBox" => {
                    // Only treat SizedBox as an element if it has children, NOT when it is just spacing!
                    let has_children = node.children.as_ref().map_or(false, |c| !c.is_empty());
                    if has_children {
                        el_type = Some("container");
                    }
                }
                _ => {}
            }

            if let Some(t) = el_type {
                let count = elements.len();
                let clean_id = if !node.id.is_empty() {
                    node.id.clone()
                } else {
                    format!("elem-{}", count + 1)
                };
                elements.push(CanvasWidgetElement {
                    id: clean_id,
                    r#type: t.to_string(),
                    name: node.r#type.clone(),
                    label,
                    x: 24.0,
                    y: 24.0 + (count as f64) * 60.0,
                    color,
                    text_color: None,
                    font_size,
                    border_radius: None,
                });
            }

            let is_leaf = matches!(
                node.r#type.as_str(),
                "Text" | "ElevatedButton" | "FilledButton" | "OutlinedButton" | "TextField" | "Icon"
            );

            if !is_leaf {
                if let Some(children) = &node.children {
                    for child in children {
                        collect_elements(child, elements);
                    }
                }
            }
        }

        collect_elements(&root, &mut elements);
    }

    CanvasSyncResult {
        elements,
        layout_flow,
        screen_layout,
    }
}

/// Generates a complete canonical Flutter StatelessWidget screen.
pub fn generate_flutter_screen_code(
    class_name: &str,
    screen_title: &str,
    layout_type: &str,
) -> String {
    match layout_type {
        "scrollable" => format!(
r#"import 'package:flutter/material.dart';

class {class_name} extends StatelessWidget {{
  const {class_name}({{super.key}});

  @override
  Widget build(BuildContext context) {{
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 180.0,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text('{screen_title}'),
              centerTitle: true,
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Contenido con Scroll (Slivers)',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  ...List.generate(
                    8,
                    (index) => Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(child: Text('${{index + 1}}')),
                        title: Text('Elemento ${{index + 1}}'),
                        subtitle: const Text('Desplaza para ver el efecto de la barra superior'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }}
}}
"#),
        "stack" => format!(
r#"import 'package:flutter/material.dart';

class {class_name} extends StatelessWidget {{
  const {class_name}({{super.key}});

  @override
  Widget build(BuildContext context) {{
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF1E1E2E), Color(0xFF11111B)],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '{screen_title}',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Pantalla inmersiva construida con Stack y capas superpuestas.',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {{}},
                      child: const Text('Comenzar'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }}
}}
"#),
        _ => format!(
r#"import 'package:flutter/material.dart';

class {class_name} extends StatelessWidget {{
  const {class_name}({{super.key}});

  @override
  Widget build(BuildContext context) {{
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('{screen_title}'),
        centerTitle: true,
        elevation: 0,
      ),
      body: const SafeArea(
        child: SizedBox.shrink(),
      ),
    );
  }}
}}
"#),
    }
}

// ---------------------------------------------------------------------------
// Screen Scanner & Detection Engine
// ---------------------------------------------------------------------------

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct DetectedScreen {
    pub id: String,
    pub name: String,
    #[serde(rename = "className")]
    pub class_name: String,
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "relativePath")]
    pub relative_path: String,
    #[serde(rename = "widgetType")]
    pub widget_type: String,
    #[serde(rename = "screenLayout")]
    pub screen_layout: String,
    #[serde(rename = "layoutFlow")]
    pub layout_flow: String,
    pub elements: Vec<CanvasWidgetElement>,
}

pub fn pascal_to_title(pascal: &str) -> String {
    let mut result = String::new();
    let chars: Vec<char> = pascal.chars().collect();
    for (i, &c) in chars.iter().enumerate() {
        if i > 0 && c.is_uppercase() {
            let prev = chars[i - 1];
            let next_is_lower = i + 1 < chars.len() && chars[i + 1].is_lowercase();
            if prev.is_lowercase() || (prev.is_uppercase() && next_is_lower) {
                result.push(' ');
            }
        }
        result.push(c);
    }
    result
}

fn is_screen_file_candidate(path: &std::path::Path) -> bool {
    let path_str = path.to_string_lossy();
    if !path_str.ends_with(".dart") {
        return false;
    }

    let lower = path_str.to_lowercase();
    let ignored_segments = [
        "/theme/", "/styles/", "/colors/", "/constants/", "/models/", "/model/",
        "/services/", "/service/", "/bloc/", "/blocs/", "/cubit/", "/cubits/",
        "/providers/", "/provider/", "/utils/", "/util/", "/helpers/", "/generated/",
        "/.dart_tool/", "/test/", "/build/",
    ];
    for seg in &ignored_segments {
        if lower.contains(seg) {
            return false;
        }
    }

    let ignored_suffixes = [
        ".g.dart", ".freezed.dart", "_test.dart", "_colors.dart", "_theme.dart",
        "_styles.dart", "_constants.dart", "_model.dart", "_service.dart",
        "_bloc.dart", "_cubit.dart", "_provider.dart", "_state.dart", "_event.dart",
    ];
    for suf in &ignored_suffixes {
        if lower.ends_with(suf) {
            return false;
        }
    }

    true
}

/// Scans a Flutter project's `lib` directory and detects all UI screens and their visual elements.
pub fn scan_project_screens(project_path: &str) -> Result<Vec<DetectedScreen>, String> {
    let root = std::path::Path::new(project_path);
    if !root.exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    let lib_dir = root.join("lib");
    let scan_dir = if lib_dir.is_dir() { lib_dir } else { root.to_path_buf() };

    let mut screens = Vec::new();

    let class_regex = regex::Regex::new(
        r"class\s+([A-Za-z0-9_]+)\s+extends\s+(StatelessWidget|StatefulWidget|ConsumerWidget|HookWidget)"
    ).map_err(|e| e.to_string())?;

    let walker = ignore::WalkBuilder::new(&scan_dir)
        .standard_filters(true)
        .hidden(true)
        .build();

    for entry in walker.flatten() {
        let path = entry.path();
        if path.is_file() && is_screen_file_candidate(path) {
            if let Ok(content) = fs::read_to_string(path) {
                // Must have a build method or Scaffold to be considered a visual screen
                if !content.contains("Widget build") && !content.contains("Scaffold") {
                    continue;
                }

                let mut matches: Vec<(String, String)> = Vec::new();
                for caps in class_regex.captures_iter(&content) {
                    if let (Some(c), Some(w)) = (caps.get(1), caps.get(2)) {
                        let name = c.as_str().to_string();
                        let widget = w.as_str().to_string();
                        if !name.is_empty() && !name.starts_with('_') {
                            matches.push((name, widget));
                        }
                    }
                }

                if matches.is_empty() {
                    continue;
                }

                let chosen = if matches.len() == 1 {
                    &matches[0]
                } else {
                    matches
                        .iter()
                        .find(|(name, _)| {
                            name.ends_with("Screen") || name.ends_with("Page") || name.ends_with("View")
                        })
                        .or_else(|| matches.iter().find(|(name, _)| name != "MyApp"))
                        .unwrap_or(&matches[0])
                };

                let class_name = chosen.0.clone();
                let widget_type = chosen.1.clone();

                let file_name = path
                    .file_name()
                    .map_or_else(|| "screen.dart".to_string(), |n| n.to_string_lossy().to_string());

                let rel_path = path
                    .strip_prefix(root)
                    .unwrap_or(path)
                    .to_string_lossy()
                    .to_string();

                let abs_path = path.to_string_lossy().to_string();
                let name = pascal_to_title(&class_name);
                let id = format!("screen-{}", rel_path.replace(['/', '\\', '.'], "-"));

                let sync_data = parse_dart_to_canvas_data(&content);

                screens.push(DetectedScreen {
                    id,
                    name,
                    class_name,
                    file_name,
                    file_path: abs_path,
                    relative_path: rel_path,
                    widget_type,
                    screen_layout: sync_data.screen_layout,
                    layout_flow: sync_data.layout_flow,
                    elements: sync_data.elements,
                });
            }
        }
    }

    // Sort screens: main.dart first, then alphabetically by name
    screens.sort_by(|a, b| {
        let a_is_main = a.file_name == "main.dart";
        let b_is_main = b.file_name == "main.dart";
        if a_is_main && !b_is_main {
            std::cmp::Ordering::Less
        } else if !a_is_main && b_is_main {
            std::cmp::Ordering::Greater
        } else {
            a.name.cmp(&b.name)
        }
    });

    Ok(screens)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_patch_scaffold_body() {
        let original = r#"import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  void customHelper() {
    print("Keep this intact!");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text('Home')),
      body: const SafeArea(
        child: SizedBox.shrink(),
      ),
    );
  }
}
"#;
        let new_body = r#"SafeArea(
        child: Text('Updated by Vela Engine'),
      )"#;

        let patched = patch_scaffold_body_in_source(original, new_body).unwrap();
        assert!(patched.contains("Updated by Vela Engine"));
        assert!(patched.contains("void customHelper()"));
        assert!(patched.contains("Keep this intact!"));
        assert!(patched.contains("backgroundColor: Colors.white"));
        assert!(patched.contains("appBar: AppBar(title: const Text('Home'))"));
    }

    #[test]
    fn test_parse_canvas_data() {
        let code = r#"
class DemoScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Text('Hello Vela'),
          ElevatedButton(onPressed: () {}, child: Text('Submit')),
        ],
      ),
    );
  }
}
"#;
        let result = parse_dart_to_canvas_data(code);
        assert_eq!(result.screen_layout, "scaffold");
        assert_eq!(result.layout_flow, "vertical");
        assert_eq!(result.elements.len(), 2);
        assert_eq!(result.elements[0].r#type, "text");
        assert_eq!(result.elements[0].label, Some("Hello Vela".to_string()));
        assert_eq!(result.elements[1].r#type, "button");
    }

    #[test]
    fn test_extract_color_variables() {
        let code = r#"
class AppColors {
  static const Color primary = Color(0xFF6750A4);
  static const Color onPrimary = Color(0xffffffff);
  static const secondary = Color(0xFF625B71);
  final error = Colors.red;
}
"#;
        let vars = extract_color_variables_from_dart(code);
        assert_eq!(vars.len(), 4);
        assert_eq!(vars[0].name, "primary");
        assert_eq!(vars[0].value, "#6750a4");
        assert_eq!(vars[1].name, "onPrimary");
        assert_eq!(vars[1].value, "#ffffff");
        assert_eq!(vars[2].name, "secondary");
        assert_eq!(vars[2].value, "#625b71");
        assert_eq!(vars[3].name, "error");
        assert_eq!(vars[3].value, "#f44336");
    }

    #[test]
    fn test_color_scheme_parsing() {
        let code = r#"
final theme = ThemeData(
  primaryColor: Color(0xFF0284C7),
  colorScheme: ColorScheme.fromSeed(seedColor: Color(0xFF6750A4)),
);
"#;
        let vars = extract_color_variables_from_dart(code);
        assert!(vars.iter().any(|v| v.name == "primaryColor" && v.value == "#0284c7"));
        assert!(vars.iter().any(|v| v.name == "seedColor" && v.value == "#6750a4"));
    }

    #[test]
    fn test_generate_flutter_colors_code() {
        let vars = vec![
            ColorVariableItem {
                id: "primary".into(),
                name: "primary".into(),
                value: "#6750A4".into(),
                description: "Primary brand".into(),
            },
        ];
        let code = generate_flutter_colors_code(&vars);
        assert!(code.contains("class AppColors"));
        assert!(code.contains("Color(0xFF6750A4)"));
    }

    #[test]
    fn test_pascal_to_title() {
        assert_eq!(pascal_to_title("HomeScreen"), "Home Screen");
        assert_eq!(pascal_to_title("LoginScreen"), "Login Screen");
        assert_eq!(pascal_to_title("UserProfilePage"), "User Profile Page");
        assert_eq!(pascal_to_title("MyHomePage"), "My Home Page");
    }

    #[test]
    fn test_scan_project_screens() {
        let temp_dir = std::env::temp_dir().join(format!("vela_test_screens_{}", uuid::Uuid::new_v4()));
        let lib_dir = temp_dir.join("lib");
        let screens_dir = lib_dir.join("screens");
        let theme_dir = lib_dir.join("theme");
        fs::create_dir_all(&screens_dir).unwrap();
        fs::create_dir_all(&theme_dir).unwrap();

        // 1. main.dart with Scaffold
        let main_code = r#"
import 'package:flutter/material.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return const MaterialApp(home: MyHomePage());
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});
  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: const Center(child: Text('Welcome')),
    );
  }
}
"#;
        fs::write(lib_dir.join("main.dart"), main_code).unwrap();

        // 2. screens/profile_screen.dart
        let profile_code = r#"
import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Text('Profile'),
          ElevatedButton(onPressed: () {}, child: Text('Save')),
        ],
      ),
    );
  }
}
"#;
        fs::write(screens_dir.join("profile_screen.dart"), profile_code).unwrap();

        // 3. theme/colors.dart (should be ignored)
        let theme_code = r#"
import 'package:flutter/material.dart';
class AppColors {
  static const primary = Colors.blue;
}
"#;
        fs::write(theme_dir.join("colors.dart"), theme_code).unwrap();

        let screens = scan_project_screens(temp_dir.to_str().unwrap()).unwrap();
        assert_eq!(screens.len(), 2);
        assert_eq!(screens[0].file_name, "main.dart");
        assert_eq!(screens[0].class_name, "MyHomePage");
        assert_eq!(screens[0].name, "My Home Page");

        assert_eq!(screens[1].file_name, "profile_screen.dart");
        assert_eq!(screens[1].class_name, "ProfileScreen");
        assert_eq!(screens[1].name, "Profile Screen");
        assert_eq!(screens[1].elements.len(), 2);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}



