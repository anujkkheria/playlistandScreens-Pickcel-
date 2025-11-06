import { Store } from '@tanstack/store'
import { api, tokenStorage } from '../lib/api'
import type { User } from '../types'

// Auth store state interface
export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Initial auth state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
}

// Create the auth store
export const authStore = new Store(initialState)

// Auth store actions
export const authActions = {
  // Initialize auth state from stored token
  initialize: () => {
    const storedToken = tokenStorage.get()
    if (storedToken) {
      authStore.setState((state) => ({
        ...state,
        token: storedToken,
        isAuthenticated: true,
      }))
      // In a real app, you might want to validate the token with the server
      // For now, we'll trust the stored token and extract user info when needed
    }
  },

  // Login action
  login: async (email: string, password: string): Promise<void> => {
    authStore.setState((state) => ({ ...state, isLoading: true }))

    try {
      const response = await api.auth.login({ email, password })

      authStore.setState((state) => ({
        ...state,
        token: response.token,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      }))
    } catch (error) {
      authStore.setState((state) => ({
        ...state,
        isLoading: false,
      }))
      throw error
    }
  },

  // Logout action
  logout: (): void => {
    api.auth.logout()
    authStore.setState(() => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    }))
  },

  // Set loading state
  setLoading: (isLoading: boolean): void => {
    authStore.setState((state) => ({ ...state, isLoading }))
  },

  // Set user
  setUser: (user: User | null): void => {
    authStore.setState((state) => ({ ...state, user }))
  },
}

// Initialize the store when the module loads
if (typeof window !== 'undefined') {
  authActions.initialize()
}
