mod flutter_installer;
mod ast_parser;

use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{ChildStdin, Command as TokioCommand};

#[derive(Serialize, Deserialize)]
struct FileNode {
    id: String,
    name: String,
    path: String,
    #[serde(rename = "type")]
    node_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    children: Option<Vec<FileNode>>,
}

struct LspState {
    stdin: Arc<tokio::sync::Mutex<Option<ChildStdin>>>,
}

struct FlutterDaemonState {
    stdin: Arc<tokio::sync::Mutex<Option<ChildStdin>>>,
}

struct TerminalState {
    writer: Arc<tokio::sync::Mutex<Option<Box<dyn std::io::Write + Send>>>>,
    pty_pair: Arc<tokio::sync::Mutex<Option<portable_pty::PtyPair>>>,
}

fn resolve_dart_path() -> String {
    if let Some(flutter_bin) = flutter_installer::get_flutter_bin() {
        // If flutter bin is found, dart is usually next to it in bin/cache/dart-sdk/bin
        // but flutter bin itself can invoke dart, or we just look up dart in the standard flutter cache:
        let mut path = std::path::PathBuf::from(flutter_bin);
        path.pop(); // remove 'flutter' or 'flutter.bat'
        path.push("cache");
        path.push("dart-sdk");
        path.push("bin");
        path.push(if cfg!(target_os = "windows") { "dart.exe" } else { "dart" });
        if path.exists() {
            return path.to_string_lossy().to_string();
        }
    }
    // Fallback to naive 'dart'
    "dart".to_string()
}

fn resolve_flutter_path() -> String {
    flutter_installer::get_flutter_bin().unwrap_or_else(|| "flutter".to_string())
}

