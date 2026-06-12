import { Button, PluginPanel, useDawnDesk } from '@dawndesk/ui'
import { NoteEditor } from './components/NoteEditor/NoteEditor'
import { NoteList } from './components/NoteList/NoteList'
import { TagFilter } from './components/TagFilter/TagFilter'
import { useNotes } from './hooks/useNotes'
import './App.css'

function App() {
  const { pluginInfo } = useDawnDesk()
  const notes = useNotes()

  const activeNote = notes.notes.find((note) => note.id === notes.activeNoteId) ?? null
  const pluginName = pluginInfo?.name ?? 'Notes'

  return (
    <PluginPanel
      title={pluginName}
      subtitle="Markdown notes with search, tags, pinning, and AI help"
      toolbarActions={
        <div className="notes-toolbar">
          <Button variant="ghost" onClick={notes.toggleView}>
            {notes.preferences.defaultView === 'list' ? 'Grid' : 'List'}
          </Button>
          <Button variant="primary" onClick={notes.createNote}>
            New note
          </Button>
        </div>
      }
      statusBar={`${notes.filteredNotes.length} notes - ${notes.status}`}
    >
      <main className="notes-shell">
        <aside className="notes-sidebar" aria-label="Notes">
          <NoteList
            activeNoteId={notes.activeNoteId}
            notes={notes.filteredNotes}
            preferences={notes.preferences}
            query={notes.searchQuery}
            selectedTag={notes.selectedTag}
            tags={notes.tags}
            onCreateNote={notes.createNote}
            onDeleteNote={notes.deleteNote}
            onPinNote={notes.togglePinned}
            onSearchChange={notes.setSearchQuery}
            onSelectNote={notes.setActiveNote}
            onSortChange={notes.setSortBy}
          />
          <TagFilter
            selectedTag={notes.selectedTag}
            tags={notes.tags}
            onSelectTag={notes.setSelectedTag}
          />
        </aside>

        <NoteEditor
          note={activeNote}
          status={notes.status}
          onAskAI={notes.askAI}
          onCreateNote={notes.createNote}
          onDeleteNote={notes.deleteNote}
          onPinNote={notes.togglePinned}
          onUpdateNote={notes.updateNote}
        />
      </main>
    </PluginPanel>
  )
}

export default App
