import Link from 'next/link'
import React, { useMemo } from 'react'
import { useAppSelector } from '@/store/hooks'
import { fromMemento as gameFromMemento, type GameMemento } from '@/model/game'
import type { GetServerSideProps } from 'next'

/**
 * Game over page.  Shows the final scores and identifies the winner.  A
 * link is provided back to the match summary page.  Access to this
 * page is restricted on the server using getServerSideProps.
 */
export default function GameOverPage() {
  const serverGame = useAppSelector((s) => s.game.serverGame)
  const derived = useMemo(() => {
    const m = serverGame?.state as unknown as GameMemento | undefined
    if (!m) return null
    try {
      return gameFromMemento(m).state
    } catch {
      return null
    }
  }, [serverGame?.state])

  if (!serverGame || !derived) return <p>No game loaded.</p>

  const players = derived.players
  const scores = derived.scores
  let winnerIndex: number | undefined = undefined
  for (let i = 0; i < scores.length; i++) {
    if (scores[i]! >= derived.targetScore) winnerIndex = i
  }

  return (
    <div>
      <h2>Game Over</h2>
      <p>
        Winner: <b>{winnerIndex !== undefined ? players[winnerIndex] : '—'}</b>
      </p>
      <h3>Final scores</h3>
      <ul>
        {players.map((p, i) => (
          <li key={p}>
            {p}: {scores[i] ?? 0}
          </li>
        ))}
      </ul>
      <Link href="/summary">Go to summary</Link>
    </div>
  )
}

// Protect this page on the server side as well.  If the user is not
// authenticated they are redirected to the login page.  Without this
// guard unauthenticated users could load the page before the client
// detects their authentication state.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = ctx.req.cookies?.['auth_token']
  if (!token) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false,
      },
    }
  }
  return { props: {} }
}