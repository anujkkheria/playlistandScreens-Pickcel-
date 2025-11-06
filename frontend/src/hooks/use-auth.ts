import { useStore } from '@tanstack/react-store'
import { authActions, authStore } from '../stores/auth-store'
import type { User } from '../types'

// Hook to use auth store
export function useAuth() {
  const state = useStore(authStore)

  return {
    // State
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,

    // Actions
    login: authActions.login,
    logout: authActions.logout,
    setUser: authActions.setUser,
    setLoading: authActions.setLoading,
  }
}

// Selector hooks for specific parts of the state
export function useAuthUser(): User | null {
  return useStore(authStore, (state) => state.user)
}

export function useAuthToken(): string | null {
  return useStore(authStore, (state) => state.token)
}

export function useAuthLoading(): boolean {
  return useStore(authStore, (state) => state.isLoading)
}

export function useIsAuthenticated(): boolean {
  return useStore(authStore, (state) => state.isAuthenticated)
}
