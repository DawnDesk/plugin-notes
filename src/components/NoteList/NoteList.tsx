import { Button, EmptyState } from '@dawndesk/ui'
import { NoteCard } from '../NoteCard/NoteCard'
import type { Note, NotesPreferences } from '../../store/notesStore'
import './NoteList.css'

type NoteListProps = {
  activeNoteId: string | null
  notes: Note[]
  preferences: NotesPreferences
  query: string
  selectedTag: string | null
  tags: string[]
  onCreateNote: () => void
  onDeleteNote: (id: string) => void
  onPinNote: (id: string) => void
  onSearchChange: (query: string) => void
  onSelectNote: (id: string) => void
  onSortChange: (sortBy: NotesPreferences['sortBy']) => void
}

export function NoteList({
  activeNoteId,
  notes,
  preferences,
  query,
  selectedTag,
  tags,
  onCreateNote,
  onDeleteNote,
  onPinNote,
  onSearchChange,
  onSelectNote,
  onSortChange,
}: NoteListProps) {
  return (
    <section className="note-list">
      <div className="note-list__search">
        <label className="note-list__label" htmlFor="note-search">
          Search notes
        </label>
        <input
          id="note-search"
          className="note-list__input"
          placeholder="Search title, body, or tag"
          type="search"
          value={query}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="note-list__meta">
        <span>
          {notes.length} shown
          {selectedTag ? ` in ${selectedTag}` : ''}
        </span>
        <span>{tags.length} tags</span>
      </div>

      <div className="note-list__sort" aria-label="Sort notes">
        <Button variant={preferences.sortBy === 'updatedAt' ? 'primary' : 'ghost'} onClick={() => onSortChange('updatedAt')}>
          Updated
        </Button>
        <Button variant={preferences.sortBy === 'createdAt' ? 'primary' : 'ghost'} onClick={() => onSortChange('createdAt')}>
          Created
        </Button>
        <Button variant={preferences.sortBy === 'title' ? 'primary' : 'ghost'} onClick={() => onSortChange('title')}>
          Title
        </Button>
      </div>

      <div className={`note-list__items note-list__items--${preferences.defaultView}`}>
        {notes.length > 0 ? (
          notes.map((note) => (
            <NoteCard
              active={note.id === activeNoteId}
              key={note.id}
              note={note}
              onDelete={onDeleteNote}
              onPin={onPinNote}
              onSelect={onSelectNote}
            />
          ))
        ) : (
          <div className="note-list__empty">
            <EmptyState
              title="No notes found"
              description="Create a note or clear your filters to start writing."
            />
            <Button onClick={onCreateNote}>New note</Button>
          </div>
        )}
      </div>
    </section>
  )
}
