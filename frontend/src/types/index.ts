// User related types
export interface User {
  _id: string
  name: string
  email: string
  role: 'ADMIN' | 'USER'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

// Screen related types
export interface Screen {
  _id: string
  name: string
  isActive: boolean
}

export interface UpdateScreenRequest {
  isActive: boolean
}

export interface UpdateScreenResponse {
  _id: string
  isActive: boolean
}

// Playlist related types
export interface Playlist {
  _id: string
  name: string
  itemCount: number
}

export interface CreatePlaylistRequest {
  name: string
  itemUrls?: Array<string>
}

export interface CreatePlaylistResponse {
  message: string
  playlist: Playlist
}

// API pagination and response types
export interface PaginationParams {
  search?: string
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
}

export interface PaginatedResponse<T> {
  data: Array<T>
  pagination: PaginationMeta
}

// API error types
export interface ApiError {
  message: string
}
