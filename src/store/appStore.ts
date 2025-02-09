import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Branch } from '@/types/branch'
import { initializationService } from '@/services/initializationService'

interface AppState {
  // Estado
  isInitialized: boolean
  isLoading: boolean
  error: Error | null
  empresa: any | null
  branches: Branch[]
  currentBranch: Branch | null

  // Acciones
  initialize: (userId: string) => Promise<void>
  setCurrentBranch: (branch: Branch) => void
  reset: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isInitialized: false,
      isLoading: false,
      error: null,
      empresa: null,
      branches: [],
      currentBranch: null,

      // Acciones
      initialize: async (userId: string) => {
        try {
          set({ isLoading: true, error: null })

          const result = await initializationService.initialize(userId)

          if (result.error) {
            throw result.error
          }

          set({
            isInitialized: true,
            empresa: result.empresa,
            branches: result.branches,
            currentBranch: result.currentBranch
          })
        } catch (error: any) {
          set({ error: new Error(error.message) })
        } finally {
          set({ isLoading: false })
        }
      },

      setCurrentBranch: (branch: Branch) => {
        set({ currentBranch: branch })
        localStorage.setItem('currentBranchId', branch.id)
      },

      reset: () => {
        set({
          isInitialized: false,
          isLoading: false,
          error: null,
          empresa: null,
          branches: [],
          currentBranch: null
        })
        localStorage.removeItem('currentBranchId')
      }
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        empresa: state.empresa,
        currentBranch: state.currentBranch
      })
    }
  )
) 