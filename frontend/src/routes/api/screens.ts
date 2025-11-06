import { createFileRoute } from '@tanstack/react-router'
import { checkAuth, screens } from '../../lib/mock-data'

export const Route = createFileRoute('/api/screens')({
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

        // Filter screens by search term
        let filteredScreens = screens
        if (search) {
          filteredScreens = screens.filter((screen) =>
            screen.name.toLowerCase().includes(search.toLowerCase()),
          )
        }

        // Pagination
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedScreens = filteredScreens.slice(startIndex, endIndex)

        return new Response(
          JSON.stringify({
            data: paginatedScreens,
            pagination: {
              page,
              limit,
              total: filteredScreens.length,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
