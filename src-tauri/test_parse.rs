use tree_sitter::Parser;

fn main() {
    let source_code = r#"
import 'package:flutter/material.dart';
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: Text("Hello")),
      body: Container(
        child: Column(
          children: [
            Text('Child 1'),
          ]
        )
      )
    );
  }
}
    "#;

    let mut parser = Parser::new();
    let language = tree_sitter_dart::LANGUAGE;
    parser.set_language(&language.into()).unwrap();

    let tree = parser.parse(source_code, None).unwrap();
    let root_node = tree.root_node();

    fn print_node(node: tree_sitter::Node, source: &[u8], depth: usize) {
        let indent = "  ".repeat(depth);
        let kind = node.kind();
        let text = if node.child_count() == 0 {
            std::str::from_utf8(&source[node.start_byte()..node.end_byte()])
                .unwrap()
                .to_string()
        } else {
            "".to_string()
        };
        println!("{}- {} {}", indent, kind, text);

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            print_node(child, source, depth + 1);
        }
    }

    print_node(root_node, source_code.as_bytes(), 0);
}
