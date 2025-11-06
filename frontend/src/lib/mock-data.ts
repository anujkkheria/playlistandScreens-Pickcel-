// Shared in-memory data store for mock API
import jwt from 'jsonwebtoken'

// JWT Secret (in production, this should be in environment variables)
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production'

export interface User {
  _id: string
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'USER'
}

export interface Screen {
  _id: string
  name: string
  isActive: boolean
}

export interface Playlist {
  _id: string
  name: string
  itemCount: number
}

// Users data
export const users: Array<User> = [
  {
    _id: '6651f6e1c0e7a2b3dcdcf8a1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123', // In real app, this would be hashed
    role: 'ADMIN',
  },
  {
    _id: '6651f6e1c0e7a2b3dcdcf8a2',
    name: 'Regular User',
    email: 'user@example.com',
    password: 'password123',
    role: 'USER',
  },
]

// Screens data
export const screens: Array<Screen> = [
  {
    _id: '6651f7f2e2e9a3c4dcdc3211',
    name: 'Lobby Screen',
    isActive: true,
  },
  {
    _id: '6651f80ae2e9a3c4dcdc3212',
    name: 'Conference Display',
    isActive: false,
  },
  {
    _id: '6651f80ae2e9a3c4dcdc3213',
    name: 'Cafeteria Monitor',
    isActive: true,
  },
  {
    _id: '6651f80ae2e9a3c4dcdc3214',
    name: 'Reception Screen',
    isActive: false,
  },
  {
    _id: '6651f80ae2e9a3c4dcdc3215',
    name: 'Training Room Display',
    isActive: true,
  },
]

// Playlists data
export const playlists: Array<Playlist> = [
  {
    _id: '6651f9d9e2e9a3c4dcdc3411',
    name: 'Morning Playlist',
    itemCount: 5,
  },
  {
    _id: '6651fa21e2e9a3c4dcdc3412',
    name: 'Evening Playlist',
    itemCount: 8,
  },
  {
    _id: '6651fa21e2e9a3c4dcdc3413',
    name: 'Weekend Special',
    itemCount: 12,
  },
  {
    _id: '6651fa21e2e9a3c4dcdc3414',
    name: 'Holiday Celebration',
    itemCount: 6,
  },
]

// Helper functions
export const checkAuth = (request: Request): boolean => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    // Verify the JWT token
    jwt.verify(token, JWT_SECRET)
    return true
  } catch (error) {
    return false
  }
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 24)
}

export const generateToken = (userId: string, userEmail: string): string => {
  // Create a proper JWT token with payload
  return jwt.sign(
    {
      userId,
      email: userEmail,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    },
    JWT_SECRET,
  )
}

export const verifyToken = (
  token: string,
): { userId: string; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      userId: decoded.userId,
      email: decoded.email,
    }
  } catch (error) {
    return null
  }
}
