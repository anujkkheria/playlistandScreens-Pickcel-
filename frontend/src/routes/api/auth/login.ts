import { createFileRoute } from '@tanstack/react-router'
import { generateToken, users } from '../../../lib/mock-data'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { email, password } = body

          if (!email || !password) {
            return new Response(
              JSON.stringify({ error: 'Email and password are required' }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Find user by email and password
          const user = users.find(
            (u) => u.email === email && u.password === password,
          )

          if (!user) {
            return new Response(
              JSON.stringify({ error: 'Invalid credentials' }),
              {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Generate token
          const token = generateToken(user._id, user.email)

          // Return user without password
          const { password: _, ...userWithoutPassword } = user

          return new Response(
            JSON.stringify({
              token,
              user: userWithoutPassword,
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
