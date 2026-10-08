# ⛵ Vela IDE

**Vela IDE** es un entorno de desarrollo integrado (IDE) ligero, rápido y moderno construido con **Tauri v2**, **React 19**, **TypeScript** y **Rust**, enfocado principalmente en el desarrollo de aplicaciones móviles con **Flutter** y **Dart**.

---

## 🛠️ Stack Tecnológico

- **Desktop Shell / Backend:** [Tauri v2](https://v2.tauri.app/) (Rust)
  - PTY nativo multiplataforma (`portable-pty`) para la terminal integrada.
  - Integración nativa con Dart LSP (*Language Server Protocol*).
  - API de sistema de archivos, diálogos nativos y detección de herramientas (Git, Flutter SDK).
- **Frontend:**
  - [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vite.dev/) + [Tailwind CSS v4](https://tailwindcss.com/)
  - [Monaco Editor](https://microsoft.github.io/monaco-editor/) (motor de VS Code) con soporte LSP Dart
  - [xterm.js](https://xtermjs.org/) para emulación de terminal completa
  - [Zustand](https://github.com/pmndrs/zustand) para gestión de estado del workspace

---

## 📋 Requisitos Previos

### 🐧 En Linux (Ubuntu / Debian)

1. **Dependencias del sistema para Tauri:**
   ```bash
   sudo apt update
   sudo apt install -y build-essential curl wget file libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev
   ```
2. **Rust:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```
3. **Node.js y pnpm:**
   ```bash
   # Node.js 18 o superior
   npm install -g pnpm
   ```
4. **Flutter / Dart SDK** (opcional para compilar el IDE, necesario para usar las herramientas de Flutter).

---

### 🪟 En Windows

1. **Visual Studio C++ Build Tools:**
   - Instala [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) seleccionando la carga de trabajo **"Desarrollo para el escritorio con C++"** (MSVC toolchain).
2. **WebView2:**
   - Ya viene instalado en Windows 10 y 11.
3. **Rust:**
   - Descarga e instala desde [rustup.rs](https://rustup.rs/) (elige la opción MSVC por defecto).
4. **Node.js y pnpm:**
   - Instala Node.js 18+ desde [nodejs.org](https://nodejs.org/) y corre:
     ```powershell
     npm install -g pnpm
     ```
5. **Flutter SDK:**
   - Descarga el SDK de Flutter y asegúrate de añadir su carpeta `bin` a la variable de entorno `PATH`.

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Instalar dependencias
```bash
pnpm install
```

### 2. Ejecutar en modo desarrollo
Inicia tanto el servidor de desarrollo de Vite como la ventana nativa de Tauri:
```bash
pnpm tauri dev
```

> **Nota:** La primera vez que lo ejecutas descargará y compilará las dependencias de Rust (esto toma unos minutos, luego queda cacheado en `src-tauri/target`).

### 3. Compilar para producción (Instaladores / Ejecutables)
```bash
pnpm tauri build
```
- **En Linux:** Generará paquetes `.deb` y `.AppImage` en `src-tauri/target/release/bundle/`.
- **En Windows:** Generará instaladores `.msi` y ejecutables `.exe` en `src-tauri\target\release\bundle\`.

---

## 📂 Estructura Principal del Proyecto

```
vela-ide/
├── src/                          # Código fuente de la interfaz React
│   ├── app/                      # Entrada de la app
│   ├── components/               # Componentes UI (Shadcn/Radix)
│   ├── features/workspace/       # Núcleo del IDE
│   │   ├── api/                  # Clientes IPC y Dart LSP
│   │   ├── model/                # Zustand store (pestañas, proyectos, árbol)
│   │   └── ui/                   # Editor Monaco, terminal xterm, explorador, wizard
├── src-tauri/                    # Backend nativo en Rust
│   ├── src/
│   │   ├── lib.rs                # Comandos IPC (LSP, PTY, Flutter CLI, FS)
│   │   └── main.rs               # Entrypoint de la aplicación de escritorio
│   ├── Cargo.toml                # Dependencias Rust
│   └── tauri.conf.json           # Configuración de ventana y empaquetado Tauri
```

