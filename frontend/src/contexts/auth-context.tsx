import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, tokenStorage } from '../lib/api'
import type { AuthContextType, User } from '../types'

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from stored token
  useEffect(() => {
    const storedToken = tokenStorage.get()
    if (storedToken) {
      setToken(storedToken)
      // In a real app, you might want to validate the token with the server
      // For now, we'll trust the stored token and extract user info when needed
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await api.auth.login({ email, password })
      setToken(response.token)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = (): void => {
    api.auth.logout()
    setToken(null)
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth<TProps extends object>(
  Component: React.ComponentType<TProps>,
): React.ComponentType<TProps> {
  return function AuthenticatedComponent(props: TProps) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      )
    }

    if (!isAuthenticated) {
      // Redirect to login - this would be handled by the router in practice
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return null
    }

    return <Component {...props} />
  }
}
