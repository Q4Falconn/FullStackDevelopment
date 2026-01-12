import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchGames, createLobbyGame, joinLobbyGame } from '@/features/game/lobbySlice'
import { loadGame, subscribeToGame, setCurrentPlayerName } from '@/features/game/gameSlice'

export default function GameSetupView() {
  const dispatch = useAppDispatch()
  const nav = useNavigate()
  const lobby = useAppSelector((s) => s.lobby)
  const user = useAppSelector((s) => s.auth.user)

  const [amountOfPlayers, setAmountOfPlayers] = useState(4)
  const [targetScore, setTargetScore] = useState(500)
  const [cardsPerPlayer, setCardsPerPlayer] = useState(7)

  useEffect(() => {
    dispatch(fetchGames())
  }, [dispatch])

  useEffect(() => {
    if (user?.username) dispatch(setCurrentPlayerName(user.username))
  }, [dispatch, user?.username])

  async function onCreate() {
    const id = await dispatch(
      createLobbyGame({ amountOfPlayers, targetScore, cardsPerPlayer })
    ).unwrap()
    await dispatch(loadGame({ gameId: id }))
    await dispatch(subscribeToGame({ gameId: id }))
    nav('/play')
  }

  async function onJoin(id: string) {
    await dispatch(joinLobbyGame({ gameId: id })).unwrap()
    await dispatch(loadGame({ gameId: id }))
    await dispatch(subscribeToGame({ gameId: id }))
    nav('/play')
  }

  return (
    <div>
      <h2>Game setup</h2>

      <div style={{ display: 'grid', gap: 8, maxWidth: 520, border: '1px solid #e5e5e5', padding: 12, borderRadius: 10 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label>
            Players
            <input
              type="number"
              min={2}
              max={10}
              value={amountOfPlayers}
              onChange={(e) => setAmountOfPlayers(Number(e.target.value))}
            />
          </label>
          <label>
            Target score
            <input type="number" min={1} value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))} />
          </label>
          <label>
            Cards/player
            <input
              type="number"
              min={1}
              max={15}
              value={cardsPerPlayer}
              onChange={(e) => setCardsPerPlayer(Number(e.target.value))}
            />
          </label>
        </div>
        <button onClick={onCreate}>Create game</button>
      </div>

      <h3 style={{ marginTop: 24 }}>Open games</h3>
      <button onClick={() => dispatch(fetchGames())} disabled={lobby.status === 'loading'}>
        Refresh
      </button>
      {lobby.error && <p style={{ color: 'crimson' }}>{lobby.error}</p>}

      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        {lobby.games.map((g) => (
          <div key={g.id} style={{ border: '1px solid #e5e5e5', padding: 12, borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{g.id}</strong>
              <span>Host: {g.host}</span>
              <span>Status: {g.status}</span>
              <span>
                Players: {g.players.length}/{g.maxPlayers}
              </span>
              <span>Cards/player: {g.cardsPerPlayer}</span>
              <span>Target score: {g.targetScore}</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => onJoin(g.id)} disabled={g.status !== 'WAITING'}>
                Join
              </button>
            </div>
            {g.players.length > 0 && <div style={{ opacity: 0.8, marginTop: 8 }}>Players: {g.players.join(', ')}</div>}
          </div>
        ))}
        {lobby.games.length === 0 && <p style={{ opacity: 0.7 }}>No games yet.</p>}
      </div>
    </div>
  )
}
