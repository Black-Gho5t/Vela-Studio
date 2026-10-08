use std::process::Command;
use std::path::PathBuf;

pub fn get_vela_dir() -> PathBuf {
    let home = std::env::var("HOME").or_else(|_| std::env::var("USERPROFILE")).unwrap_or_else(|_| ".".to_string());
    let path = std::path::Path::new(&home).join(".vela");
    if !path.exists() {
        let _ = std::fs::create_dir_all(&path);
    }
    path
}

pub fn get_flutter_bin() -> Option<String> {
    let vela_flutter = get_vela_dir().join("flutter").join("bin").join(if cfg!(target_os = "windows") { "flutter.bat" } else { "flutter" });
    if vela_flutter.exists() {
        return Some(vela_flutter.to_string_lossy().to_string());
    }
    // Check system
    if let Ok(output) = Command::new(if cfg!(target_os = "windows") { "where.exe" } else { "which" }).arg("flutter").output() {
        if output.status.success() {
            let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path_str.is_empty() {
                return Some(path_str);
            }
        }
    }
    
    // Check ~/flutter/bin/flutter
    let home_flutter = std::path::Path::new(&std::env::var("HOME").unwrap_or_else(|_| ".".to_string())).join("flutter").join("bin").join(if cfg!(target_os = "windows") { "flutter.bat" } else { "flutter" });
    if home_flutter.exists() {
        return Some(home_flutter.to_string_lossy().to_string());
    }
    
    None
}

pub async fn download_and_install_flutter<F>(on_progress: F) -> Result<String, String> 
where F: Fn(String) + Send + 'static {
    let vela_dir = get_vela_dir();
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    
    // Construct flutter download URL based on OS
    let url = if os == "windows" {
        "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.24.3-stable.zip"
    } else if os == "macos" {
        if arch == "aarch64" {
            "https://storage.googleapis.com/flutter_infra_release/releases/stable/macos/flutter_macos_arm64_3.24.3-stable.zip"
        } else {
            "https://storage.googleapis.com/flutter_infra_release/releases/stable/macos/flutter_macos_3.24.3-stable.zip"
        }
    } else {
        // linux
        "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.24.3-stable.tar.xz"
    };

    on_progress(format!("Downloading Flutter from {}...", url));

    let file_name = url.split('/').last().unwrap();
    let temp_path = vela_dir.join(file_name);

    // Download using curl
    let output = Command::new("curl")
        .arg("-L")
        .arg("-o")
        .arg(&temp_path)
        .arg(url)
        .output()
        .map_err(|e| format!("Failed to run curl: {}", e))?;

    if !output.status.success() {
        return Err("Failed to download Flutter".to_string());
    }

    on_progress("Extracting Flutter SDK...".to_string());

    if url.ends_with(".zip") {
        let out = Command::new("tar").arg("-xf").arg(&temp_path).arg("-C").arg(&vela_dir).output().map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err("Failed to extract zip".to_string());
        }
    } else {
        // tar.xz
        let out = Command::new("tar").arg("-xf").arg(&temp_path).arg("-C").arg(&vela_dir).output().map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err("Failed to extract tar.xz".to_string());
        }
    }

    let _ = std::fs::remove_file(temp_path);
    
    on_progress("Running flutter doctor...".to_string());
    let flutter_bin = get_flutter_bin().ok_or("Flutter bin not found after extract")?;
    
    let _ = Command::new(&flutter_bin).arg("doctor").output();
    
    Ok(flutter_bin)
}
