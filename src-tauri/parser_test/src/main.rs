mod ast_parser {
    include!("../../src/ast_parser.rs");
}
fn main() {
    let source = r#"
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(children: [
        Text('A random idea:'),
        Text(appState.current.asLowerCase),
    ]);
  }
}
    "#;
    let res = ast_parser::parse_dart_to_widget_tree(source);
    println!("{}", serde_json::to_string_pretty(&res).unwrap());
}
