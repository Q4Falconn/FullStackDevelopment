import _ from "lodash";
import {
  colors,
  type Color,
  type Card,
  type NumberedCard,
  type Deck,
  type Shuffler,
  standardDeck,
  deckFromCards,
  deckSize,
  top as deckTop,
  deal as deckDeal,
  shuffle as deckShuffle,
} from "./deck";

const MIN_AMOUNT_OF_PLAYERS = 2;
const MAX_AMOUNT_OF_PLAYERS = 10;

export type Direction = "clockwise" | "counterclockwise";

export type RoundState = Readonly<{
  players: ReadonlyArray<string>;
  dealer: number;

  drawPile: Deck;
  discardPile: ReadonlyArray<Card>;

  hands: ReadonlyArray<ReadonlyArray<Card>>;

  currentColor: Color;
  currentDirection: Direction;

  /** undefined when ended */
  playerInTurn?: number;

  /** players that have called UNO since their last play */
  unoCalledBy: ReadonlyArray<number>;
}>;

export type RoundMemento = {
  players: string[];
  hands: Card[][];
  drawPile: any[];
  discardPile: Card[];
  currentColor: Color;
  currentDirection: Direction;
  dealer: number;
  playerInTurn: number;
};

/** Helper: next player index according to direction. */
export function advancePlayerIndex(
  state: RoundState,
  fromIndex: number,
  steps: number = 1
): number {
  const n = state.players.length;
  const dir = state.currentDirection === "clockwise" ? 1 : -1;
  return (fromIndex + dir * steps + n * 1000) % n;
}

export function hasEnded(state: RoundState): boolean {
  return state.hands.some((h) => h.length === 0);
}

export function winner(state: RoundState): number | undefined {
  const idx = state.hands.findIndex((h) => h.length === 0);
  return idx === -1 ? undefined : idx;
}

/** Standard score rules as in the original model. */
export function score(state: RoundState): number | undefined {
  if (!hasEnded(state)) return undefined;

  let totalScore = 0;
  for (let i = 0; i < state.hands.length; i++) {
    if (state.hands[i].length === 0) continue;

    for (const card of state.hands[i]) {
      switch (card.type) {
        case "NUMBERED":
          totalScore += (card as NumberedCard).number;
          break;
        case "SKIP":
        case "REVERSE":
        case "DRAW":
          totalScore += 20;
          break;
        case "WILD":
        case "WILD DRAW":
          totalScore += 50;
          break;
      }
    }
  }
  return totalScore;
}

function ensurePlayers(players: string[]): void {
  if (
    players.length < MIN_AMOUNT_OF_PLAYERS ||
    players.length > MAX_AMOUNT_OF_PLAYERS
  ) {
    throw new Error(
      `A round requires at least ${MIN_AMOUNT_OF_PLAYERS} players and at most ${MAX_AMOUNT_OF_PLAYERS} players.`
    );
  }
}

function refreshDeckFromDiscardPile(
  state: RoundState,
  shuffler: Shuffler<Card>
): RoundState {
  const [topCard, ...rest] = state.discardPile;
  const newDraw = deckShuffle(deckFromCards(rest), shuffler);
  return {
    ...state,
    discardPile: [topCard!],
    drawPile: newDraw,
  };
}

function safeDeal(
  state: RoundState,
  shuffler: Shuffler<Card>
): { card?: Card; state: RoundState } {
  let { card, deck } = deckDeal(state.drawPile);
  if (card) return { card, state: { ...state, drawPile: deck } };

  // Refill from discard
  const refreshed = refreshDeckFromDiscardPile(state, shuffler);
  ({ card, deck } = deckDeal(refreshed.drawPile));
  return { card, state: { ...refreshed, drawPile: deck } };
}

function requireColorChoice(card: Card, nextColor?: Color) {
  if ((card.type === "WILD" || card.type === "WILD DRAW") && !nextColor) {
    throw new Error("Can't play Wild or Wild Draw without new Color");
  }
  if (card.type !== "WILD" && card.type !== "WILD DRAW" && nextColor) {
    throw new Error("Illegal to name a color on a colored card");
  }
}

export function player(state: RoundState, index: number): string {
  if (index < 0 || index >= state.players.length)
    throw new Error("Player index out of bounds");
  return state.players[index]!;
}

export function playerHand(
  state: RoundState,
  playerIndex: number
): ReadonlyArray<Card> {
  return state.hands[playerIndex] ?? [];
}

