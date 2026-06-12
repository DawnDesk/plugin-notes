use std::path::PathBuf;

use crate::{
    handlers::notes::{
        create_note as create_note_handler, delete_note as delete_note_handler,
        list_notes as list_notes_handler, search_notes as search_notes_handler,
        update_note as update_note_handler, CreateNoteInput, DeleteNoteInput, DeleteNoteOutput,
        ListNotesInput, NoteMutationOutput, SearchNotesInput, UpdateNoteInput,
    },
    store::{resolve_data_dir, Note},
};

#[tauri::command]
pub fn create_note(
    input: CreateNoteInput,
    data_dir: Option<PathBuf>,
) -> Result<NoteMutationOutput, String> {
    create_note_handler(resolve_data_dir(data_dir)?, input)
}

#[tauri::command]
pub fn search_notes(
    input: SearchNotesInput,
    data_dir: Option<PathBuf>,
) -> Result<Vec<Note>, String> {
    search_notes_handler(resolve_data_dir(data_dir)?, input)
}

#[tauri::command]
pub fn update_note(
    input: UpdateNoteInput,
    data_dir: Option<PathBuf>,
) -> Result<NoteMutationOutput, String> {
    update_note_handler(resolve_data_dir(data_dir)?, input)
}

#[tauri::command]
pub fn delete_note(
    input: DeleteNoteInput,
    data_dir: Option<PathBuf>,
) -> Result<DeleteNoteOutput, String> {
    delete_note_handler(resolve_data_dir(data_dir)?, input)
}

#[tauri::command]
pub fn list_notes(
    input: Option<ListNotesInput>,
    data_dir: Option<PathBuf>,
) -> Result<Vec<Note>, String> {
    list_notes_handler(resolve_data_dir(data_dir)?, input.unwrap_or_default())
}
