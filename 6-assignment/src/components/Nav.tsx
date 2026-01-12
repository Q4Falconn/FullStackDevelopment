import Link from 'next/link'
import React from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout } from '../features/auth/authSlice'

/**
 * Navigation bar displayed at the top of every page.  It shows different
 * links depending on whether the current user is authenticated.  When
 * authenticated the player can navigate between the setup, play and summary
 * pages and log out; otherwise only the login link is shown.
 */
export default function Nav() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)

  return (
    <nav className="nav">
      <Link href={isAuthenticated ? '/' : '/login'} style={{ fontWeight: 700, textDecoration: 'none' }}>
        UNO
      </Link>
      {isAuthenticated && (
        <>
          <Link href="/">Setup</Link>
          <Link href="/play">Play</Link>
          <Link href="/summary">Summary</Link>
          <div className="spacer" />
          <span style={{ opacity: 0.8 }}>{user?.username}</span>
          <button
            onClick={() => {
              // Dispatch the logout action to update the Redux state.
              dispatch(logout())
              // Also clear the authentication cookie so that server side
              // redirects trigger correctly on the next request.
              if (typeof document !== 'undefined') {
                document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
              }
            }}
          >
            Logout
          </button>
        </>
      )}
    </nav>
  )
}