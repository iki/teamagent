#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod daemon;

use daemon::{Connection, Daemon};
use std::sync::Mutex;
use tauri::Manager;

struct ManagedDaemon(Mutex<Result<Daemon, String>>);

#[tauri::command]
fn daemon_connection(
    window: tauri::Window,
    state: tauri::State<'_, ManagedDaemon>,
) -> Result<Connection, String> {
    if window.label() != "main" {
        return Err("This window has no service capability.".into());
    }
    match state
        .0
        .lock()
        .map_err(|_| "Service state is unavailable.")?
        .as_mut()
    {
        Ok(daemon) => daemon.connection(),
        Err(message) => Err(message.clone()),
    }
}

fn main() {
    let app = tauri::Builder::default()
        .setup(|app| {
            let executable = std::env::current_exe()?;
            let data = app.path().app_local_data_dir()?.join("service");
            #[cfg(debug_assertions)]
            let data = match std::env::var_os("TEAMAGENT_DESKTOP_SMOKE_DATA") {
                Some(path) => {
                    let path = std::path::PathBuf::from(path);
                    if !path.is_absolute() {
                        return Err("Desktop smoke data path must be absolute".into());
                    }
                    path
                }
                None => data,
            };
            let configuration = std::env::var_os("TEAMAGENT_CONFIG").map(std::path::PathBuf::from);
            let daemon = Daemon::start(&executable, &data, configuration.as_deref());
            app.manage(ManagedDaemon(Mutex::new(daemon)));
            let smoke = cfg!(debug_assertions)
                && std::env::var_os("TEAMAGENT_DESKTOP_SMOKE_DATA").is_some();
            if !smoke {
                if let Some(window) = app.get_webview_window("main") {
                    window.show()?;
                }
            }
            #[cfg(debug_assertions)]
            if smoke {
                use std::io::{BufRead, Read};
                let handle = app.handle().clone();
                std::thread::spawn(move || {
                    let mut line = String::new();
                    if std::io::stdin()
                        .lock()
                        .take(32)
                        .read_line(&mut line)
                        .is_ok()
                        && line.trim() == "shutdown"
                    {
                        handle.exit(0);
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![daemon_connection])
        .build(tauri::generate_context!())
        .expect("Could not start Team Agent desktop");
    app.run(|app, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            if let Some(state) = app.try_state::<ManagedDaemon>() {
                if let Ok(mut state) = state.0.lock() {
                    if let Ok(daemon) = state.as_mut() {
                        daemon.stop();
                    }
                }
            }
        }
    });
}
