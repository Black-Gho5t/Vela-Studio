# ⛵ Vela IDE - Arquitectura Interna

Este documento describe cómo están conectadas las entrañas de **Vela IDE**, divididas en sus dos pilares principales: **Vela Engine** (Rust Backend) y **Vela Designer** (React Frontend).

---

## 1. Auto-Instalación del Motor (Flutter SDK)

Para asegurar que Vela funcione *"out of the box"* sin pedir configuraciones al usuario, Rust gestiona la instalación del SDK localmente en `~/.vela/flutter`.

### Backend (Rust - `flutter_installer.rs`)
Buscamos el binario local o lo descargamos:
```rust
// Si no encuentra Flutter en el sistema, descarga y extrae el ZIP de Google
pub async fn download_and_install_flutter<F>(on_progress: F) -> Result<String, String> 
where F: Fn(String) + Send + 'static {
    let url = "https://storage.googleapis.com/.../flutter_windows_...zip";
    // Usa Command::new("curl") y Command::new("tar")
    // Emite eventos de progreso: on_progress("Extrayendo SDK...")
}
```

### Frontend (React - `vela-setup.tsx`)
Intercepta el arranque del IDE. Si no hay SDK, muestra una pantalla de carga y se comunica con Tauri:
```tsx
const handleInstall = async () => {
  // Escuchamos los mensajes que escupe Rust
  const unlisten = await listen<string>("flutter-install-progress", (event) => {
    setProgressMsg(event.payload); 
  });
  // Lanzamos el comando
  await invoke("install_flutter_sdk");
};
```

---

## 2. Vela Daemon (Hot Reload Nativo)

Vela usa el protocolo *JSON-RPC* de la máquina virtual de Dart para inyectar recargas al instante, sin recargar la terminal.

### Backend (Rust - `lib.rs`)
Ejecutamos `flutter run --machine` y atrapamos su entrada (`stdin`) en el estado global para poder enviarle comandos:
```rust
struct FlutterDaemonState {
    stdin: Arc<tokio::sync::Mutex<Option<ChildStdin>>>,
}

#[tauri::command]
async fn send_flutter_daemon_message(state: State<'_, FlutterDaemonState>, message: String) {
    let mut stdin_lock = state.stdin.lock().await;
    let stdin = stdin_lock.as_mut().unwrap();
    // Le escribimos a la consola oculta de Flutter
    stdin.write_all(format!("{}\n", message).as_bytes()).await;
}
```

### Frontend (React - `workspace-toolbar.tsx`)
El botón de "Refresh" (Cyan) inyecta directamente el comando de Hot Reload:
```tsx
const handleHotReload = async () => {
  await invoke("send_flutter_daemon_message", { 
    message: JSON.stringify({ id: 1, method: "app.restart", params: { fullRestart: false } }) 
  });
};
```

---

## 3. Vela Designer y Sincronización AST (En progreso)

El canvas interactivo usa `@dnd-kit` para Drag & Drop y `tree-sitter` (Rust) para leer el código en tiempo real.

### Backend (Rust - `ast_parser.rs`)
Compilamos el analizador nativo (parser) de C/Rust para leer archivos `.dart` a la velocidad de la luz:
```rust
use tree_sitter::Parser;

pub fn parse_dart_to_widget_tree(source_code: &str) -> Option<WidgetNode> {
    let mut parser = Parser::new();
    let language = tree_sitter_dart::LANGUAGE;
    parser.set_language(&language.into()).unwrap();

    let tree = parser.parse(source_code, None)?;
    // Aquí analizaremos el árbol para convertir el código en nodos JSON:
    // "Scaffold", "Container", "Column"...
}
```

### Frontend (React - `vela-designer.tsx`)
Recibe el JSON de Rust y pinta la pantalla del celular simulado. Además, detecta cuando arrastras componentes:
```tsx
// Llama al analizador rápido de Rust cuando el código (Monaco) cambia
React.useEffect(() => {
  invoke<string>("parse_dart_file", { sourceCode: code }).then(json => {
    setTree(JSON.parse(json)); // Pinta el canvas
  });
}, [code]);

// DND Kit: Cuando sueltas un Widget en la pantalla
const handleDragEnd = (event: DragEndEvent) => {
  const { over, active } = event;
  if (over) { // Se soltó sobre un Container o Column
    // Añadir nuevo nodo al árbol visual (Pronto enviará esto de regreso a Rust para editar el código)
  }
};
```
