import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { fromMemento as gameFromMemento, type GameMemento } from '@/model/game'

export default function GameOverView() {
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
  let winnerIndex: number | undefined
  for (let i = 0; i < scores.length; i++) if (scores[i]! >= derived.targetScore) winnerIndex = i

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
      <Link to="/summary">Go to summary</Link>
    </div>
  )
}
