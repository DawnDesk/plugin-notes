pub mod commands;
pub mod handlers;
pub mod store;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::{self, BufRead, Write};

#[derive(Debug, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub tool: String,
    #[serde(default)]
    pub input: Value,
}

#[derive(Debug, Serialize)]
pub struct ToolResult {
    pub id: String,
    pub output: Value,
    pub error: Option<String>,
}

fn output<T: Serialize>(id: String, result: Result<T, String>) -> ToolResult {
    match result {
        Ok(value) => ToolResult {
            id,
            output: serde_json::to_value(value).unwrap_or(Value::Null),
            error: None,
        },
        Err(error) => ToolResult {
            id,
            output: Value::Null,
            error: Some(error),
        },
    }
}

pub fn dispatch(call: ToolCall) -> ToolResult {
    let data_dir = match store::resolve_data_dir(None) {
        Ok(path) => path,
        Err(error) => {
            return ToolResult {
                id: call.id,
                output: Value::Null,
                error: Some(error),
            };
        }
    };

    match call.tool.as_str() {
        "create_note" => output(
            call.id,
            serde_json::from_value(call.input)
                .map_err(|error| format!("Invalid create_note input: {error}"))
                .and_then(|input| handlers::notes::create_note(data_dir, input)),
        ),
        "search_notes" => output(
            call.id,
            serde_json::from_value(call.input)
                .map_err(|error| format!("Invalid search_notes input: {error}"))
                .and_then(|input| handlers::notes::search_notes(data_dir, input)),
        ),
        "update_note" => output(
            call.id,
            serde_json::from_value(call.input)
                .map_err(|error| format!("Invalid update_note input: {error}"))
                .and_then(|input| handlers::notes::update_note(data_dir, input)),
        ),
        "delete_note" => output(
            call.id,
            serde_json::from_value(call.input)
                .map_err(|error| format!("Invalid delete_note input: {error}"))
                .and_then(|input| handlers::notes::delete_note(data_dir, input)),
        ),
        "list_notes" => {
            let input = if call.input.is_null() {
                Ok(handlers::notes::ListNotesInput::default())
            } else {
                serde_json::from_value(call.input)
                    .map_err(|error| format!("Invalid list_notes input: {error}"))
            };

            output(
                call.id,
                input.and_then(|input| handlers::notes::list_notes(data_dir, input)),
            )
        }
        _ => ToolResult {
            id: call.id,
            output: Value::Null,
            error: Some(format!("Unknown tool: {}", call.tool)),
        },
    }
}

pub fn run_sidecar() -> Result<(), String> {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut out = stdout.lock();

    for line in stdin.lock().lines() {
        let line = line.map_err(|error| format!("Failed to read stdin: {error}"))?;

        if line.trim().is_empty() {
            continue;
        }

        let result = match serde_json::from_str::<ToolCall>(&line) {
            Ok(call) => dispatch(call),
            Err(error) => ToolResult {
                id: String::new(),
                output: Value::Null,
                error: Some(format!("Invalid JSON tool call: {error}")),
            },
        };
        let response = serde_json::to_string(&result)
            .map_err(|error| format!("Failed to serialize tool result: {error}"))?;

        writeln!(out, "{response}").map_err(|error| format!("Failed to write stdout: {error}"))?;
        out.flush()
            .map_err(|error| format!("Failed to flush stdout: {error}"))?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::create_note,
            commands::search_notes,
            commands::update_note,
            commands::delete_note,
            commands::list_notes
        ])
        .run(tauri::generate_context!())
        .expect("failed to run notes plugin app");
}
