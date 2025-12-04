import { Card, Deck } from "../../src/model/deck";
import { fromMemento, Round } from "../../src/model/round";
import { createFromMemento, Game } from "../../src/model/game";
import {
  Randomizer,
  Shuffler,
  standardRandomizer,
  standardShuffler,
} from "../../src/utils/random_utils";

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
  const newRound = fromMemento(memento, shuffler);
  return newRound;
}

export type GameConfig = {
  players: string[];
  targetScore: number;
  randomizer: Randomizer;
  shuffler: Shuffler<Card>;
  cardsPerPlayer: number;
};

export function createGame(props: Partial<GameConfig>): Game {
  return new Game(props as GameConfig);
}

export function createGameFromMemento(
  memento: any,
  randomizer: Randomizer = standardRandomizer,
  shuffler: Shuffler<Card> = standardShuffler
): Game {
  return createFromMemento(memento);
}
