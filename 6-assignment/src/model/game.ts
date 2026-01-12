import {
  type Randomizer,
  type Shuffler,
  standardRandomizer,
  standardShuffler,
} from "../utils/random_utils";
import { type Card, type Color } from "./deck";
import {
  type RoundState,
  createRound,
  fromMemento as roundFromMemento,
  toMemento as roundToMemento,
  hasEnded as roundEnded,
  winner as roundWinner,
  score as roundScore,
} from "./round";

export type GameConfig = {
  players?: string[];
  targetScore?: number;
  cardsPerPlayer: number;
  randomizer?: Randomizer;
  shuffler?: Shuffler<Card>;
};

export type GameMemento = {
  players: string[];
  currentRound: any | undefined;
  targetScore: number;
  scores: number[];
  cardsPerPlayer: number;
};

export type GameState = Readonly<{
  players: ReadonlyArray<string>;
  currentRound?: RoundState;
  targetScore: number;
  scores: ReadonlyArray<number>;
  cardsPerPlayer: number;
}>;

export type GameRuntime = Readonly<{
  randomizer: Randomizer;
  shuffler: Shuffler<Card>;
}>;

/** Create a new game state (pure). */
export function createGame(gameConfig: GameConfig): { state: GameState; runtime: GameRuntime } {
  const cfg: Required<GameConfig> = {
    players: gameConfig.players ?? ["A", "B"],
    targetScore: gameConfig.targetScore ?? 500,
    cardsPerPlayer: gameConfig.cardsPerPlayer,
    randomizer: gameConfig.randomizer ?? standardRandomizer,
    shuffler: gameConfig.shuffler ?? standardShuffler,
  };

  if (cfg.players.length < 2) throw new Error("A game must have at least two players.");
  if (cfg.targetScore <= 0) throw new Error("Target score must be positive.");

  const scores = new Array(cfg.players.length).fill(0);
  const dealerIndex = cfg.randomizer(cfg.players.length);

  const round = createRound({
    players: [...cfg.players],
    dealer: dealerIndex,
    shuffler: cfg.shuffler,
    cardsPerPlayer: cfg.cardsPerPlayer,
  });

  return {
    state: {
      players: [...cfg.players],
      currentRound: round,
      targetScore: cfg.targetScore,
      scores,
      cardsPerPlayer: cfg.cardsPerPlayer,
    },
    runtime: { randomizer: cfg.randomizer, shuffler: cfg.shuffler },
  };
}

export function winner(state: GameState): number | undefined {
  for (let i = 0; i < state.scores.length; i++) {
    if (state.scores[i] >= state.targetScore) return i;
  }
  return undefined;
}

/** Advance the game when a round ends: award score and start next round if needed. */
export function onRoundFinished(
  state: GameState,
  runtime: GameRuntime,
  args: { winner: number }
): GameState {
  const w = args.winner;
  const roundPoints = state.currentRound ? roundScore(state.currentRound) ?? 0 : 0;

  const newScores = state.scores.map((s, i) => (i === w ? s + roundPoints : s));
  const newStateBase: GameState = { ...state, scores: newScores };

  if (newScores[w] >= state.targetScore) {
    return { ...newStateBase, currentRound: undefined };
  }

  const dealerIndex = runtime.randomizer(state.players.length);
  const nextRound = createRound({
    players: [...state.players],
    dealer: dealerIndex,
    shuffler: runtime.shuffler,
    cardsPerPlayer: state.cardsPerPlayer,
  });

  return { ...newStateBase, currentRound: nextRound };
}

export function toMemento(state: GameState): GameMemento {
  return {
    players: [...state.players],
    currentRound: state.currentRound ? roundToMemento(state.currentRound) : undefined,
    targetScore: state.targetScore,
    scores: [...state.scores],
    cardsPerPlayer: state.cardsPerPlayer,
  };
}

export function fromMemento(memento: GameMemento, runtime?: Partial<GameRuntime>): { state: GameState; runtime: GameRuntime } {
  if (memento.players.length < 2) throw new Error("A game must have at least two players.");
  if (memento.targetScore <= 0) throw new Error("Target score must be positive.");
  if (memento.scores.some((s) => s < 0)) throw new Error("Scores must be non-negative.");
  if (memento.scores.length !== memento.players.length) {
    throw new Error("Scores length must match players length.");
  }
  if (memento.scores.filter((s) => s > memento.targetScore).length > 1) {
    throw new Error("There can be at most one winner.");
  }

  const rt: GameRuntime = {
    randomizer: runtime?.randomizer ?? standardRandomizer,
    shuffler: runtime?.shuffler ?? standardShuffler,
  };

  const gameWinner = (() => {
    for (let i = 0; i < memento.scores.length; i++) if (memento.scores[i] >= memento.targetScore) return i;
    return undefined;
  })();

  if (gameWinner === undefined && memento.currentRound === undefined) {
    throw new Error("An unfinished game must have a current round in the memento.");
  }

  const round = gameWinner === undefined ? roundFromMemento(memento.currentRound, rt.shuffler) : undefined;

  return {
    state: {
      players: [...memento.players],
      scores: [...memento.scores],
      targetScore: memento.targetScore,
      cardsPerPlayer: memento.cardsPerPlayer,
      currentRound: round,
    },
    runtime: rt,
  };
}

/* -------------------------------------------------------------------------- */
/* Optional OO wrapper (keeps old API shape while delegating to pure functions) */
/* -------------------------------------------------------------------------- */

export class Game {
  private _state: GameState;
  private _runtime: GameRuntime;

  constructor(gameConfig?: GameConfig) {
    if (!gameConfig) {
      // empty game
      this._state = { players: [], scores: [], targetScore: 0, cardsPerPlayer: 0, currentRound: undefined };
      this._runtime = { randomizer: standardRandomizer, shuffler: standardShuffler };
      return;
    }
    const created = createGame(gameConfig);
    this._state = created.state;
    this._runtime = created.runtime;
  }

  static createFromMemento(memento: GameMemento): Game {
    const g = new Game();
    const loaded = fromMemento(memento);
    g._state = loaded.state;
    g._runtime = loaded.runtime;
    return g;
  }

  player(index: number): string {
    if (index < 0 || index >= this._state.players.length) throw new Error("Player index out of bounds.");
    return this._state.players[index]!;
  }

  currentRound(): RoundState | undefined {
    return this._state.currentRound;
  }

  winner(): number | undefined {
    return winner(this._state);
  }

  score(playerIndex: number): number {
    return this._state.scores[playerIndex] ?? 0;
  }

  get targetScore(): number {
    return this._state.targetScore;
  }

  get playerCount(): number {
    return this._state.players.length;
  }

  toMemento(): GameMemento {
    return toMemento(this._state);
  }

  /** Manually trigger finishing a round (for test harnesses). */
  finishRound(winnerIndex: number): void {
    this._state = onRoundFinished(this._state, this._runtime, { winner: winnerIndex });
  }
}

export const createFromMemento = (memento: GameMemento): Game => Game.createFromMemento(memento);
