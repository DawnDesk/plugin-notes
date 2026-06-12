import { useState } from 'react'
import { useDawnDesk } from '@dawndesk/ui'
import type { TemplateState } from './types'

const TEMPLATE_DATA_KEY = 'template:example-state'

function formatStatus(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'DawnDesk IPC is unavailable in this environment.'
}

export function useTemplateState() {
  const { getData, setData } = useDawnDesk()
  const [savedState, setSavedState] = useState<TemplateState | null>(null)
  const [status, setStatus] = useState('Ready')

  async function loadExampleState() {
    try {
      const value = await getData<TemplateState>(TEMPLATE_DATA_KEY)
      setSavedState(value ?? null)
      setStatus(value ? 'Loaded saved plugin data' : 'No saved plugin data yet')
    } catch (error) {
      setStatus(formatStatus(error))
    }
  }

  async function saveExampleState() {
    const nextState = {
      message: 'DawnDesk plugin storage is wired through useDawnDesk().',
      updatedAt: new Date().toISOString(),
    }

    try {
      await setData(TEMPLATE_DATA_KEY, nextState)
      setSavedState(nextState)
      setStatus('Saved example data through the DawnDesk IPC bridge')
    } catch (error) {
      setStatus(formatStatus(error))
    }
  }

  return {
    loadExampleState,
    saveExampleState,
    savedState,
    status,
  }
}
