use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub pinned: bool,
}

pub fn now_iso() -> String {
    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();

    unix_seconds_to_iso(seconds)
}

fn unix_seconds_to_iso(seconds: u64) -> String {
    let days = (seconds / 86_400) as i64;
    let seconds_of_day = seconds % 86_400;
    let hour = seconds_of_day / 3_600;
    let minute = (seconds_of_day % 3_600) / 60;
    let second = seconds_of_day % 60;
    let (year, month, day) = civil_from_days(days);

    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}Z")
}

fn civil_from_days(days_since_epoch: i64) -> (i32, u32, u32) {
    let z = days_since_epoch + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let mut year = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = mp + if mp < 10 { 3 } else { -9 };

    year += if month <= 2 { 1 } else { 0 };

    (year as i32, month as u32, day as u32)
}

pub fn create_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();

    format!("note-{nanos}")
}

pub fn notes_path(data_dir: impl AsRef<Path>) -> PathBuf {
    data_dir.as_ref().join("notes.json")
}

pub fn load_notes(data_dir: impl AsRef<Path>) -> Result<Vec<Note>, String> {
    let path = notes_path(data_dir);

    if !path.exists() {
        return Ok(Vec::new());
    }

    let bytes = fs::read(&path).map_err(|error| format!("Failed to read notes: {error}"))?;
    serde_json::from_slice(&bytes).map_err(|error| format!("Failed to parse notes: {error}"))
}

pub fn save_notes(data_dir: impl AsRef<Path>, notes: &[Note]) -> Result<(), String> {
    let path = notes_path(data_dir);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create data dir: {error}"))?;
    }

    let bytes = serde_json::to_vec_pretty(notes)
        .map_err(|error| format!("Failed to serialize notes: {error}"))?;
    fs::write(&path, bytes).map_err(|error| format!("Failed to write notes: {error}"))
}

pub fn resolve_data_dir(data_dir: Option<PathBuf>) -> Result<PathBuf, String> {
    if let Some(path) = data_dir {
        return Ok(path);
    }

    if let Ok(path) = std::env::var("DAWNDESK_PLUGIN_DATA_DIR") {
        return Ok(PathBuf::from(path));
    }

    std::env::current_dir()
        .map(|path| path.join(".notes-data"))
        .map_err(|error| format!("Failed to resolve data dir: {error}"))
}

#[cfg(test)]
mod tests {
    use super::unix_seconds_to_iso;

    #[test]
    fn formats_unix_epoch_as_iso_utc() {
        assert_eq!(unix_seconds_to_iso(0), "1970-01-01T00:00:00Z");
        assert_eq!(unix_seconds_to_iso(1_704_067_200), "2024-01-01T00:00:00Z");
    }
}
