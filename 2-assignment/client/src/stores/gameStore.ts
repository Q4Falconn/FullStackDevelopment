import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apolloClient } from "@/apollo/client";
import { Game, type GameMemento } from "@/model/game";
import type { Card, Color } from "@/model/deck";

import {
  GAMES_QUERY,
  CREATE_GAME_MUTATION,
  JOIN_GAME_MUTATION,
  START_GAME_MUTATION,
} from "@/graphql/games";

import {
  GAME_QUERY,
  GAME_UPDATED_SUB,
  DRAW_CARD,
  PLAY_CARD,
} from "@/graphql/gameState";

type LobbyGameStatus = "WAITING" | "IN_PROGRESS" | "FINISHED";

type ApiUser = { id: string; username: string };

type ApiGame = {
  id: string;
  status: LobbyGameStatus;
  amountOfPlayers: number;
  players: ApiUser[];
  targetScore: number;
  cardsPerPlayer: number;
  createdBy: ApiUser;
  createdAt: string;
  state?: unknown | null; // JSON scalar
};

interface LobbyGame {
  id: string;
  host: string;
  players: string[];
  maxPlayers: number;
  targetScore: number;
  cardsPerPlayer: number;
  status: LobbyGameStatus;
}

type GamesQueryResult = { games: ApiGame[] };
type CreateGameResult = { createGame: { id: string } };
type CreateGameVars = {
  amountOfPlayers: number;
  targetScore: number;
  cardsPerPlayer: number;
};

type GameQueryResult = { game: ApiGame | null };
type GameQueryVars = { gameId: string };

type StartGameResult = {
  startGame: { id: string; status: LobbyGameStatus; state?: unknown | null };
};
type StartGameVars = { gameId: string };

type DrawCardResult = {
  drawCard: { id: string; status: LobbyGameStatus; state?: unknown | null };
};
type DrawCardVars = { gameId: string };

type PlayCardResult = {
  playCard: { id: string; status: LobbyGameStatus; state?: unknown | null };
};
type PlayCardVars = { gameId: string; cardIndex: number; nextColor?: Color };

function mapApiGameToLobbyGame(g: ApiGame): LobbyGame {
  return {
    id: g.id,
    host: g.createdBy?.username ?? "Unknown",
    players: (g.players ?? []).map((p) => p.username),
    maxPlayers: g.amountOfPlayers,
    targetScore: g.targetScore,
    cardsPerPlayer: g.cardsPerPlayer,
    status: g.status,
  };
}

