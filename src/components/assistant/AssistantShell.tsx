// decide-web/src/components/assistant/AssistantShell.tsx
// The outer container for the assistant experience.
// Supports two modes:
// 1. Guided assistant — the existing multi-step recommendation flow
// 2. AI agent — the new free-form natural language assistant
//
// The guided flow remains untouched internally.
// This shell only decides which mode to render.

'use client'

import React, { useMemo, useState } from 'react'
import { useAssistant } from '@/hooks/useAssistant'
import { Button, Divider } from '@/components/ui'
import { AgentPanel } from './AgentPanel'
import { StepIndicator } from './StepIndicator'
import { StepOs } from './StepOs'
import { StepBrand } from './StepBrand'
import { StepBudget } from './StepBudget'
import { StepUsage } from './StepUsage'
import { StepPriorities } from './StepPriorities'
import { ResultsPanel } from './ResultsPanel'

type AssistantMode = 'guided' | 'agent'

export const AssistantShell = () => {
  const [mode, setMode] = useState<AssistantMode>('guided')

  const {
    currentStep,
    os_type,
    error,
    goBack,
    reset,
    getStepNumber,
    getTotalSteps,
  } = useAssistant()

  const isGuided = mode === 'guided'
  const isFirstStep = currentStep === 'os'
  const isResults = currentStep === 'results'

  const stepNumber = isResults ? null : getStepNumber(currentStep)
  const totalSteps = getTotalSteps()

  const pageTitle = useMemo(() => {
    return isGuided ? 'Guided Assistant' : 'AI Agent'
  }, [isGuided])

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-sticky bg-bg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 min-h-14 py-3 flex flex-col gap-3 sm:h-14 sm:min-h-0 sm:py-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            {/* Logo mark */}
            <span className="font-ui font-black text-base tracking-tight text-text-primary">
              deci<span className="text-accent">de</span>
            </span>

            <span className="text-xs text-text-muted sm:hidden">
              {pageTitle}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end sm:flex-1">
            {/* Guided flow step indicator */}
            {isGuided && !isResults && stepNumber !== null ? (
              <StepIndicator
                current={stepNumber}
                total={totalSteps}
                osType={os_type}
              />
            ) : (
              <span className="hidden sm:block text-xs text-text-muted">
                {pageTitle}
              </span>
            )}

            <div className="inline-flex items-center rounded-xl border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setMode('guided')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isGuided
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
                aria-pressed={isGuided}
              >
                Guided
              </button>

              <button
                type="button"
                onClick={() => setMode('agent')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  !isGuided
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
                aria-pressed={!isGuided}
              >
                AI Agent
              </button>
            </div>

            {/* Start over only applies to guided flow */}
            {isGuided && !isFirstStep && (
              <button
                onClick={reset}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
                aria-label="Start over"
              >
                Start over
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-2xl mx-auto px-4 py-10 flex-1 flex flex-col">
          {!isGuided ? (
            <AgentPanel />
          ) : (
            <>
              {/* Step content */}
              <div className="flex-1">
                {currentStep === 'os' && <StepOs />}
                {currentStep === 'brand' && <StepBrand />}
                {currentStep === 'budget' && <StepBudget />}
                {currentStep === 'usage' && <StepUsage />}
                {currentStep === 'priorities' && <StepPriorities />}
                {currentStep === 'results' && <ResultsPanel />}
              </div>

              {/* Back navigation — shown on guided steps except OS and results */}
              {!isFirstStep && !isResults && (
                <>
                  <Divider className="my-8" />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goBack}
                      aria-label="Go to previous step"
                    >
                      ← Back
                    </Button>

                    {error && (
                      <p
                        className="text-xs text-error"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}