import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login } from '@/features/auth/authSlice'

export default function LoginView() {
  const dispatch = useAppDispatch()
  const { status, error, isAuthenticated } = useAppSelector((s) => s.auth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const loc = useLocation()
  const nav = useNavigate()
  const redirect = new URLSearchParams(loc.search).get('redirect') ?? '/'

  if (isAuthenticated) {
    nav(redirect, { replace: true })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await dispatch(login({ username, password })).unwrap()
      nav(redirect, { replace: true })
    } catch {
      // handled in slice
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button disabled={status === 'loading'} type="submit">
          Login
        </button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>
      <p>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}
