use serde::{Deserialize, Serialize};
use std::path::Path;

use crate::store::{create_id, load_notes, now_iso, save_notes, Note};

#[derive(Debug, Deserialize)]
pub struct CreateNoteInput {
    pub title: String,
    pub content: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct SearchNotesInput {
    pub query: String,
    #[serde(default = "default_limit")]
    pub limit: usize,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNoteInput {
    pub id: String,
    pub content: String,
    pub title: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct DeleteNoteInput {
    pub id: String,
}

#[derive(Debug, Deserialize)]
pub struct ListNotesInput {
    #[serde(default)]
    pub pinned_only: bool,
    #[serde(default = "default_limit")]
    pub limit: usize,
}

impl Default for ListNotesInput {
    fn default() -> Self {
        Self {
            pinned_only: false,
            limit: default_limit(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct NoteMutationOutput {
    pub success: bool,
    pub id: String,
}

#[derive(Debug, Serialize)]
pub struct DeleteNoteOutput {
    pub success: bool,
    pub deleted: bool,
}

fn default_limit() -> usize {
    5
}

fn normalize_tags(tags: Vec<String>) -> Vec<String> {
    let mut normalized = tags
        .into_iter()
        .map(|tag| tag.trim().to_string())
        .filter(|tag| !tag.is_empty())
        .collect::<Vec<_>>();
    normalized.sort();
    normalized.dedup();
    normalized
}

pub fn create_note(
    data_dir: impl AsRef<Path>,
    input: CreateNoteInput,
) -> Result<NoteMutationOutput, String> {
    let timestamp = now_iso();
    let note = Note {
        id: create_id(),
        title: if input.title.trim().is_empty() {
            "Untitled".to_string()
        } else {
            input.title.trim().to_string()
        },
        content: input.content,
        tags: normalize_tags(input.tags),
        created_at: timestamp.clone(),
        updated_at: timestamp,
        pinned: false,
    };
    let id = note.id.clone();
    let mut notes = load_notes(&data_dir)?;

    notes.insert(0, note);
    save_notes(data_dir, &notes)?;

    Ok(NoteMutationOutput { success: true, id })
}

pub fn search_notes(
    data_dir: impl AsRef<Path>,
    input: SearchNotesInput,
) -> Result<Vec<Note>, String> {
    let query = input.query.trim().to_lowercase();
    let notes = load_notes(data_dir)?;

    if query.is_empty() {
        return Ok(Vec::new());
    }

    Ok(notes
        .into_iter()
        .filter(|note| {
            [
                note.title.as_str(),
                note.content.as_str(),
                &note.tags.join(" "),
            ]
            .join(" ")
            .to_lowercase()
            .contains(&query)
        })
        .take(input.limit)
        .collect())
}

pub fn update_note(
    data_dir: impl AsRef<Path>,
    input: UpdateNoteInput,
) -> Result<NoteMutationOutput, String> {
    let mut notes = load_notes(&data_dir)?;
    let mut updated = false;
    let timestamp = now_iso();

    for note in &mut notes {
        if note.id == input.id {
            note.content = input.content.clone();
            note.updated_at = timestamp.clone();

            if let Some(title) = &input.title {
                if !title.trim().is_empty() {
                    note.title = title.trim().to_string();
                }
            }

            if let Some(tags) = &input.tags {
                note.tags = normalize_tags(tags.clone());
            }

            updated = true;
            break;
        }
    }

    if !updated {
        return Err(format!("Note not found: {}", input.id));
    }

    save_notes(data_dir, &notes)?;

    Ok(NoteMutationOutput {
        success: true,
        id: input.id,
    })
}

pub fn delete_note(
    data_dir: impl AsRef<Path>,
    input: DeleteNoteInput,
) -> Result<DeleteNoteOutput, String> {
    let mut notes = load_notes(&data_dir)?;
    let before = notes.len();

    notes.retain(|note| note.id != input.id);
    save_notes(data_dir, &notes)?;

    Ok(DeleteNoteOutput {
        success: true,
        deleted: notes.len() != before,
    })
}

pub fn list_notes(data_dir: impl AsRef<Path>, input: ListNotesInput) -> Result<Vec<Note>, String> {
    let mut notes = load_notes(data_dir)?;

    notes.sort_by(|left, right| {
        right
            .pinned
            .cmp(&left.pinned)
            .then_with(|| right.updated_at.cmp(&left.updated_at))
    });

    Ok(notes
        .into_iter()
        .filter(|note| !input.pinned_only || note.pinned)
        .take(input.limit)
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::{notes_path, save_notes};
    use std::{fs, path::PathBuf};

    fn test_dir(name: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!("notes-sidecar-{name}-{}", create_id()));
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn creates_and_searches_notes() {
        let dir = test_dir("create-search");

        let created = create_note(
            &dir,
            CreateNoteInput {
                title: "Project Plan".to_string(),
                content: "Ship the notes manager".to_string(),
                tags: vec!["work".to_string()],
            },
        )
        .unwrap();

        assert!(created.success);
        assert!(notes_path(&dir).exists());

        let results = search_notes(
            &dir,
            SearchNotesInput {
                query: "manager".to_string(),
                limit: 5,
            },
        )
        .unwrap();

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].title, "Project Plan");
    }

    #[test]
    fn updates_and_deletes_notes() {
        let dir = test_dir("update-delete");
        let created = create_note(
            &dir,
            CreateNoteInput {
                title: "Draft".to_string(),
                content: "Original".to_string(),
                tags: Vec::new(),
            },
        )
        .unwrap();

        update_note(
            &dir,
            UpdateNoteInput {
                id: created.id.clone(),
                content: "Updated".to_string(),
                title: Some("Published".to_string()),
                tags: Some(vec!["done".to_string()]),
            },
        )
        .unwrap();

        let notes = list_notes(
            &dir,
            ListNotesInput {
                pinned_only: false,
                limit: 5,
            },
        )
        .unwrap();

        assert_eq!(notes[0].title, "Published");
        assert_eq!(notes[0].content, "Updated");
        assert_eq!(notes[0].tags, vec!["done"]);

        let deleted = delete_note(&dir, DeleteNoteInput { id: created.id }).unwrap();

        assert!(deleted.deleted);
        assert!(list_notes(
            &dir,
            ListNotesInput {
                pinned_only: false,
                limit: 5,
            },
        )
        .unwrap()
        .is_empty());
    }

    #[test]
    fn lists_pinned_notes_first() {
        let dir = test_dir("list");
        let pinned = Note {
            id: "pinned".to_string(),
            title: "Pinned".to_string(),
            content: String::new(),
            tags: Vec::new(),
            created_at: "1".to_string(),
            updated_at: "1".to_string(),
            pinned: true,
        };
        let regular = Note {
            id: "regular".to_string(),
            title: "Regular".to_string(),
            content: String::new(),
            tags: Vec::new(),
            created_at: "2".to_string(),
            updated_at: "2".to_string(),
            pinned: false,
        };

        save_notes(&dir, &[regular, pinned]).unwrap();

        let notes = list_notes(
            &dir,
            ListNotesInput {
                pinned_only: true,
                limit: 5,
            },
        )
        .unwrap();

        assert_eq!(notes.len(), 1);
        assert_eq!(notes[0].id, "pinned");
    }
}
