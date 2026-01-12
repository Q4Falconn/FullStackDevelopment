import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { register as registerUser } from '@/features/auth/authSlice'

/**
 * Registration page.  Allows a new player to create an account and
 * automatically logs them in upon success.  Uses Next.js routing
 * primitives to navigate back to the home page after registration.
 */
export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const { status, error } = useAppSelector((s) => s.auth)
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      // Dispatch the register action which returns the same payload as login.
      const result = await dispatch(registerUser({ username, password })).unwrap()
      if (result?.token) {
        document.cookie = `auth_token=${result.token}; path=/`
      }
      router.replace('/')
    } catch {
      // handled in slice
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Register</h2>
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
          Create account
        </button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>
      <p>
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </div>
  )
}