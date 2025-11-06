import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/use-auth'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'

export const Route = createFileRoute('/playlists')({
  component: PlaylistsPage,
})

function PlaylistsPage() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state for creating new playlist
  const [name, setName] = useState('')
  const [itemUrls, setItemUrls] = useState('')
  const [nameError, setNameError] = useState('')
  const [urlsError, setUrlsError] = useState('')

  // Query for playlists data
  const {
    data: playlistsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['playlists', { search, page, limit: 10 }],
    queryFn: () => api.playlists.getPlaylists({ search, page, limit: 10 }),
    staleTime: 30000, // 30 seconds
  })

  // Selected playlist detail
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: playlistDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['playlist', selectedId],
    queryFn: () => api.playlists.getPlaylistById(selectedId as string),
    enabled: !!selectedId,
    staleTime: 30000,
  })

  // Mutation for creating new playlist
  const createPlaylistMutation = useMutation({
    mutationFn: api.playlists.createPlaylist,
    onSuccess: () => {
      setSuccess('Playlist created successfully!')
      setError('')
      // Reset form
      setName('')
      setItemUrls('')
      setNameError('')
      setUrlsError('')
      // Refresh playlists
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create playlist')
      setSuccess('')
    },
  })

  const validateForm = (): boolean => {
    let isValid = true
    setNameError('')
    setUrlsError('')

    if (!name.trim()) {
      setNameError('Playlist name is required')
      isValid = false
    }

    if (itemUrls.trim()) {
      const urls = itemUrls.split('\n').filter((url) => url.trim())
      if (urls.length > 10) {
        setUrlsError('Maximum 10 URLs allowed')
        isValid = false
      }

      // Basic URL validation
      const urlPattern = /^https?:\/\/.+/
      const invalidUrls = urls.filter((url) => !urlPattern.test(url.trim()))
      if (invalidUrls.length > 0) {
        setUrlsError('All URLs must start with http:// or https://')
        isValid = false
      }
    }

    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const urls = itemUrls.trim()
      ? itemUrls
          .split('\n')
          .map((url) => url.trim())
          .filter((url) => url)
      : []

    createPlaylistMutation.mutate({
      name: name.trim(),
      itemUrls: urls.length > 0 ? urls : undefined,
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
            Failed to load playlists. Please try refreshing the page.
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
                Playlists Management
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name || 'User'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/screens')}
              >
                Go to Screens
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Playlist Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Playlist</CardTitle>
              <CardDescription>
                Create a new playlist with optional media URLs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Playlist Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Morning Playlist"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={nameError ? 'border-red-500' : ''}
                    disabled={createPlaylistMutation.isPending}
                  />
                  {nameError && (
                    <p className="text-sm text-red-500">{nameError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urls">Item URLs (optional)</Label>
                  <Textarea
                    id="urls"
                    placeholder="Enter one URL per line (max 10)&#10;https://example.com/video1.mp4&#10;https://example.com/video2.mp4"
                    value={itemUrls}
                    onChange={(e) => setItemUrls(e.target.value)}
                    className={urlsError ? 'border-red-500' : ''}
                    rows={6}
                    disabled={createPlaylistMutation.isPending}
                  />
                  {urlsError && (
                    <p className="text-sm text-red-500">{urlsError}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Enter one URL per line. Maximum 10 URLs allowed.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createPlaylistMutation.isPending}
                >
                  {createPlaylistMutation.isPending
                    ? 'Creating...'
                    : 'Create Playlist'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Playlists List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Existing Playlists</CardTitle>
                <form
                  onSubmit={handleSearch}
                  className="flex items-center space-x-2"
                >
                  <Input
                    placeholder="Search playlists..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-48"
                  />
                  <Button type="submit" size="sm">
                    Search
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="text-lg">Loading playlists...</div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playlistsData?.data.map((playlist) => (
                        <TableRow
                          key={playlist._id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedId(playlist._id)}
                        >
                          <TableCell className="font-medium">
                            {playlist.name}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {playlist.itemCount} items
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {playlistsData?.data.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center text-gray-500 py-8"
                          >
                            No playlists found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {playlistsData?.pagination &&
                    playlistsData.pagination.total > 0 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-700">
                          Showing page {playlistsData.pagination.page} of{' '}
                          {Math.ceil(
                            playlistsData.pagination.total /
                              playlistsData.pagination.limit,
                          )}{' '}
                          ({playlistsData.pagination.total} total playlists)
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
                                playlistsData.pagination.total /
                                  playlistsData.pagination.limit,
                              )
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}

                  {/* Detail panel */}
                  {selectedId && (
                    <div className="mt-6 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Playlist Details
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedId(null)}
                        >
                          Close
                        </Button>
                      </div>
                      {isLoadingDetail ? (
                        <div className="py-4 text-gray-600">Loading...</div>
                      ) : playlistDetail ? (
                        <div className="mt-2">
                          <div className="mb-2 text-sm text-gray-700">
                            <span className="font-medium">Name:</span>{' '}
                            {playlistDetail.name}
                          </div>
                          <div>
                            <div className="font-medium mb-1">
                              Items ({playlistDetail.items.length})
                            </div>
                            {playlistDetail.items.length === 0 ? (
                              <div className="text-sm text-gray-500">
                                No items
                              </div>
                            ) : (
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                {playlistDetail.items.map((it, idx) => (
                                  <li key={idx}>
                                    <a
                                      className="text-blue-700 underline"
                                      href={it.url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {it.url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-gray-600">Not found</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
