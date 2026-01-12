import React, { useEffect } from 'react'
import { Navigate, Route, Routes, Link, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { refreshMe, logout } from './features/auth/authSlice'

import LoginView from './views/LoginView'
import RegisterView from './views/RegisterView'
import GameSetupView from './views/GameSetupView'
import GamePlayView from './views/GamePlayView'
import GameOverView from './views/GameOverView'
import MatchSummaryView from './views/MatchSummaryView'

function Protected({ children }: { children: React.ReactNode }) {
  const isAuthed = useAppSelector((s) => s.auth.isAuthenticated)
  const loc = useLocation()
  if (!isAuthed) return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />
  return <>{children}</>
}

export default function App() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)

  useEffect(() => {
    dispatch(refreshMe())
  }, [dispatch])

  return (
    <>
      <div className="nav">
        <Link to={isAuthenticated ? '/' : '/login'} style={{ fontWeight: 700, textDecoration: 'none' }}>
          UNO
        </Link>
        {isAuthenticated && (
          <>
            <Link to="/">Setup</Link>
            <Link to="/play">Play</Link>
            <Link to="/summary">Summary</Link>
            <div className="spacer" />
            <span style={{ opacity: 0.8 }}>{user?.username}</span>
            <button onClick={() => dispatch(logout())}>Logout</button>
          </>
        )}
      </div>

      <div className="container">
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />

          <Route
            path="/"
            element={
              <Protected>
                <GameSetupView />
              </Protected>
            }
          />
          <Route
            path="/play"
            element={
              <Protected>
                <GamePlayView />
              </Protected>
            }
          />
          <Route
            path="/game-over"
            element={
              <Protected>
                <GameOverView />
              </Protected>
            }
          />
          <Route
            path="/summary"
            element={
              <Protected>
                <MatchSummaryView />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}
