import { Button } from '@dawndesk/ui'
import type { Note } from '../../store/notesStore'
import './NoteCard.css'

type NoteCardProps = {
  active: boolean
  note: Note
  onDelete: (id: string) => void
  onPin: (id: string) => void
  onSelect: (id: string) => void
}

function preview(content: string) {
  const value = content
    .replaceAll('#', '')
    .replaceAll('*', '')
    .replaceAll('`', '')
    .trim()

  return value || 'No content yet'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function NoteCard({ active, note, onDelete, onPin, onSelect }: NoteCardProps) {
  return (
    <article className={`note-card ${active ? 'note-card--active' : ''}`}>
      <button className="note-card__main" type="button" onClick={() => onSelect(note.id)}>
        <span className="note-card__eyebrow">{formatDate(note.updatedAt)}</span>
        <span className="note-card__title">{note.title}</span>
        <span className="note-card__preview">{preview(note.content)}</span>
        {note.tags.length > 0 ? (
          <span className="note-card__tags">
            {note.tags.map((tag) => (
              <span className="note-card__tag" key={tag}>
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </button>
      <div className="note-card__actions">
        <Button variant="ghost" onClick={() => onPin(note.id)}>
          {note.pinned ? 'Pinned' : 'Pin'}
        </Button>
        <Button variant="ghost" onClick={() => onDelete(note.id)}>
          Delete
        </Button>
      </div>
    </article>
  )
}