export const useGameStore = defineStore("game", () => {
  const currentPlayerName = ref<string | null>(null);
  const lobbyGames = ref<LobbyGame[]>([]);
  const currentGameId = ref<string | null>(null);

  const serverGame = ref<ApiGame | null>(null);

  let gameSub: any = null;

  const game = computed(() => {
    const state = serverGame.value?.state;
    if (!state) return null;
    return Game.createFromMemento(state as GameMemento);
  });

  const currentLobbyGame = computed(
    () => lobbyGames.value.find((g) => g.id === currentGameId.value) ?? null
  );

  const isWaitingRoom = computed(() => {
    const g = currentLobbyGame.value;
    if (!g) return false;
    return g.status === "WAITING";
  });

  const currentRound = computed(() => game.value?.currentRound());
  const playerCount = computed(() => game.value?.playerCount ?? 0);
  const playerInTurn = computed(() => currentRound.value?.playerInTurn());

  const myPlayerIndex = computed(() => {
    const me = currentPlayerName.value;
    const m = serverGame.value?.state as GameMemento | undefined;
    if (!me || !m) return 0;
    const idx = m.players.indexOf(me);
    return idx >= 0 ? idx : 0;
  });

  const currentPlayerHand = computed<Card[]>(() => {
    const round = currentRound.value;
    if (!round) return [];
    return round.playerHand(myPlayerIndex.value) as Card[];
  });

  const isMyTurn = computed(() => {
    if (!game.value) return false;
    if (playerInTurn.value === undefined) return false;
    return playerInTurn.value === myPlayerIndex.value;
  });

  const canPlayAny = computed(() => {
    const round = currentRound.value;
    if (!round) return false;
    return round.canPlayAny();
  });

  const winnerIndex = computed(() => game.value?.winner());
  const hasWinner = computed(() => winnerIndex.value !== undefined);

  const players = computed(() => {
    const m = serverGame.value?.state as GameMemento | undefined;
    return m?.players ?? [];
  });

  const scores = computed(() => {
    const m = serverGame.value?.state as GameMemento | undefined;
    return m?.scores ?? [];
  });

  function setCurrentPlayerName(name: string) {
    currentPlayerName.value = name;
  }

  async function fetchGames() {
    const res = await apolloClient.query<GamesQueryResult>({
      query: GAMES_QUERY,
      fetchPolicy: "no-cache",
    });

    lobbyGames.value = (res.data?.games ?? []).map(mapApiGameToLobbyGame);
  }

  async function createLobbyGame(opts: {
    maxPlayers: number;
    targetScore: number;
    cardsPerPlayer: number;
  }) {
    const res = await apolloClient.mutate<CreateGameResult, CreateGameVars>({
      mutation: CREATE_GAME_MUTATION,
      variables: {
        amountOfPlayers: opts.maxPlayers,
        targetScore: opts.targetScore,
        cardsPerPlayer: opts.cardsPerPlayer,
      },
      fetchPolicy: "no-cache",
    });

    const created = res.data?.createGame;
    if (!created?.id) throw new Error("Failed to create game");

    await fetchGames();
    currentGameId.value = created.id;
    await loadGame(created.id);
    subscribeToGame(created.id);
  }

  async function joinLobbyGame(id: string) {
    await apolloClient.mutate({
      mutation: JOIN_GAME_MUTATION,
      variables: { gameId: id },
      fetchPolicy: "no-cache",
    });

    await fetchGames();
    currentGameId.value = id;
    await loadGame(id);
    subscribeToGame(id);
  }

  async function loadGame(gameId: string) {
    const res = await apolloClient.query<GameQueryResult, GameQueryVars>({
      query: GAME_QUERY,
      variables: { gameId },
      fetchPolicy: "no-cache",
    });

    serverGame.value = res.data?.game ?? null;
  }

  function subscribeToGame(gameId: string) {
    gameSub?.unsubscribe();
    gameSub = apolloClient
      .subscribe<{ gameUpdated: ApiGame }, { gameId: string }>({
        query: GAME_UPDATED_SUB,
        variables: { gameId },
      })
      .subscribe({
        next: (result) => {
          const updated = result.data?.gameUpdated;
          if (!updated) return;
          serverGame.value = updated;
          fetchGames().catch(() => {});
        },
        error: (err) => console.error("gameUpdated subscription error", err),
      });
  }

  function unsubscribe() {
    gameSub?.unsubscribe();
    gameSub = null;
  }

  async function startGame() {
    const g = currentLobbyGame.value;
    if (!g) throw new Error("No current game");
    if (!currentPlayerName.value) throw new Error("No current player");

    const res = await apolloClient.mutate<StartGameResult, StartGameVars>({
      mutation: START_GAME_MUTATION,
      variables: { gameId: g.id },
      fetchPolicy: "no-cache",
    });

    const updated = res.data?.startGame;
    if (updated) {
      await loadGame(g.id);
    }
  }

  function canPlayCard(index: number): boolean {
    const round = currentRound.value;
    if (!round) return false;
    return round.canPlay(index);
  }

  async function playCardAt(index: number, nextColor?: Color) {
    const id = currentGameId.value;
    if (!id) throw new Error("No game selected");
    if (!isMyTurn.value) throw new Error("Not your turn");

    await apolloClient.mutate<PlayCardResult, PlayCardVars>({
      mutation: PLAY_CARD,
      variables: { gameId: id, cardIndex: index, nextColor },
      fetchPolicy: "no-cache",
    });
  }

  async function drawCard() {
    const id = currentGameId.value;
    if (!id) throw new Error("No game selected");
    if (!isMyTurn.value) throw new Error("Not your turn");

    await apolloClient.mutate<DrawCardResult, DrawCardVars>({
      mutation: DRAW_CARD,
      variables: { gameId: id },
      fetchPolicy: "no-cache",
    });
  }

  return {
    currentPlayerName,
    lobbyGames,
    currentGameId,
    serverGame,

    currentLobbyGame,
    isWaitingRoom,
    game,
    currentRound,
    playerCount,
    playerInTurn,
    myPlayerIndex,
    currentPlayerHand,
    isMyTurn,
    canPlayAny,
    winnerIndex,
    players,
    scores,
    hasWinner,

    setCurrentPlayerName,
    fetchGames,
    createLobbyGame,
    joinLobbyGame,
    loadGame,
    subscribeToGame,
    unsubscribe,
    startGame,
    canPlayCard,
    playCardAt,
    drawCard,
  };
});
