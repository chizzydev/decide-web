// decide-web/src/hooks/useAssistant.ts
// The primary hook for the assistant flow.
// Connects the assistant store to the recommendation API.
// Components use this hook rather than touching the store directly.

import { useAssistantStore } from '@/store/assistantStore'
import { useRecommendations } from './useRecommendations'
import type {
  OsType,
  BrandPreference,
  UsageType,
  PriorityWeights,
  AssistantStep,
} from '@/types'

export const useAssistant = () => {
  const store = useAssistantStore()
  const { fetchRecommendations } = useRecommendations()

  // Called when the user completes the final step and hits "Get Results".
  // Builds the preferences object and fires the API call.
  // Advances to the results step only after the API responds.
  const submitAssistant = async (): Promise<void> => {
    const preferences = store.getPreferences()

    if (!preferences) {
      store.setError('Please complete all steps before getting results.')
      return
    }

    store.goToStep('results')
    await fetchRecommendations(preferences)
  }

  // Called when the user selects an OS and advances.
  // Skips the brand step automatically for iOS.
  const selectOs = (os: OsType): void => {
    store.setOs(os)
    store.goToNextStep()
  }

  // Called when the user selects a brand or "No Preference" and advances.
  const selectBrand = (brand: BrandPreference): void => {
    store.setBrand(brand)
    store.goToNextStep()
  }

  // Called when the user selects a budget tier and advances.
  const selectBudget = (max: number): void => {
    store.setBudget(max)
    store.goToNextStep()
  }

  // Called when the user selects a usage type and advances.
  const selectUsage = (usage: UsageType): void => {
    store.setUsage(usage)
    store.goToNextStep()
  }

  // Called on every slider change — does not advance the step.
  // The user manually hits "Get Results" when ready.
  const updatePriority = (
    key: keyof PriorityWeights,
    value: number
  ): void => {
    store.setPriority(key, value)
  }

  // Returns the 1-based step number for the progress indicator.
  // e.g. step 'budget' on the Android path → 3
  const getStepNumber = (step: AssistantStep): number => {
    const sequence = store.getStepSequence()
    const index = sequence.indexOf(step)
    return index === -1 ? 0 : index + 1
  }

  // Returns the total number of steps for the current OS path.
  const getTotalSteps = (): number => {
    return store.getStepSequence().length
  }

  return {
    // State
    currentStep:      store.currentStep,
    os_type:          store.os_type,
    brand_preference: store.brand_preference,
    budget_max:       store.budget_max,
    usage_type:       store.usage_type,
    priorities:       store.priorities,
    result:           store.result,
    loading:          store.loading,
    error:            store.error,

    // Actions
    selectOs,
    selectBrand,
    selectBudget,
    selectUsage,
    updatePriority,
    submitAssistant,
    goBack:      store.goToPrevStep,
    goToStep:    store.goToStep,
    reset:       store.reset,

    // Helpers
    getStepNumber,
    getTotalSteps,
    getPreferences: store.getPreferences,
  }
}