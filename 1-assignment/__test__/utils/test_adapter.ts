import { Card, Deck } from "../../src/model/deck";
import { Round } from "../../src/model/round";
import {
  Randomizer,
  Shuffler,
  standardRandomizer,
  standardShuffler,
} from "../../src/utils/random_utils";

// type Deck = any
type Game = any;

//Fill out the empty functions
export function createInitialDeck(): Deck {
  return new Deck();
}

export function createDeckFromMemento(
  cards: Record<string, string | number>[]
): Deck {
  return new Deck(cards as any);
}

export type HandConfig = {
  players: string[];
  dealer: number;
  shuffler?: Shuffler<Card>;
  cardsPerPlayer?: number;
};

export function createRound({
  players,
  dealer,
  shuffler = standardShuffler,
  cardsPerPlayer = 7,
}: HandConfig): Round {
  return new Round(players, dealer, shuffler, cardsPerPlayer);
}

export function createRoundFromMemento(
  memento: any,
  shuffler: Shuffler<Card> = standardShuffler
): Round {
  const round = new Round(memento.players, 0, shuffler, 7);
  const newRound = round.createRoundFromMemento(memento);
  return newRound;
}

export type GameConfig = {
  players: string[];
  targetScore: number;
  randomizer: Randomizer;
  shuffler: Shuffler<Card>;
  cardsPerPlayer: number;
};

export function createGame(props: Partial<GameConfig>): Game {}

export function createGameFromMemento(
  memento: any,
  randomizer: Randomizer = standardRandomizer,
  shuffler: Shuffler<Card> = standardShuffler
): Game {}
