use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct HealthCheck {
    ok: bool,
    plugin: &'static str,
    sidecar: &'static str,
}

#[tauri::command]
pub fn template_health_check() -> HealthCheck {
    HealthCheck {
        ok: true,
        plugin: "plugin-template",
        sidecar: env!("CARGO_PKG_NAME"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn returns_template_metadata() {
        let result = template_health_check();

        assert!(result.ok);
        assert_eq!(result.plugin, "plugin-template");
        assert_eq!(result.sidecar, env!("CARGO_PKG_NAME"));
    }
}