export function discardPile(state: RoundState): Deck {
  return deckFromCards(state.discardPile);
}

export function drawPile(state: RoundState): Deck {
  return state.drawPile;
}

export function canPlay(state: RoundState, cardIndex: number): boolean {
  if (hasEnded(state)) return false;
  const p = state.playerInTurn;
  if (p === undefined) return false;

  const hand = state.hands[p] ?? [];
  if (cardIndex < 0 || cardIndex >= hand.length) return false;

  const currentCard = hand[cardIndex]!;
  const topCard = state.discardPile[0];
  if (!topCard) throw new Error("Discard pile is empty");

  const hasColorCardWithCurrentColor = hand.some(
    (c) =>
      c.type !== "WILD" &&
      c.type !== "WILD DRAW" &&
      "color" in c &&
      (c as any).color === state.currentColor
  );

  // Standard house-rule used in the provided model: cannot play Wild Draw if you can follow color
  if (currentCard.type === "WILD DRAW" && hasColorCardWithCurrentColor)
    return false;

  if (currentCard.type === "WILD" || currentCard.type === "WILD DRAW")
    return true;

  if (
    "color" in currentCard &&
    (currentCard as any).color === state.currentColor
  )
    return true;

  if (currentCard.type === topCard.type && currentCard.type !== "NUMBERED")
    return true;

  if (
    currentCard.type === "NUMBERED" &&
    topCard.type === "NUMBERED" &&
    (currentCard as NumberedCard).number === (topCard as NumberedCard).number
  ) {
    return true;
  }

  return false;
}

export function canPlayAny(state: RoundState): boolean {
  const p = state.playerInTurn;
  if (p === undefined) return false;
  const hand = state.hands[p] ?? [];
  for (let i = 0; i < hand.length; i++) {
    if (canPlay(state, i)) return true;
  }
  return false;
}

/**
 * Apply the top-card effect and compute the next player in turn.
 * This mirrors the original imperative model (including the 2-player REVERSE special case).
 */
function applyTopCardEffect(
  state: RoundState,
  topCard: Card,
  shuffler: Shuffler<Card>
): RoundState {
  const n = state.players.length;
  const current = state.playerInTurn!;
  let nextState = { ...state };

  switch (topCard.type) {
    case "SKIP": {
      const next = advancePlayerIndex(nextState, current, 2);
      return { ...nextState, playerInTurn: next };
    }

    case "REVERSE": {
      if (n === 2) {
        const next = advancePlayerIndex(nextState, current, 2);
        return { ...nextState, playerInTurn: next };
      }

      const newDir: Direction =
        nextState.currentDirection === "counterclockwise"
          ? "clockwise"
          : "counterclockwise";
      const after = { ...nextState, currentDirection: newDir };
      const next = advancePlayerIndex(after, current, 1);
      return { ...after, playerInTurn: next };
    }

    case "DRAW": {
      // next player draws 2, then is skipped
      const receiver = advancePlayerIndex(nextState, current, 1);

      let s = nextState;
      const newHands = s.hands.map((h) => [...h]) as Card[][];
      for (let i = 0; i < 2; i++) {
        const dealt = safeDeal({ ...s, hands: newHands }, shuffler);
        s = dealt.state;
        if (!dealt.card) throw new Error("No cards left");
        newHands[receiver]!.push(dealt.card);
      }
      const skipped = advancePlayerIndex(s, current, 2);
      return { ...s, hands: newHands, playerInTurn: skipped };
    }

    case "WILD DRAW": {
      const receiver = advancePlayerIndex(nextState, current, 1);

      let s = nextState;
      const newHands = s.hands.map((h) => [...h]) as Card[][];
      for (let i = 0; i < 4; i++) {
        const dealt = safeDeal({ ...s, hands: newHands }, shuffler);
        s = dealt.state;
        if (!dealt.card) throw new Error("No cards left");
        newHands[receiver]!.push(dealt.card);
      }
      const skipped = advancePlayerIndex(s, current, 2);
      return { ...s, hands: newHands, playerInTurn: skipped };
    }

    default: {
      const next = advancePlayerIndex(nextState, current, 1);
      return { ...nextState, playerInTurn: next };
    }
  }
}

