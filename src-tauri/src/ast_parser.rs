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
                    match text {
                        "Scaffold" | "AppBar" | "Container" | "Column" | "Row" | "Text" | "ElevatedButton" | "Center" | "Padding" | "SizedBox" => {
                            text_opt = Some(text.to_string());
                            widget_type = text.to_string();
                            stable_id = format!("{}-{}", text.to_lowercase(), node.start_byte());
                            start_b = child.start_byte();
                            end_b = child.end_byte();
                            break;
                        }
                        _ => {}
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
                            // Example: body: Container(...)
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
                            
                            if let Some(val_node) = value_node_opt {
                                if label_text == "child" || label_text == "body" || label_text == "appBar" {
                                    if let Some(child_widget) = walk_node(val_node, source) {
                                        if label_text == "child" && text == "ElevatedButton" && child_widget.r#type == "Text" {
                                            if let Some(data) = child_widget.props.get("data") {
                                                props.insert("childText".to_string(), data.clone());
                                            }
                                        }
                                        children.push(child_widget);
                                    }
                                } else if label_text == "children" {
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
    
    let parsed_tree = walk_node(root_node, source_bytes);
    
    parsed_tree.or_else(|| {
        Some(WidgetNode {
            id: "root-0".to_string(),
            r#type: "Scaffold".to_string(),
            props: serde_json::json!({ "backgroundColor": "#fafafa" }),
            start_byte: 0,
            end_byte: 0,
            children: Some(vec![WidgetNode {
                id: "text-0".to_string(),
                r#type: "Text".to_string(),
                props: serde_json::json!({ "data": "No real AST found yet", "fontSize": 18 }),
                start_byte: 0,
                end_byte: 0,
                children: None,
            }]),
        })
    })
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
