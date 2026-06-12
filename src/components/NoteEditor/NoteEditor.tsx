import { Button, EmptyState } from '@dawndesk/ui'
import type { Note } from '../../store/notesStore'
import './NoteEditor.css'

type AiAction = 'expand' | 'summarize' | 'rewrite'

type NoteEditorProps = {
  note: Note | null
  status: string
  onAskAI: (id: string, action: AiAction) => void
  onCreateNote: () => void
  onDeleteNote: (id: string) => void
  onPinNote: (id: string) => void
  onUpdateNote: (id: string, update: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => void
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function inlineMarkdown(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
}

function MarkdownPreview({ content }: { content: string }) {
  const blocks = content.trim() ? content.split(/\n{2,}/) : ['Start writing to preview Markdown.']

  return (
    <div className="note-preview">
      {blocks.map((block, index) => {
        const key = `${index}-${block.slice(0, 12)}`

        if (block.startsWith('### ')) {
          return <h4 key={key}>{inlineMarkdown(block.slice(4))}</h4>
        }

        if (block.startsWith('## ')) {
          return <h3 key={key}>{inlineMarkdown(block.slice(3))}</h3>
        }

        if (block.startsWith('# ')) {
          return <h2 key={key}>{inlineMarkdown(block.slice(2))}</h2>
        }

        if (block.startsWith('- ')) {
          return (
            <ul key={key}>
              {block.split('\n').map((item) => (
                <li key={item}>{inlineMarkdown(item.replace(/^- /, ''))}</li>
              ))}
            </ul>
          )
        }

        return <p key={key}>{inlineMarkdown(block)}</p>
      })}
    </div>
  )
}

export function NoteEditor({
  note,
  status,
  onAskAI,
  onCreateNote,
  onDeleteNote,
  onPinNote,
  onUpdateNote,
}: NoteEditorProps) {
  if (!note) {
    return (
      <section className="note-editor note-editor--empty">
        <EmptyState
          title="Select a note"
          description="Choose a note from the list, or create a new one."
        />
        <Button variant="primary" onClick={onCreateNote}>
          New note
        </Button>
      </section>
    )
  }

  return (
    <section className="note-editor" aria-label="Note editor">
      <div className="note-editor__header">
        <div className="note-editor__identity">
          <input
            className="note-editor__title"
            aria-label="Note title"
            value={note.title}
            onChange={(event) => onUpdateNote(note.id, { title: event.target.value })}
          />
          <input
            className="note-editor__tags"
            aria-label="Tags"
            placeholder="Tags, comma separated"
            value={note.tags.join(', ')}
            onChange={(event) => onUpdateNote(note.id, { tags: parseTags(event.target.value) })}
          />
        </div>
        <div className="note-editor__actions">
          <Button variant="ghost" onClick={() => onPinNote(note.id)}>
            {note.pinned ? 'Unpin' : 'Pin'}
          </Button>
          <Button variant="ghost" onClick={() => onDeleteNote(note.id)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="note-editor__assist" aria-label="AI writing assistance">
        <Button variant="ghost" onClick={() => onAskAI(note.id, 'rewrite')}>
          Rewrite
        </Button>
        <Button variant="ghost" onClick={() => onAskAI(note.id, 'expand')}>
          Expand
        </Button>
        <Button variant="ghost" onClick={() => onAskAI(note.id, 'summarize')}>
          Summarize
        </Button>
        <span>{status}</span>
      </div>

      <div className="note-editor__workspace">
        <label className="note-editor__pane">
          <span>Markdown</span>
          <textarea
            className="note-editor__textarea"
            value={note.content}
            onChange={(event) => onUpdateNote(note.id, { content: event.target.value })}
          />
        </label>
        <section className="note-editor__pane" aria-label="Preview">
          <span>Preview</span>
          <MarkdownPreview content={note.content} />
        </section>
      </div>
    </section>
  )
}
