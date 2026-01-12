import React, { useMemo } from 'react'
import { useAppSelector } from '@/store/hooks'
import { fromMemento as gameFromMemento, type GameMemento } from '@/model/game'

export default function MatchSummaryView() {
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

  return (
    <div>
      <h2>Match Summary</h2>
      <p style={{ opacity: 0.8 }}>Game: {serverGame.id}</p>
      <table>
        <thead>
          <tr>
            <th align="left">Player</th>
            <th align="left">Score</th>
          </tr>
        </thead>
        <tbody>
          {derived.players.map((p, i) => (
            <tr key={p}>
              <td>{p}</td>
              <td>{derived.scores[i] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!derived.currentRound && <p style={{ marginTop: 12 }}>Game has ended.</p>}
    </div>
  )
}
