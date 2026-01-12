import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { graphqlRequest } from '@/api/graphqlClient'
import { CREATE_GAME_MUTATION, GAMES_QUERY, JOIN_GAME_MUTATION } from '@/api/queries'
import type { ApiGame, LobbyGameStatus } from './types'

export type LobbyGame = {
  id: string
  host: string
  players: string[]
  maxPlayers: number
  targetScore: number
  cardsPerPlayer: number
  status: LobbyGameStatus
}

function mapApiGameToLobbyGame(g: ApiGame): LobbyGame {
  return {
    id: g.id,
    host: g.createdBy?.username ?? 'Unknown',
    players: (g.players ?? []).map((p) => p.username),
    maxPlayers: g.amountOfPlayers,
    targetScore: g.targetScore,
    cardsPerPlayer: g.cardsPerPlayer,
    status: g.status,
  }
}

export const fetchGames = createAsyncThunk('lobby/fetchGames', async () => {
  const data = await graphqlRequest<{ games: ApiGame[] }>(GAMES_QUERY)
  return (data.games ?? []).map(mapApiGameToLobbyGame)
})

export const createLobbyGame = createAsyncThunk(
  'lobby/create',
  async (args: { amountOfPlayers: number; targetScore: number; cardsPerPlayer: number }) => {
    const data = await graphqlRequest<{ createGame: { id: string } }, typeof args>(CREATE_GAME_MUTATION, args)
    if (!data.createGame?.id) throw new Error('Failed to create game')
    return data.createGame.id
  }
)

export const joinLobbyGame = createAsyncThunk('lobby/join', async (args: { gameId: string }) => {
  await graphqlRequest<{ joinGame: boolean }, { gameId: string }>(JOIN_GAME_MUTATION, { gameId: args.gameId })
  return args.gameId
})

type LobbyState = {
  games: LobbyGame[]
  currentGameId: string | null
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: LobbyState = {
  games: [],
  currentGameId: null,
  status: 'idle',
}

const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    setCurrentGameId: (s, a: { payload: string | null }) => {
      s.currentGameId = a.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGames.pending, (s) => {
        s.status = 'loading'
        s.error = undefined
      })
      .addCase(fetchGames.fulfilled, (s, a) => {
        s.status = 'idle'
        s.games = a.payload
      })
      .addCase(fetchGames.rejected, (s, a) => {
        s.status = 'error'
        s.error = a.error.message
      })
      .addCase(createLobbyGame.fulfilled, (s, a) => {
        s.currentGameId = a.payload
      })
      .addCase(joinLobbyGame.fulfilled, (s, a) => {
        s.currentGameId = a.payload
      })
  },
})

export const { setCurrentGameId } = lobbySlice.actions
export default lobbySlice.reducer
