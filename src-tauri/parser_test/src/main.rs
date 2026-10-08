use tree_sitter::Parser;

fn main() {
    let source = r#"
        void foo() {
            var x = const Text('Hello');
        }
    "#;
    let mut parser = Parser::new();
    parser.set_language(&tree_sitter_dart::LANGUAGE.into()).unwrap();
    let tree = parser.parse(source, None).unwrap();
    println!("{}", tree.root_node().to_sexp());
}
