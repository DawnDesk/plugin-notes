fn main() {
    if std::env::var_os("DAWNDESK_PLUGIN_DATA_DIR").is_some() {
        if let Err(error) = notes_sidecar::run_sidecar() {
            eprintln!("{error}");
            std::process::exit(1);
        }
    } else {
        notes_sidecar::run();
    }
}
