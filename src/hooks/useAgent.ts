// decide-web/src/hooks/useAgent.ts
// Isolated hook for the free-form AI agent flow.
// Keeps the existing step-based assistant untouched.

import { useState } from 'react'
import { agentApi } from '@/lib/api'
import type { AgentResponse } from '@/types/api'

export const useAgent = () => {
  const [response, setResponse] = useState<AgentResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAgent = async (message: string): Promise<void> => {
    const trimmed = message.trim()

    if (!trimmed) {
      setError('Please enter a message.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await agentApi.decide(trimmed)
      setResponse({
        success: true,
        message: 'Agent response received successfully.',
        data,
      })
    } catch (err) {
      setResponse(null)
      setError(
        err instanceof Error ? err.message : 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  const resetAgent = (): void => {
    setResponse(null)
    setError(null)
    setLoading(false)
  }

  return {
    response,
    loading,
    error,
    runAgent,
    resetAgent,
  }
}