import type {
  ApiError,
  CreatePlaylistRequest,
  CreatePlaylistResponse,
  LoginRequest,
  LoginResponse,
  PaginatedResponse,
  PaginationParams,
  Playlist,
  Screen,
  UpdateScreenRequest,
  UpdateScreenResponse,
} from '../types'
import { toast } from 'sonner'

// API base URL from environment
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// API Error class for better error handling
export class ApiErrorClass extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Token storage utilities
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  },

  set: (token: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem('auth_token', token)
  },

  remove: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
  },
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = tokenStorage.get()

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    // Handle different response statuses
    if (response.status === 401) {
      // Unauthorized - clear token and redirect to login
      toast.error('Session expired. Please sign in again.')
      tokenStorage.remove()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ApiErrorClass('Unauthorized', 401)
    }

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = (data as ApiError).message || 'An error occurred'
      toast.error(errorMessage)
      throw new ApiErrorClass(errorMessage, response.status)
    }

    return data as T
  } catch (error) {
    if (error instanceof ApiErrorClass) {
      throw error
    }
    // Network or other errors
    const fallback = 'Network error or server unavailable'
    toast.error(fallback)
    throw new ApiErrorClass(fallback, 0)
  }
}

// Authentication API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiRequest<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    // Store token after successful login
    tokenStorage.set(response.accessToken)
    return { token: response.accessToken }
  },

  logout: (): void => {
    tokenStorage.remove()
  },
}

// Screens API
export const screensApi = {
  getScreens: async (
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Screen>> => {
    const searchParams = new URLSearchParams()

    if (params.search) searchParams.append('search', params.search)
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = `/screens${queryString ? `?${queryString}` : ''}`

    const raw = await apiRequest<{
      items: Screen[]
      total: number
      page: number
      limit: number
    }>(endpoint)
    return {
      data: raw.items,
      pagination: { page: raw.page, limit: raw.limit, total: raw.total },
    }
  },

  updateScreen: async (
    id: string,
    data: UpdateScreenRequest,
  ): Promise<UpdateScreenResponse> => {
    return apiRequest<UpdateScreenResponse>(`/screens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// Playlists API
export const playlistsApi = {
  getPlaylists: async (
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Playlist>> => {
    const searchParams = new URLSearchParams()

    if (params.search) searchParams.append('search', params.search)
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = `/playlists${queryString ? `?${queryString}` : ''}`

    const raw = await apiRequest<{
      items: Playlist[]
      total: number
      page: number
      limit: number
    }>(endpoint)
    return {
      data: raw.items,
      pagination: { page: raw.page, limit: raw.limit, total: raw.total },
    }
  },

  createPlaylist: async (
    data: CreatePlaylistRequest,
  ): Promise<CreatePlaylistResponse> => {
    const created = await apiRequest<{
      _id: string
      name: string
      itemCount: number
    }>('/playlists', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return {
      message: 'Playlist created successfully',
      playlist: {
        _id: created._id,
        name: created.name,
        itemCount: created.itemCount,
      },
    }
  },

  getPlaylistById: async (
    id: string,
  ): Promise<{ _id: string; name: string; items: Array<{ url: string }> }> => {
    return apiRequest<{ _id: string; name: string; items: Array<{ url: string }> }>(
      `/playlists/${id}`,
    )
  },
}

// Export combined API object
export const api = {
  auth: authApi,
  screens: screensApi,
  playlists: playlistsApi,
}