export function createRound(args: {
  players: string[];
  dealer: number;
  shuffler: Shuffler<Card>;
  cardsPerPlayer: number;
}): RoundState {
  const { players, dealer, shuffler, cardsPerPlayer } = args;
  ensurePlayers(players);

  let drawPile = deckShuffle(standardDeck(), shuffler);

  // deal hands
  const hands: Card[][] = players.map(() => []);
  for (let p = 0; p < players.length; p++) {
    for (let i = 0; i < cardsPerPlayer; i++) {
      const dealt = deckDeal(drawPile);
      if (!dealt.card) throw new Error("Not enough cards in the deck to deal");
      hands[p]!.push(dealt.card);
      drawPile = dealt.deck;
    }
  }

  // pick first discard: must not be wild / wild draw (same as provided model)
  let first = deckDeal(drawPile);
  if (!first.card)
    throw new Error("Not enough cards in the deck to start the round");
  drawPile = first.deck;

  const discard: Card[] = [];
  while (first.card.type === "WILD" || first.card.type === "WILD DRAW") {
    discard.unshift(first.card);
    drawPile = deckShuffle(drawPile, shuffler);
    first = deckDeal(drawPile);
    if (!first.card)
      throw new Error("Not enough cards in the deck to start the round");
    drawPile = first.deck;
  }
  discard.unshift(first.card);

  let state: RoundState = {
    players: [...players],
    dealer,
    drawPile,
    discardPile: discard,
    hands,
    currentColor: ("color" in first.card
      ? (first.card as any).color
      : "RED") as Color,
    currentDirection: "clockwise",
    playerInTurn: dealer,
    unoCalledBy: [],
  };

  // apply starting card effect (skip/reverse/draw) by treating dealer as "current" before effect,
  // matching the original Round constructor behaviour.
  state = applyTopCardEffect(state, first.card, shuffler);
  return state;
}

export function toMemento(state: RoundState): any {
  return {
    players: [...state.players],
    hands: state.hands.map((h) => [...h]),
    drawPile: state.drawPile.cards.map((c) => ({ ...c })),
    discardPile: [...state.discardPile],
    currentColor: state.currentColor,
    currentDirection: state.currentDirection,
    dealer: state.dealer,
    playerInTurn: state.playerInTurn,
  };
}

export function fromMemento(
  memento: any,
  shuffler: Shuffler<Card>
): RoundState {
  const players: string[] = [...memento.players];
  ensurePlayers(players);

  const hands = (memento.hands as Card[][]).map((h) => [...h]);
  const drawPileCards = memento.drawPile as Card[];
  const discardPileCards = memento.discardPile as Card[];

  if (hands.filter((h) => h.length === 0).length > 1) {
    throw new Error("There are two or more winners in the memento");
  }
  if (hands.length !== players.length) {
    throw new Error("Memento hands length does not match number of players");
  }
  if (!discardPileCards || discardPileCards.length === 0) {
    throw new Error("Memento discard pile is empty");
  }
  if (
    memento.currentColor === undefined ||
    !colors.includes(memento.currentColor)
  ) {
    throw new Error("Memento is missing currentColor");
  }
  if (memento.dealer < 0 || memento.dealer >= players.length) {
    throw new Error("Memento has invalid dealer index");
  }
  const topCard = discardPileCards[0] as Card;
  if (
    topCard.type !== "WILD" &&
    topCard.type !== "WILD DRAW" &&
    (topCard as any).color !== memento.currentColor
  ) {
    throw new Error("Memento currentColor does not match top card color");
  }

  const ended = hands.some((h) => h.length === 0);
  if (memento.playerInTurn === undefined && !ended) {
    throw new Error("Memento is missing playerInTurn");
  }
  if (memento.playerInTurn < 0 || memento.playerInTurn >= players.length) {
    throw new Error("Memento has invalid playerInTurn index");
  }

  return {
    players,
    dealer: memento.dealer,
    hands,
    drawPile: deckFromCards(drawPileCards),
    discardPile: discardPileCards,
    currentColor: memento.currentColor,
    currentDirection: memento.currentDirection,
    playerInTurn: ended ? undefined : memento.playerInTurn,
    unoCalledBy: [],
  };
}

export function sayUno(state: RoundState, playerIndex: number): RoundState {
  if (hasEnded(state)) throw new Error("Round is over");
  if (playerIndex < 0 || playerIndex >= state.players.length) {
    throw new Error("Player index out of bounds");
  }
  const set = new Set(state.unoCalledBy);
  set.add(playerIndex);
  return { ...state, unoCalledBy: Array.from(set) };
}

