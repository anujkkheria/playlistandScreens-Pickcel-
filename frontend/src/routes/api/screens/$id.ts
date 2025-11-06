import { createFileRoute } from '@tanstack/react-router'
import { checkAuth, screens } from '../../../lib/mock-data'

export const Route = createFileRoute('/api/screens/$id')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        // Check authentication
        if (!checkAuth(request)) {
          return new Response(
            JSON.stringify({ error: 'Not authorized or missing token' }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        try {
          const body = await request.json()
          const { isActive } = body
          const screenId = params.id

          // Find the screen
          const screen = screens.find((s) => s._id === screenId)
          if (!screen) {
            return new Response(JSON.stringify({ error: 'Screen not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Update the screen
          screen.isActive = isActive

          return new Response(
            JSON.stringify({
              message: 'Screen status updated successfully',
              screen,
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
