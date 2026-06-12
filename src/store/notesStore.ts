import { useSyncExternalStore } from 'react'

export type Note = {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  pinned: boolean
}

export type NotesPreferences = {
  defaultView: 'list' | 'grid'
  sortBy: 'updatedAt' | 'createdAt' | 'title'
  sortDir: 'asc' | 'desc'
}

type NotesState = {
  activeNoteId: string | null
  notes: Note[]
  preferences: NotesPreferences
  searchQuery: string
  selectedTag: string | null
  status: string
}

const defaultPreferences: NotesPreferences = {
  defaultView: 'list',
  sortBy: 'updatedAt',
  sortDir: 'desc',
}

let state: NotesState = {
  activeNoteId: null,
  notes: [],
  preferences: defaultPreferences,
  searchQuery: '',
  selectedTag: null,
  status: 'Ready',
}

const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function setState(update: Partial<NotesState> | ((current: NotesState) => Partial<NotesState>)) {
  const patch = typeof update === 'function' ? update(state) : update
  state = { ...state, ...patch }
  emitChange()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

export const notesStore = {
  defaultPreferences,
  getState: getSnapshot,
  setActiveNote(activeNoteId: string | null) {
    setState({ activeNoteId })
  },
  setNotes(notes: Note[]) {
    setState((current) => ({
      notes,
      activeNoteId:
        current.activeNoteId && notes.some((note) => note.id === current.activeNoteId)
          ? current.activeNoteId
          : notes[0]?.id ?? null,
    }))
  },
  setPreferences(preferences: NotesPreferences) {
    setState({ preferences })
  },
  setSearchQuery(searchQuery: string) {
    setState({ searchQuery })
  },
  setSelectedTag(selectedTag: string | null) {
    setState({ selectedTag })
  },
  setStatus(status: string) {
    setState({ status })
  },
}

export function useNotesStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
