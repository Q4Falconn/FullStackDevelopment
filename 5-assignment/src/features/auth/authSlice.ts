import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { graphqlRequest } from '@/api/graphqlClient'
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY } from '@/api/queries'

export type User = { id: string; username: string }

const USER_KEY = 'uno_user'
const TOKEN_KEY = 'auth_token'

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  status: 'idle' | 'loading' | 'error'
  error?: string
}

function loadUserFromStorage(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

function saveUser(u: User | null) {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
  else localStorage.removeItem(USER_KEY)
}

export const register = createAsyncThunk('auth/register', async (args: { username: string; password: string }) => {
  const username = args.username.trim()
  const password = args.password
  if (!username || !password) throw new Error('Username and password required')

  await graphqlRequest<{ createUser: { id: string; username: string } }, { username: string; password: string }>(
    REGISTER_MUTATION,
    { username, password }
  )

  // auto-login after register
  const data = await graphqlRequest<{ login: { token: string; user: User } }, { username: string; password: string }>(
    LOGIN_MUTATION,
    { username, password }
  )

  return data.login
})

export const login = createAsyncThunk('auth/login', async (args: { username: string; password: string }) => {
  const username = args.username.trim()
  const password = args.password
  if (!username || !password) throw new Error('Username and password required')

  const data = await graphqlRequest<{ login: { token: string; user: User } }, { username: string; password: string }>(
    LOGIN_MUTATION,
    { username, password }
  )

  if (!data.login?.token || !data.login?.user) throw new Error('Invalid username or password')
  return data.login
})

export const refreshMe = createAsyncThunk('auth/refreshMe', async () => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  const data = await graphqlRequest<{ me: User | null }>(ME_QUERY)
  return data.me
})

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem(TOKEN_KEY)
  saveUser(null)
  return true
})

const initialUser = loadUserFromStorage()

const initialState: AuthState = {
  user: initialUser,
  isAuthenticated: !!initialUser,
  status: 'idle',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => {
        s.status = 'loading'
        s.error = undefined
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'idle'
        localStorage.setItem(TOKEN_KEY, a.payload.token)
        s.user = a.payload.user
        s.isAuthenticated = true
        saveUser(a.payload.user)
      })
      .addCase(login.rejected, (s, a) => {
        s.status = 'error'
        s.error = a.error.message
      })
      .addCase(register.pending, (s) => {
        s.status = 'loading'
        s.error = undefined
      })
      .addCase(register.fulfilled, (s, a) => {
        s.status = 'idle'
        localStorage.setItem(TOKEN_KEY, a.payload.token)
        s.user = a.payload.user
        s.isAuthenticated = true
        saveUser(a.payload.user)
      })
      .addCase(register.rejected, (s, a) => {
        s.status = 'error'
        s.error = a.error.message
      })
      .addCase(refreshMe.fulfilled, (s, a: PayloadAction<User | null>) => {
        s.user = a.payload
        s.isAuthenticated = !!a.payload
        saveUser(a.payload)
      })
      .addCase(logout.fulfilled, (s) => {
        s.user = null
        s.isAuthenticated = false
        s.status = 'idle'
        s.error = undefined
      })
  },
})

export default authSlice.reducer
