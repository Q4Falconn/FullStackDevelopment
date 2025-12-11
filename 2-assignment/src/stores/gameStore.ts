// src/stores/gameStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { Game, type GameConfig } from "@/model/game";
import type { Card, Color } from "@/model/deck";

type LobbyGameStatus = "waiting" | "in-progress" | "finished";

interface LobbyGame {
  id: string;
  host: string;
  players: string[];
  maxPlayers: number;
  targetScore: number;
  cardsPerPlayer: number;
  status: LobbyGameStatus;
}

export const useGameStore = defineStore("game", () => {
  // "Which logged-in user am I?" – set from Setup using auth username
  const currentPlayerName = ref<string | null>(null);

  // Lobby state
  const lobbyGames = ref<LobbyGame[]>([]);
  const currentGameId = ref<string | null>(null);

  // Active game
  const game = ref<Game | null>(null);
  const currentPlayerIndex = ref(0);

  // ----- Getters -----
  const currentLobbyGame = computed(
    () => lobbyGames.value.find((g) => g.id === currentGameId.value) ?? null
  );

  const isWaitingRoom = computed(() => !!currentLobbyGame.value && !game.value);

  const currentRound = computed(() => game.value?.currentRound());

  const playerCount = computed(() => game.value?.playerCount ?? 0);

  const playerInTurn = computed(() => currentRound.value?.playerInTurn());

  const currentPlayerHand = computed<Card[]>(() => {
    const round = currentRound.value;
    if (!round) return [];
    return round.playerHand(currentPlayerIndex.value) as Card[];
  });

  const isMyTurn = computed(() => {
    if (!game.value) return false;
    if (playerInTurn.value === undefined) return false;
    return playerInTurn.value === currentPlayerIndex.value;
  });

  const canPlayAny = computed(() => {
    const round = currentRound.value;
    if (!round) return false;
    return round.canPlayAny();
  });

  // winner / scores for game-over + summary
  const winnerIndex = computed(() => game.value?.winner());

  const players = computed(() => {
    if (!game.value) return [];
    const res: string[] = [];
    for (let i = 0; i < game.value.playerCount; i++) {
      res.push(game.value.player(i));
    }
    return res;
  });

  const scores = computed(() => {
    if (!game.value) return [];
    const res: number[] = [];
    for (let i = 0; i < game.value.playerCount; i++) {
      res.push(game.value.score(i));
    }
    return res;
  });

  const hasWinner = computed(() => winnerIndex.value !== undefined);

  // ----- Actions: lobby/auth-ish -----
  function setCurrentPlayerName(name: string) {
    currentPlayerName.value = name;
  }

  function createLobbyGame(opts: {
    maxPlayers: number;
    targetScore: number;
    cardsPerPlayer: number;
  }) {
    if (!currentPlayerName.value) {
      throw new Error("No current player name set");
    }

    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

    const lobbyGame: LobbyGame = {
      id,
      host: currentPlayerName.value,
      players: [currentPlayerName.value],
      maxPlayers: opts.maxPlayers,
      targetScore: opts.targetScore,
      cardsPerPlayer: opts.cardsPerPlayer,
      status: "waiting",
    };

    lobbyGames.value.push(lobbyGame);
    currentGameId.value = id;
    game.value = null;
    currentPlayerIndex.value = 0;
  }

  function joinLobbyGame(id: string) {
    if (!currentPlayerName.value) {
      throw new Error("No current player name set");
    }

    const g = lobbyGames.value.find((x) => x.id === id);
    if (!g) return;

    if (g.status !== "waiting") return;
    if (g.players.includes(currentPlayerName.value)) return;
    if (g.players.length >= g.maxPlayers) return;

    g.players.push(currentPlayerName.value);
    currentGameId.value = g.id;
    game.value = null;

    currentPlayerIndex.value = g.players.indexOf(currentPlayerName.value);
  }

  function startGame() {
    const g = currentLobbyGame.value;
    if (!g) return;
    if (g.status !== "waiting") return;
    if (!currentPlayerName.value || currentPlayerName.value !== g.host) return;

    const cfg: GameConfig = {
      players: [...g.players],
      cardsPerPlayer: g.cardsPerPlayer,
      targetScore: g.targetScore,
    };

    game.value = new Game(cfg);
    g.status = "in-progress";

    currentPlayerIndex.value = g.players.indexOf(currentPlayerName.value);
  }

  // ----- Actions: round / gameplay -----
  function canPlayCard(index: number): boolean {
    const round = currentRound.value;
    if (!round) return false;
    return round.canPlay(index);
  }

  function playCardAt(index: number, nextColor?: Color) {
    const round = currentRound.value;
    if (!round) throw new Error("No active round");

    if (!isMyTurn.value) {
      throw new Error("Not your turn");
    }

    // let Round.play itself throw if illegal
    round.play(index, nextColor);
  }

  function drawCard() {
    const round = currentRound.value;
    if (!round) throw new Error("No active round");

    if (!isMyTurn.value) {
      throw new Error("Not your turn");
    }

    round.draw();
  }

  return {
    // state
    currentPlayerName,
    lobbyGames,
    currentGameId,
    game,
    currentPlayerIndex,

    // getters
    currentLobbyGame,
    isWaitingRoom,
    currentRound,
    playerCount,
    playerInTurn,
    currentPlayerHand,
    isMyTurn,
    canPlayAny,
    winnerIndex,
    players,
    scores,
    hasWinner,

    // lobby-ish actions
    setCurrentPlayerName,
    createLobbyGame,
    joinLobbyGame,
    startGame,

    // gameplay actions
    canPlayCard,
    playCardAt,
    drawCard,
  };
});
