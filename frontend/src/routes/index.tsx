import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useAuth } from '../hooks/use-auth'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect to screens if authenticated
        window.location.href = '/screens'
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login'
      }
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Redirecting...</div>
    </div>
  )
}
