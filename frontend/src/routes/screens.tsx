import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/use-auth'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Switch } from '../components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'

import type { Screen } from '../types'

export const Route = createFileRoute('/screens')({
  component: ScreensPage,
})

function ScreensPage() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  // Query for screens data
  const {
    data: screensData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['screens', { search, page, limit: 10 }],
    queryFn: () => api.screens.getScreens({ search, page, limit: 10 }),
    staleTime: 30000, // 30 seconds
  })

  // Mutation for updating screen status with optimistic updates
  const updateScreenMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.screens.updateScreen(id, { isActive }),
    onMutate: async ({ id, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['screens'] })

      // Snapshot the previous value
      const previousScreens = queryClient.getQueryData([
        'screens',
        { search, page, limit: 10 },
      ])

      // Optimistically update the cache
      queryClient.setQueryData(
        ['screens', { search, page, limit: 10 }],
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((screen: Screen) =>
              screen._id === id ? { ...screen, isActive } : screen,
            ),
          }
        },
      )

      return { previousScreens }
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousScreens) {
        queryClient.setQueryData(
          ['screens', { search, page, limit: 10 }],
          context.previousScreens,
        )
      }
      setError(
        err instanceof Error ? err.message : 'Failed to update screen status',
      )
    },
    onSuccess: () => {
      setError('')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['screens'] })
    },
  })

  const handleToggleScreen = (screen: Screen) => {
    updateScreenMutation.mutate({
      id: screen._id,
      isActive: !screen.isActive,
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page on new search
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load screens. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Screens Management
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name || 'User'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/playlists')}
              >
                Go to Playlists
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Screens</CardTitle>
              <form
                onSubmit={handleSearch}
                className="flex items-center space-x-2"
              >
                <Input
                  placeholder="Search screens..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                />
                <Button type="submit" size="sm">
                  Search
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-lg">Loading screens...</div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {screensData?.data.map((screen) => (
                      <TableRow key={screen._id}>
                        <TableCell className="font-medium">
                          {screen.name}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              screen.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {screen.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={screen.isActive}
                              onCheckedChange={() => handleToggleScreen(screen)}
                              disabled={updateScreenMutation.isPending}
                            />
                            <span className="text-sm text-gray-500">
                              {screen.isActive ? 'Deactivate' : 'Activate'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {screensData?.pagination && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-700">
                      Showing page {screensData.pagination.page} of{' '}
                      {Math.ceil(
                        screensData.pagination.total /
                          screensData.pagination.limit,
                      )}{' '}
                      ({screensData.pagination.total} total screens)
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={
                          page >=
                          Math.ceil(
                            screensData.pagination.total /
                              screensData.pagination.limit,
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
