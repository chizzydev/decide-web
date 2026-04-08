// decide-web/src/store/assistantStore.ts
// Manages the full state of the multi-step assistant decision flow.
// Persists the user's selections across step navigation so going
// back to a previous step does not lose their choices.

import { create } from 'zustand'
import type {
  AssistantStep,
  OsType,
  BrandPreference,
  UsageType,
  PriorityWeights,
  UserPreferences,
  RecommendationResult,
} from '@/types'
import { ASSISTANT_STEPS } from '@/lib/constants'

interface AssistantState {
  // ── Current step ─────────────────────────────────────────
  currentStep: AssistantStep

  // ── User selections ───────────────────────────────────────
  os_type:          OsType            | null
  brand_preference: BrandPreference   | null
  budget_max:       number            | null
  budget_min:       number            | null
  usage_type:       UsageType         | null
  priorities:       PriorityWeights

  // ── Results ───────────────────────────────────────────────
  result:   RecommendationResult | null
  loading:  boolean
  error:    string | null

  // ── Actions ───────────────────────────────────────────────
  setOs:          (os: OsType)                     => void
  setBrand:       (brand: BrandPreference)          => void
  setBudget:      (max: number)                     => void
  setBudgetMin:   (min: number | undefined)         => void
  setUsage:       (usage: UsageType)                => void
  setPriority:    (key: keyof PriorityWeights, value: number) => void
  setResult:      (result: RecommendationResult)    => void
  setLoading:     (loading: boolean)                => void
  setError:       (error: string | null)            => void
  goToStep:       (step: AssistantStep)             => void
  goToNextStep:   ()                                => void
  goToPrevStep:   ()                                => void
  reset:          ()                                => void

  // ── Derived helpers ───────────────────────────────────────
  // Returns the current step sequence based on OS selection.
  // iOS skips the brand step — android includes it.
  getStepSequence: () => readonly AssistantStep[]

  // Returns the user's current selections as a UserPreferences
  // object ready to send to the API. Returns null if any required
  // field has not been selected yet.
  getPreferences: () => UserPreferences | null
}

const DEFAULT_PRIORITIES: PriorityWeights = {
  battery:     5,
  camera:      5,
  performance: 5,
  build:       5,
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────

  currentStep:      'os',
  os_type:          null,
  brand_preference: null,
  budget_max:       null,
  budget_min:       null,
  usage_type:       null,
  priorities:       DEFAULT_PRIORITIES,
  result:           null,
  loading:          false,
  error:            null,

  // ── Actions ───────────────────────────────────────────────

  setOs: (os) => {
    set({
      os_type: os,
      // Reset brand preference when OS changes —
      // apple does not have a brand step so the value would be stale
      brand_preference: os === 'ios' ? 'apple' : null,
    })
  },

  setBrand: (brand) => set({ brand_preference: brand }),

  setBudget: (max) => set({ budget_max: max }),

  setBudgetMin: (min) => set({ budget_min: min ?? null }),

  setUsage: (usage) => set({ usage_type: usage }),

  setPriority: (key, value) => {
    set((state) => ({
      priorities: {
        ...state.priorities,
        [key]: value,
      },
    }))
  },

  setResult: (result) => set({ result }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  goToStep: (step) => set({ currentStep: step }),

  goToNextStep: () => {
    const { currentStep, getStepSequence } = get()
    const sequence = getStepSequence()
    const currentIndex = sequence.indexOf(currentStep)

    // 'results' is not in the sequence array — it is the terminal state.
    // When we are on the last step in the sequence, move to results.
    if (currentIndex === sequence.length - 1) {
      set({ currentStep: 'results' })
      return
    }

    if (currentIndex !== -1 && currentIndex < sequence.length - 1) {
      set({ currentStep: sequence[currentIndex + 1] })
    }
  },

  goToPrevStep: () => {
    const { currentStep, getStepSequence } = get()

    // Cannot go back from the first step
    if (currentStep === 'os') return

    // Going back from results returns to the last step in the sequence
    if (currentStep === 'results') {
      const sequence = getStepSequence()
      set({ currentStep: sequence[sequence.length - 1] })
      return
    }

    const sequence = getStepSequence()
    const currentIndex = sequence.indexOf(currentStep)

    if (currentIndex > 0) {
      set({ currentStep: sequence[currentIndex - 1] })
    }
  },

  reset: () => {
    set({
      currentStep:      'os',
      os_type:          null,
      brand_preference: null,
      budget_max:       null,
      budget_min:       null,
      usage_type:       null,
      priorities:       DEFAULT_PRIORITIES,
      result:           null,
      loading:          false,
      error:            null,
    })
  },

  // ── Derived helpers ───────────────────────────────────────

  getStepSequence: () => {
    const { os_type } = get()
    if (os_type === 'ios') return ASSISTANT_STEPS.ios
    return ASSISTANT_STEPS.android
  },

  getPreferences: (): UserPreferences | null => {
    const {
      os_type,
      brand_preference,
      budget_max,
      budget_min,
      usage_type,
      priorities,
    } = get()

    // All fields must be set before we can build the preferences object.
    // brand_preference is always set — either chosen by the user (Android)
    // or automatically set to 'apple' when OS is iOS.
    if (
      !os_type ||
      !brand_preference ||
      budget_max === null ||
      !usage_type
    ) {
      return null
    }

    return {
      os_type,
      brand_preference,
      budget_max,
      budget_min: budget_min ?? undefined,
      usage_type,
      priorities,
    }
  },
}))