import { createFileRoute } from '@tanstack/react-router'
import { checkAuth, generateId, playlists } from '../../lib/mock-data'

export const Route = createFileRoute('/api/playlists')({
  server: {
    handlers: {
      GET: ({ request }) => {
        // Check authentication
        if (!checkAuth(request)) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const url = new URL(request.url)
        const search = url.searchParams.get('search') || ''
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '10')

        // Filter playlists by search term
        let filteredPlaylists = playlists
        if (search) {
          filteredPlaylists = playlists.filter((playlist) =>
            playlist.name.toLowerCase().includes(search.toLowerCase()),
          )
        }

        // Pagination
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedPlaylists = filteredPlaylists.slice(startIndex, endIndex)

        return new Response(
          JSON.stringify({
            data: paginatedPlaylists,
            pagination: {
              page,
              limit,
              total: filteredPlaylists.length,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },

      POST: async ({ request }) => {
        // Check authentication
        if (!checkAuth(request)) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        try {
          const body = await request.json()
          const { name, itemUrls } = body

          if (!name || !name.trim()) {
            return new Response(
              JSON.stringify({ error: 'Playlist name is required' }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Validate URLs if provided
          if (itemUrls && Array.isArray(itemUrls)) {
            if (itemUrls.length > 10) {
              return new Response(
                JSON.stringify({ error: 'Maximum 10 URLs allowed' }),
                {
                  status: 400,
                  headers: { 'Content-Type': 'application/json' },
                },
              )
            }

            const urlPattern = /^https?:\/\/.+/
            const invalidUrls = itemUrls.filter((url) => !urlPattern.test(url))
            if (invalidUrls.length > 0) {
              return new Response(
                JSON.stringify({
                  error: 'All URLs must start with http:// or https://',
                }),
                {
                  status: 400,
                  headers: { 'Content-Type': 'application/json' },
                },
              )
            }
          }

          // Create new playlist
          const newPlaylist = {
            _id: generateId(),
            name: name.trim(),
            itemCount: itemUrls ? itemUrls.length : 0,
          }

          playlists.push(newPlaylist)

          return new Response(
            JSON.stringify({
              message: 'Playlist created successfully',
              playlist: newPlaylist,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Invalid request body' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
