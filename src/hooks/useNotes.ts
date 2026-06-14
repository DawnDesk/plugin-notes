import { useEffect, useMemo } from 'react'
import { useDawnDesk } from '@dawndesk/ui'
import {
  notesStore,
  type Note,
  type NotesPreferences,
  useNotesStore,
} from '../store/notesStore'

const NOTES_KEY = 'notes'
const PREFERENCES_KEY = 'preferences'
const NOTES_CHANGED_EVENT = 'plugin:notes:data-changed'
const NOTE_SIZE_LIMIT = 1024 * 1024

type AiAction = 'expand' | 'summarize' | 'rewrite'

function createId() {
  if ('crypto' in globalThis && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function nowIso() {
  return new Date().toISOString()
}

function formatStatus(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'DawnDesk IPC is unavailable in this environment.'
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function normalizeNote(value: Note): Note {
  return {
    id: value.id,
    title: value.title || 'Untitled',
    content: value.content || '',
    tags: Array.isArray(value.tags) ? value.tags : [],
    createdAt: value.createdAt || nowIso(),
    updatedAt: value.updatedAt || value.createdAt || nowIso(),
    pinned: Boolean(value.pinned),
  }
}

function sortNotes(notes: Note[], preferences: NotesPreferences) {
  const direction = preferences.sortDir === 'asc' ? 1 : -1

  return [...notes].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1
    }

    const leftValue = left[preferences.sortBy].toLocaleLowerCase()
    const rightValue = right[preferences.sortBy].toLocaleLowerCase()

    return leftValue.localeCompare(rightValue) * direction
  })
}

function filterNotes(notes: Note[], query: string, selectedTag: string | null) {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  return notes.filter((note) => {
    const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true
    const matchesQuery = normalizedQuery
      ? [note.title, note.content, note.tags.join(' ')]
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      : true

    return matchesTag && matchesQuery
  })
}

function createBlankNote(): Note {
  const timestamp = nowIso()

  return {
    id: createId(),
    title: 'Untitled note',
    content: '',
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    pinned: false,
  }
}

export function useNotes() {
  const { getData, setData, callAI, onEvent } = useDawnDesk()
  const state = useNotesStore()

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | null = null

    async function load() {
      try {
        const [storedNotes, storedPreferences] = await Promise.all([
          getData<Note[]>(NOTES_KEY),
          getData<NotesPreferences>(PREFERENCES_KEY),
        ])

        if (!isMounted) {
          return
        }

        const notes = (storedNotes ?? []).map(normalizeNote)
        notesStore.setPreferences({
          ...notesStore.defaultPreferences,
          ...(storedPreferences ?? {}),
        })
        notesStore.setNotes(notes)
        notesStore.setStatus(notes.length ? 'Loaded notes' : 'Ready')
      } catch (error) {
        notesStore.setStatus(formatStatus(error))
      }
    }

    void load()
    void onEvent(NOTES_CHANGED_EVENT, () => {
      void load()
    })
      .then((handler) => {
        if (isMounted) {
          unsubscribe = handler
        } else {
          handler()
        }
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [getData, onEvent])

  async function persistNotes(notes: Note[], status: string) {
    await setData(NOTES_KEY, notes)
    notesStore.setNotes(notes)
    notesStore.setStatus(status)
  }

  async function persistPreferences(preferences: NotesPreferences) {
    await setData(PREFERENCES_KEY, preferences)
    notesStore.setPreferences(preferences)
  }

  async function createNote() {
    const note = createBlankNote()
    const notes = [note, ...state.notes]

    try {
      await persistNotes(notes, 'Created note')
      notesStore.setActiveNote(note.id)
    } catch (error) {
      notesStore.setStatus(formatStatus(error))
    }
  }

  async function updateNote(id: string, update: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) {
    const current = state.notes.find((note) => note.id === id)

    if (!current) {
      return
    }

    const nextContent = update.content ?? current.content

    if (new Blob([nextContent]).size > NOTE_SIZE_LIMIT) {
      notesStore.setStatus('Note is over the 1 MB soft limit')
      return
    }

    const notes = state.notes.map((note) =>
      note.id === id
        ? {
            ...note,
            ...update,
            title: update.title?.trim() || note.title,
            tags: update.tags ?? note.tags,
            updatedAt: nowIso(),
          }
        : note,
    )

    try {
      await persistNotes(notes, 'Saved')
    } catch (error) {
      notesStore.setStatus(formatStatus(error))
    }
  }

  async function deleteNote(id: string) {
    const notes = state.notes.filter((note) => note.id !== id)

    try {
      await persistNotes(notes, 'Deleted note')
    } catch (error) {
      notesStore.setStatus(formatStatus(error))
    }
  }

  async function togglePinned(id: string) {
    const notes = state.notes.map((note) =>
      note.id === id ? { ...note, pinned: !note.pinned, updatedAt: nowIso() } : note,
    )

    try {
      await persistNotes(notes, 'Updated pin')
    } catch (error) {
      notesStore.setStatus(formatStatus(error))
    }
  }

  async function askAI(id: string, action: AiAction) {
    const note = state.notes.find((item) => item.id === id)

    if (!note) {
      return
    }

    const instructions: Record<AiAction, string> = {
      expand: 'Expand this note with useful detail while keeping the same Markdown style.',
      summarize: 'Summarize this note into a concise Markdown version.',
      rewrite: 'Rewrite this note for clarity and flow while preserving the meaning.',
    }

    try {
      notesStore.setStatus('Asking AI')
      const content = await callAI({
        prompt: `${instructions[action]}\n\nTitle: ${note.title}\n\n${note.content}`,
      })

      await updateNote(id, { content })
      notesStore.setStatus('AI draft applied')
    } catch (error) {
      notesStore.setStatus(formatStatus(error))
    }
  }

  async function setSortBy(sortBy: NotesPreferences['sortBy']) {
    const sortDir: NotesPreferences['sortDir'] =
      state.preferences.sortBy === sortBy && state.preferences.sortDir === 'desc' ? 'asc' : 'desc'
    const preferences = { ...state.preferences, sortBy, sortDir }

    try {
      await persistPreferences(preferences)
    } catch (error) {
      notesStore.setStatus(formatStatus(error))
    }
  }

  async function toggleView() {
    const preferences = {
      ...state.preferences,
      defaultView: state.preferences.defaultView === 'list' ? 'grid' : 'list',
    } satisfies NotesPreferences

    try {
      await persistPreferences(preferences)
    } catch (error) {
      notesStore.setStatus(formatStatus(error))
    }
  }

  const sortedNotes = useMemo(
    () => sortNotes(state.notes, state.preferences),
    [state.notes, state.preferences],
  )
  const filteredNotes = useMemo(
    () => filterNotes(sortedNotes, state.searchQuery, state.selectedTag),
    [sortedNotes, state.searchQuery, state.selectedTag],
  )
  const tags = useMemo(
    () => Array.from(new Set(state.notes.flatMap((note) => note.tags))).sort(),
    [state.notes],
  )

  return {
    ...state,
    filteredNotes,
    parseTags,
    tags,
    askAI,
    createNote,
    deleteNote,
    setActiveNote: notesStore.setActiveNote,
    setSearchQuery: notesStore.setSearchQuery,
    setSelectedTag: notesStore.setSelectedTag,
    setSortBy,
    togglePinned,
    toggleView,
    updateNote,
  }
}