#[tauri::command]
async fn start_lsp(app: AppHandle, state: State<'_, LspState>) -> Result<(), String> {
    let dart_path = resolve_dart_path();
    println!("💡 Resolved Dart Path: {}", dart_path);

    let mut tokio_cmd = if cfg!(target_os = "windows") && dart_path.to_lowercase().ends_with(".bat") {
        let mut c = TokioCommand::new("cmd");
        c.arg("/C").arg(&dart_path);
        c
    } else {
        TokioCommand::new(&dart_path)
    };

    let mut child = tokio_cmd
        .arg("language-server")
        .arg("--protocol=lsp")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Dart LSP: {}", e))?;

    let stdin = child.stdin.take().ok_or("Failed to open stdin")?;
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    let mut state_stdin = state.stdin.lock().await;
    *state_stdin = Some(stdin);

    // Read stdout
    let app_handle = app.clone();
    tokio::spawn(async move {
        use tokio::io::AsyncReadExt;
        let mut reader = BufReader::new(stdout);
        loop {
            let mut line = String::new();
            let mut content_length = None;

            // Read headers until we hit empty line (\r\n)
            loop {
                line.clear();
                match reader.read_line(&mut line).await {
                    Ok(0) => return, // EOF
                    Ok(_) => {
                        let trimmed = line.trim();
                        if trimmed.is_empty() {
                            break; // End of headers
                        }
                        if trimmed.to_lowercase().starts_with("content-length:") {
                            if let Some(len_str) = trimmed.split(':').nth(1) {
                                if let Ok(len) = len_str.trim().parse::<usize>() {
                                    content_length = Some(len);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("LSP Read Line Error: {}", e);
                        return;
                    }
                }
            }

            // Read body based on Content-Length
            if let Some(len) = content_length {
                let mut body_buf = vec![0u8; len];
                match reader.read_exact(&mut body_buf).await {
                    Ok(_) => {
                        match String::from_utf8(body_buf) {
                            Ok(msg) => {
                                let _ = app_handle.emit("lsp-stdout-message", msg);
                            }
                            Err(e) => {
                                eprintln!("LSP UTF-8 Decode Error: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("LSP Read Exact Error: {}", e);
                        return;
                    }
                }
            }
        }
    });

    // Read stderr line-by-line
    let app_handle = app.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr);
        let mut line = String::new();
        while let Ok(n) = reader.read_line(&mut line).await {
            if n == 0 {
                break;
            }
            let _ = app_handle.emit("lsp-stderr", line.clone());
            line.clear();
        }
    });

    Ok(())
}

#[tauri::command]
async fn send_lsp_message(state: State<'_, LspState>, message: String) -> Result<(), String> {
    let mut stdin_lock = state.stdin.lock().await;
    if let Some(stdin) = stdin_lock.as_mut() {
        let formatted = format!("Content-Length: {}\r\n\r\n{}", message.len(), message);
        stdin
            .write_all(formatted.as_bytes())
            .await
            .map_err(|e| e.to_string())?;
        stdin.flush().await.map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("LSP not started".to_string())
    }
}

#[tauri::command]
async fn start_terminal(
    app: AppHandle,
    state: State<'_, TerminalState>,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    use portable_pty::{native_pty_system, CommandBuilder, PtySize};
    use std::io::Read;

    let pty_system = native_pty_system();
    let pty_pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let shell = if cfg!(target_os = "windows") {
        "powershell.exe".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| {
            if std::path::Path::new("/bin/bash").exists() {
                "/bin/bash".to_string()
            } else {
                "/bin/sh".to_string()
            }
        })
    };

    let mut cmd = CommandBuilder::new(&shell);
    if !cfg!(target_os = "windows") {
        cmd.arg("-l");
    }

    let _child = pty_pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    let reader = pty_pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pty_pair.master.take_writer().map_err(|e| e.to_string())?;

    let mut state_writer = state.writer.lock().await;
    *state_writer = Some(writer);

    let mut state_pair = state.pty_pair.lock().await;
    *state_pair = Some(pty_pair);

    let app_handle = app.clone();
    tokio::task::spawn_blocking(move || {
        let mut reader = reader;
        let mut buffer = [0u8; 4096];
        while let Ok(n) = reader.read(&mut buffer) {
            if n == 0 {
                break;
            }
            let text = String::from_utf8_lossy(&buffer[..n]).to_string();
            let _ = app_handle.emit("terminal-stdout", text);
        }
    });

    Ok(())
}

#[tauri::command]
async fn write_terminal(state: State<'_, TerminalState>, data: String) -> Result<(), String> {
    use std::io::Write;
    let mut writer_lock = state.writer.lock().await;
    if let Some(writer) = writer_lock.as_mut() {
        writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Terminal not started".to_string())
    }
}

#[tauri::command]
async fn resize_terminal(
    state: State<'_, TerminalState>,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    use portable_pty::PtySize;
    let pair_lock = state.pty_pair.lock().await;
    if let Some(pair) = pair_lock.as_ref() {
        pair.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Terminal not started".to_string())
    }
}

#[tauri::command]
async fn get_git_branch(path: String) -> Result<String, String> {
    use std::process::Command;

    let expanded_path = if path.starts_with('~') {
        if let Some(home) = std::env::var("HOME")
            .ok()
            .or_else(|| std::env::var("USERPROFILE").ok())
        {
            path.replacen("~", &home, 1)
        } else {
            path.clone()
        }
    } else {
        path.clone()
    };

    let output = Command::new("git")
        .arg("-C")
        .arg(&expanded_path)
        .arg("rev-parse")
        .arg("--abbrev-ref")
        .arg("HEAD")
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let branch = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !branch.is_empty() {
            return Ok(branch);
        }
    }

    Err("Not a git repository".to_string())
}

#[tauri::command]
async fn get_flutter_devices() -> Result<String, String> {
    let flutter_bin = resolve_flutter_path();
    let output = if cfg!(target_os = "windows") {
        std::process::Command::new("cmd")
            .args(["/C", &flutter_bin, "devices", "--machine"])
            .output()
    } else {
        std::process::Command::new(&flutter_bin)
            .args(["devices", "--machine"])
            .output()
            .or_else(|_| {
                let shell = std::env::var("SHELL").unwrap_or_else(|_| {
                    if std::path::Path::new("/bin/bash").exists() {
                        "/bin/bash".to_string()
                    } else {
                        "/bin/sh".to_string()
                    }
                });
                std::process::Command::new(shell)
                    .args(["-l", "-c", "flutter devices --machine"])
                    .output()
            })
    }
    .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn get_directory_tree(path: String) -> Result<Vec<FileNode>, String> {
    use std::fs;
    use std::path::Path;

    fn build_tree(dir: &Path) -> Result<Vec<FileNode>, String> {
        let mut nodes = Vec::new();
        let entries = match fs::read_dir(dir) {
            Ok(e) => e,
            Err(_) => return Ok(nodes), // Return empty if can't read
        };

        for entry in entries.flatten() {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();

            if name.starts_with('.') || name == "build" || name == "node_modules" {
                continue;
            }

            let is_dir = path.is_dir();
            let mut children = None;

            if is_dir {
                children = Some(build_tree(&path)?);
            }

            nodes.push(FileNode {
                id: path.to_string_lossy().to_string(),
                name,
                path: path.to_string_lossy().to_string(),
                node_type: if is_dir {
                    "directory".to_string()
                } else {
                    "file".to_string()
                },
                children,
            });
        }

        nodes.sort_by(|a, b| {
            if a.node_type == b.node_type {
                a.name.cmp(&b.name)
            } else if a.node_type == "directory" {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        });

        Ok(nodes)
    }

    let expanded_path = if path.starts_with('~') {
        if let Some(home) = std::env::var("HOME")
            .ok()
            .or_else(|| std::env::var("USERPROFILE").ok())
        {
            path.replacen("~", &home, 1)
        } else {
            path.clone()
        }
    } else {
        path.clone()
    };

    build_tree(Path::new(&expanded_path))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_flutter_project(
    project_path: String,
    project_name: String,
    template: String,
) -> Result<String, String> {
    use std::process::Command;

    let expanded_path = if project_path.starts_with('~') {
        if let Some(home) = std::env::var("HOME")
            .ok()
            .or_else(|| std::env::var("USERPROFILE").ok())
        {
            project_path.replacen("~", &home, 1)
        } else {
            project_path.clone()
        }
    } else {
        project_path.clone()
    };

    // Create target directory cross-platform
    std::fs::create_dir_all(&expanded_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    let template_arg = match template.as_str() {
        "app" => "--template=app",
        "empty" => "--template=app",
        "module" => "--template=module",
        "package" => "--template=package",
        "plugin" => "--template=plugin",
        _ => "--template=app",
    };

    let mut args = vec!["create", template_arg];
    if template == "empty" {
        args.push("--empty");
    }
    args.push("--project-name");
    args.push(&project_name);
    args.push(&project_name);

    let flutter_bin = resolve_flutter_path();
    let output = if cfg!(target_os = "windows") {
        let mut cmd = Command::new("cmd");
        cmd.current_dir(&expanded_path);
        cmd.arg("/C").arg(&flutter_bin);
        for arg in args {
            cmd.arg(arg);
        }
        cmd.output()
    } else {
        // Linux / macOS: first try resolved flutter binary
        let mut cmd = Command::new(&flutter_bin);
        cmd.current_dir(&expanded_path);
        for arg in &args {
            cmd.arg(arg);
        }
        match cmd.output() {
            Ok(out) => Ok(out),
            Err(_) => {
                // Fallback to user login shell if flutter is defined in shell rc
                let shell = std::env::var("SHELL").unwrap_or_else(|_| {
                    if std::path::Path::new("/bin/bash").exists() {
                        "/bin/bash".to_string()
                    } else {
                        "/bin/sh".to_string()
                    }
                });
                let cmd_str = format!("flutter {}", args.join(" "));
                Command::new(&shell)
                    .current_dir(&expanded_path)
                    .arg("-l")
                    .arg("-c")
                    .arg(&cmd_str)
                    .output()
            }
        }
    }
    .map_err(|e| format!("Failed to execute flutter create: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        let out = String::from_utf8_lossy(&output.stdout).to_string();
        if !err.trim().is_empty() {
            Err(err)
        } else {
            Err(out)
        }
    }
}

#[tauri::command]
async fn check_flutter_installation() -> Result<bool, String> {
    Ok(flutter_installer::get_flutter_bin().is_some())
}

#[tauri::command]
async fn install_flutter_sdk(app: AppHandle) -> Result<String, String> {
    let app_handle = app.clone();
    flutter_installer::download_and_install_flutter(move |msg| {
        let _ = app_handle.emit("flutter-install-progress", msg);
    }).await
}

#[tauri::command]
async fn start_flutter_daemon(
    app: AppHandle, 
    state: State<'_, FlutterDaemonState>, 
    project_path: String, 
    device_id: Option<String>
) -> Result<(), String> {
    let flutter_bin = flutter_installer::get_flutter_bin().unwrap_or_else(|| "flutter".to_string());
    
    let mut cmd = tokio::process::Command::new(&flutter_bin);
    cmd.arg("run").arg("--machine");
    if let Some(id) = device_id {
        cmd.arg("-d").arg(&id);
    }
    cmd.current_dir(&project_path)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| e.to_string())?;
    
    let stdin = child.stdin.take().ok_or("Failed to open stdin")?;
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take();
    
    let mut state_stdin = state.stdin.lock().await;
    *state_stdin = Some(stdin);
    
    let app_handle = app.clone();
    
    tokio::spawn(async move {
        use tokio::io::AsyncBufReadExt;
        let reader = tokio::io::BufReader::new(stdout);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = app_handle.emit("flutter-daemon-msg", line);
        }
    });

    if let Some(stderr) = stderr {
        let app_handle_err = app.clone();
        tokio::spawn(async move {
            use tokio::io::AsyncBufReadExt;
            let reader = tokio::io::BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_handle_err.emit("flutter-daemon-msg", line);
            }
        });
    }

    Ok(())
}

#[tauri::command]
async fn send_flutter_daemon_message(state: State<'_, FlutterDaemonState>, message: String) -> Result<(), String> {
    let mut stdin_lock = state.stdin.lock().await;
    if let Some(stdin) = stdin_lock.as_mut() {
        // Appending \n to ensure flutter daemon receives the command
        let msg_with_newline = format!("{}\n", message);
        stdin
            .write_all(msg_with_newline.as_bytes())
            .await
            .map_err(|e| e.to_string())?;
        stdin.flush().await.map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Flutter daemon not started".to_string())
    }
}

#[tauri::command]
async fn parse_dart_file(source_code: String) -> Result<String, String> {
    match ast_parser::parse_dart_to_widget_tree(&source_code) {
        Some(tree) => Ok(serde_json::to_string(&tree).unwrap()),
        None => Err("Failed to parse Dart code".to_string()),
    }
}

#[tauri::command]
async fn inject_widget(file_path: String, parent_id: String, new_widget_type: String) -> Result<(), String> {
    ast_parser::inject_widget_to_dart_file(&file_path, &parent_id, &new_widget_type)
}

#[tauri::command]
async fn update_widget_property(file_path: String, node_id: String, property_key: String, property_value: String) -> Result<(), String> {
    ast_parser::update_widget_property(&file_path, &node_id, &property_key, &property_value)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(LspState {
            stdin: Arc::new(tokio::sync::Mutex::new(None)),
        })
        .manage(FlutterDaemonState {
            stdin: Arc::new(tokio::sync::Mutex::new(None)),
        })
        .manage(TerminalState {
            writer: Arc::new(tokio::sync::Mutex::new(None)),
            pty_pair: Arc::new(tokio::sync::Mutex::new(None)),
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_flutter_project,
            get_directory_tree,
            read_file,
            save_file,
            start_lsp,
            send_lsp_message,
            get_flutter_devices,
            get_git_branch,
            start_terminal,
            write_terminal,
            resize_terminal,
            check_flutter_installation,
            install_flutter_sdk,
            start_flutter_daemon,
            send_flutter_daemon_message,
            parse_dart_file,
            inject_widget,
            update_widget_property
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
