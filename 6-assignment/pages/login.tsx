import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login } from '@/features/auth/authSlice'

/**
 * Login page.  This component mirrors the functionality of the original
 * `LoginView` but uses Next.js routing primitives instead of
 * react‑router.  When a user successfully logs in they are redirected
 * back to the page they originally attempted to visit via a
 * `redirect` query parameter.
 */
export default function LoginPage() {
  const dispatch = useAppDispatch()
  const { status, error, isAuthenticated } = useAppSelector((s) => s.auth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const redirect = (router.query.redirect as string) ?? '/'

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect)
    }
  }, [isAuthenticated, redirect, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      // Dispatch the login action and unwrap the returned promise to get the
      // payload containing the token and user.  Persist the token in a
      // cookie so that it can be accessed during server‑side rendering.
      const result = await dispatch(login({ username, password })).unwrap()
      if (result?.token) {
        // Set a session cookie visible to the server.  The cookie expires
        // when the browser session ends.
        document.cookie = `auth_token=${result.token}; path=/`
      }
      router.replace(redirect)
    } catch {
      // any errors are exposed via the slice
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
        No account? <Link href="/register">Register</Link>
      </p>
    </div>
  )
}