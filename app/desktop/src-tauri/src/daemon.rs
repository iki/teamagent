use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::mpsc;
use std::time::Duration;

#[derive(Clone, Serialize)]
pub struct Connection {
    pub url: String,
    pub token: String,
}

#[derive(Deserialize)]
struct Ready {
    url: String,
}

pub struct Daemon {
    child: Child,
    connection: Connection,
}

pub fn sidecar_path(executable: &Path) -> Result<PathBuf, String> {
    let directory = executable
        .parent()
        .ok_or("Application directory is unavailable.")?;
    Ok(directory.join(if cfg!(windows) {
        "teamagent-daemon.exe"
    } else {
        "teamagent-daemon"
    }))
}

fn parse_ready(line: &[u8]) -> Result<String, String> {
    if line.len() > 4096 {
        return Err("The service returned an oversized startup response.".into());
    }
    let ready: Ready = serde_json::from_slice(line)
        .map_err(|_| "The service returned an invalid startup response.")?;
    let url =
        url::Url::parse(&ready.url).map_err(|_| "The service returned an invalid address.")?;
    if url.scheme() != "http"
        || url.host_str() != Some("127.0.0.1")
        || url.port().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.path() != "/"
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err("The service address must be an unadorned loopback HTTP address.".into());
    }
    Ok(url.origin().ascii_serialization())
}

fn trusted_config(path: &Path) -> Result<PathBuf, String> {
    if !path.is_absolute() || !path.is_file() {
        return Err("TEAMAGENT_CONFIG must explicitly name an existing absolute trusted configuration file.".into());
    }
    path.canonicalize()
        .map_err(|_| "The trusted configuration file is unavailable.".into())
}

impl Daemon {
    pub fn start(
        executable: &Path,
        data: &Path,
        configuration: Option<&Path>,
    ) -> Result<Self, String> {
        let sidecar = sidecar_path(executable)?;
        if !sidecar.is_file() {
            return Err(
                "The packaged service is missing. Rebuild or reinstall the desktop application."
                    .into(),
            );
        }
        std::fs::create_dir_all(data)
            .map_err(|_| "The application data directory is not writable.")?;
        let mut random = [0u8; 32];
        getrandom::fill(&mut random)
            .map_err(|_| "Could not generate a secure service credential.")?;
        let token: String = random.iter().map(|byte| format!("{byte:02x}")).collect();
        let mut command = Command::new(sidecar);
        command
            .args(["serve", "--port", "0", "--data"])
            .arg(data)
            .arg("--desktop")
            .env("TEAMAGENT_TOKEN", &token)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit());
        if let Some(path) = configuration {
            command.arg("--config").arg(trusted_config(path)?);
        }
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let mut child = command
            .spawn()
            .map_err(|_| "Could not start the packaged local service.")?;
        let Some(stdout) = child.stdout.take() else {
            let _ = child.kill();
            let _ = child.wait();
            return Err("The service startup channel is unavailable.".into());
        };
        let (sender, receiver) = mpsc::sync_channel(1);
        std::thread::spawn(move || {
            let mut reader = BufReader::new(stdout.take(4097));
            let mut line = Vec::new();
            let result = reader
                .read_until(b'\n', &mut line)
                .map_err(|_| "Could not read the service startup response.".to_string())
                .and_then(|_| parse_ready(&line));
            let _ = sender.send(result);
        });
        match receiver.recv_timeout(Duration::from_secs(20)) {
            Ok(Ok(url)) => Ok(Self {
                child,
                connection: Connection { url, token },
            }),
            result => {
                let _ = child.kill();
                let _ = child.wait();
                Err(match result {
                    Ok(Err(error)) => error,
                    _ => "The service did not become ready within 20 seconds.".into(),
                })
            }
        }
    }

    pub fn connection(&mut self) -> Result<Connection, String> {
        if self
            .child
            .try_wait()
            .map_err(|_| "Could not check the local service.")?
            .is_some()
        {
            return Err(
                "The local service stopped. Restart Team Agent to recover its task history.".into(),
            );
        }
        Ok(self.connection.clone())
    }

    pub fn stop(&mut self) {
        if let Some(stdin) = self.child.stdin.as_mut() {
            let _ = stdin.write_all(b"shutdown\n");
            let _ = stdin.flush();
        }
        for _ in 0..30 {
            if matches!(self.child.try_wait(), Ok(Some(_))) {
                return;
            }
            std::thread::sleep(Duration::from_millis(100));
        }
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

impl Drop for Daemon {
    fn drop(&mut self) {
        self.stop();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn startup_accepts_only_loopback_without_credentials_or_parameters() {
        assert_eq!(
            parse_ready(br#"{"url":"http://127.0.0.1:4317"}"#).unwrap(),
            "http://127.0.0.1:4317"
        );
        for input in [
            r#"{"url":"https://example.com:4317"}"#,
            r#"{"url":"http://localhost:4317"}"#,
            r#"{"url":"http://127.0.0.1:4317/?token=secret"}"#,
            r#"{"url":"http://secret@127.0.0.1:4317"}"#,
            r#"{"url":"http://127.0.0.1:4317/api"}"#,
            r#"{"url":"http://127.0.0.1"}"#,
        ] {
            assert!(parse_ready(input.as_bytes()).is_err());
        }
        assert!(parse_ready(&vec![b' '; 4097]).is_err());
        assert!(parse_ready(b"not JSON").is_err());
    }

    #[test]
    fn fixed_sidecar_is_always_next_to_application() {
        let executable = Path::new("application directory").join("teamagent-desktop.exe");
        let expected = Path::new("application directory").join(if cfg!(windows) {
            "teamagent-daemon.exe"
        } else {
            "teamagent-daemon"
        });
        assert_eq!(sidecar_path(&executable).unwrap(), expected);
    }

    #[test]
    fn configuration_is_explicit_existing_and_absolute() {
        assert!(trusted_config(Path::new("config.ts")).is_err());
        assert!(trusted_config(&std::env::temp_dir()).is_err());
        let configuration = Path::new(env!("CARGO_MANIFEST_DIR")).join("Cargo.toml");
        assert!(trusted_config(&configuration).unwrap().is_absolute());
    }

    #[test]
    fn packaged_service_starts_authenticates_and_stops() {
        use std::net::TcpStream;

        let test_executable = std::env::current_exe().unwrap();
        let application = test_executable
            .parent()
            .unwrap()
            .parent()
            .unwrap()
            .join("teamagent-desktop.exe");
        let data = std::env::temp_dir().join(format!("teamagent-native-{}", std::process::id()));
        let mut daemon = Daemon::start(&application, &data, None).unwrap();
        let connection = daemon.connection().unwrap();
        let address = connection.url.strip_prefix("http://").unwrap();
        fn request(address: &str, token: &str) -> String {
            let mut socket = TcpStream::connect(address).unwrap();
            socket
                .set_read_timeout(Some(Duration::from_secs(5)))
                .unwrap();
            write!(socket, "GET /api/tasks HTTP/1.1\r\nHost: {address}\r\nAuthorization: Bearer {token}\r\nConnection: close\r\n\r\n").unwrap();
            let mut response = String::new();
            socket.take(8192).read_to_string(&mut response).unwrap();
            response
        }
        assert!(request(address, "incorrect").starts_with("HTTP/1.1 401"));
        assert!(request(address, &connection.token).starts_with("HTTP/1.1 200"));
        daemon.stop();
        assert!(TcpStream::connect(address).is_err());
        assert!(daemon.connection().is_err());
        drop(daemon);
        std::fs::remove_dir_all(data).unwrap();
    }
}