/**
 * Attempt to catch a UNO failure (accuse a player who has 1 card and didn't say UNO).
 * Returns updated state and whether the accusation succeeded.
 *
 * This mirrors the original model's timing constraints.
 */
export function catchUnoFailure(
  state: RoundState,
  shuffler: Shuffler<Card>,
  args: { accuser: number; accused: number }
): { state: RoundState; success: boolean } {
  const { accused } = args;

  if (state.unoCalledBy.includes(accused)) return { state, success: false };
  if ((state.hands[accused]?.length ?? 0) !== 1)
    return { state, success: false };
  if (state.playerInTurn === accused) return { state, success: false };

  const n = state.players.length;
  const nextPlayerIndex =
    state.currentDirection === "clockwise"
      ? (accused + 1) % n
      : (accused - 1 + n) % n;

  const someonePlayedAfterAccused =
    state.playerInTurn !== accused && state.playerInTurn !== nextPlayerIndex;

  if (someonePlayedAfterAccused) return { state, success: false };

  const topCard = state.discardPile[0];
  const isLastCardForDrawing =
    topCard?.type === "DRAW" || topCard?.type === "WILD DRAW";
  if (isLastCardForDrawing) return { state, success: false };

  // Apply penalty: accused draws 4
  let s = state;
  const newHands = s.hands.map((h) => [...h]) as Card[][];
  for (let i = 0; i < 4; i++) {
    const dealt = safeDeal({ ...s, hands: newHands }, shuffler);
    s = dealt.state;
    if (!dealt.card) throw new Error("No cards left");
    newHands[accused]!.push(dealt.card);
  }

  return { state: { ...s, hands: newHands }, success: true };
}

export function draw(
  state: RoundState,
  shuffler: Shuffler<Card>
): { state: RoundState; handSize: number } {
  if (hasEnded(state)) throw new Error("Round is over");
  const p = state.playerInTurn!;
  let s: RoundState = { ...state, unoCalledBy: [] };

  // deal 1
  const newHands = s.hands.map((h) => [...h]) as Card[][];
  const dealt = safeDeal({ ...s, hands: newHands }, shuffler);
  s = dealt.state;
  if (!dealt.card) throw new Error("No cards left");
  newHands[p]!.push(dealt.card);

  // if drawn card cannot be played, advance turn; else keep same player
  const tmpState: RoundState = { ...s, hands: newHands };
  const drawnIndex = newHands[p]!.length - 1;
  const canPlayDrawn = canPlay(tmpState, drawnIndex);
  const nextPlayer = canPlayDrawn ? p : advancePlayerIndex(tmpState, p, 1);

  return {
    state: { ...tmpState, playerInTurn: nextPlayer },
    handSize: newHands[p]!.length,
  };
}

export function play(
  state: RoundState,
  shuffler: Shuffler<Card>,
  cardIndex: number,
  nextColor?: Color
): { state: RoundState; playedCard: Card } {
  if (hasEnded(state)) throw new Error("Round is over");
  const p = state.playerInTurn!;
  const hand = state.hands[p] ?? [];
  if (cardIndex < 0 || cardIndex >= hand.length)
    throw new Error("Illegal move");

  const card = hand[cardIndex]!;
  requireColorChoice(card, nextColor);

  if (!canPlay(state, cardIndex)) throw new Error("Illegal move");

  // remove UNO called flag for current player when they act
  const unoCalledBy = state.unoCalledBy.filter((x) => x !== p);

  const newHands = state.hands.map((h) => [...h]) as Card[][];
  const playedCard = newHands[p]!.splice(cardIndex, 1)[0]!;
  const newDiscard = [playedCard, ...state.discardPile];

  let newColor: Color = state.currentColor;
  if (playedCard.type === "WILD" || playedCard.type === "WILD DRAW") {
    newColor = nextColor!;
  } else {
    newColor = (playedCard as any).color as Color;
  }

  let s: RoundState = {
    ...state,
    hands: newHands,
    discardPile: newDiscard,
    currentColor: newColor,
    unoCalledBy,
  };

  // If someone won, end the round: playerInTurn becomes undefined
  if (newHands.some((h) => h.length === 0)) {
    return { state: { ...s, playerInTurn: undefined }, playedCard };
  }

  // Apply effects to compute next player + draw penalties
  s = applyTopCardEffect(s, playedCard, shuffler);

  return { state: s, playedCard };
}
