import type { GameMemento } from '@/model/game'

export type LobbyGameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED'

export type ApiUser = { id: string; username: string }

export type ApiGame = {
  id: string
  status: LobbyGameStatus
  amountOfPlayers: number
  players: ApiUser[]
  targetScore: number
  cardsPerPlayer: number
  createdBy: ApiUser
  createdAt?: string
  state?: GameMemento | null
}

export interface LobbyGame {
  id: string
  host: string
  players: string[]
  maxPlayers: number
  targetScore: number
  cardsPerPlayer: number
  status: LobbyGameStatus
}

export function mapApiGameToLobbyGame(g: ApiGame): LobbyGame {
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
