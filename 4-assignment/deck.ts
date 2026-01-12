export const colors = ["BLUE", "GREEN", "RED", "YELLOW"] as const;
export const actionTypes = [
  "SKIP",
  "REVERSE",
  "DRAW",
  "NUMBERED",
  "WILD",
  "WILD DRAW",
] as const;

export type Color = (typeof colors)[number];

export interface NumberedCard {
  type: "NUMBERED";
  color: Color;
  number: number;
}

export interface SkipCard {
  type: "SKIP";
  color: Color;
}

export interface ReverseCard {
  type: "REVERSE";
  color: Color;
}

export interface DrawCard {
  type: "DRAW";
  color: Color;
}

export interface WildCard {
  type: "WILD";
}

export interface WildDrawCard {
  type: "WILD DRAW";
}

export type Card =
  | NumberedCard
  | SkipCard
  | ReverseCard
  | DrawCard
  | WildCard
  | WildDrawCard;

export type CardMemento = Record<string, string | number>;
export type Shuffler<T> = (items: T[]) => void;

export type Deck = Readonly<{
  cards: ReadonlyArray<Card>;
}>;

/** Build the standard UNO deck (108 cards). */
export function standardDeck(): Deck {
  const built: Card[] = [];

  for (const color of colors) {
    built.push({ type: "NUMBERED", color, number: 0 });
    for (let n = 1; n <= 9; n++) {
      built.push({ type: "NUMBERED", color, number: n });
      built.push({ type: "NUMBERED", color, number: n });
    }
  }

  for (const color of colors) {
    for (const t of actionTypes) {
      if (t === "NUMBERED" || t === "WILD" || t === "WILD DRAW") continue;
      built.push({ type: t, color } as SkipCard | ReverseCard | DrawCard);
      built.push({ type: t, color } as SkipCard | ReverseCard | DrawCard);
    }
  }

  for (let i = 0; i < 4; i++) built.push({ type: "WILD" });
  for (let i = 0; i < 4; i++) built.push({ type: "WILD DRAW" });

  return { cards: built };
}

export function deckFromCards(cards: ReadonlyArray<Card>): Deck {
  if (!validateCards(cards)) throw new Error("Invalid cards in deck memento");
  return { cards: [...cards] };
}

export function deckSize(deck: Deck): number {
  return deck.cards.length;
}

export function top(deck: Deck): Card | undefined {
  return deck.cards[0];
}

export function peek(deck: Deck): Card | undefined {
  return top(deck);
}

export function deal(deck: Deck): { card?: Card; deck: Deck } {
  if (deck.cards.length === 0) return { card: undefined, deck };
  return { card: deck.cards[0], deck: { cards: deck.cards.slice(1) } };
}

export function filterDeck(deck: Deck, pred: (card: Card) => boolean): Deck {
  return { cards: deck.cards.filter(pred) };
}

/** Pure shuffle: shuffler may mutate the provided array, but we never mutate input deck. */
export function shuffle(deck: Deck, shuffler: Shuffler<Card>): Deck {
  const copy = [...deck.cards];
  shuffler(copy);
  return { cards: copy };
}

export function toMemento(deck: Deck): CardMemento[] {
  return deck.cards.map((card) => {
    const m: CardMemento = { type: card.type };
    if ("color" in card && card.color) m.color = card.color;
    if ("number" in card && (card as any).number !== undefined) {
      m.number = (card as any).number;
    }
    return m;
  });
}

export function hasColor(card: Card, color: Color): boolean {
  return "color" in card && (card as any).color === color;
}

export function hasNumber(card: Card, number: number): boolean {
  return "number" in card && (card as any).number === number;
}

export function validateCards(cards: any): cards is Card[] {
  if (!Array.isArray(cards)) return false;
  const hasInvalidType = !cards.every((card: any) =>
    actionTypes.includes(card?.type)
  );
  if (hasInvalidType) return false;

  for (const card of cards) {
    if (card.type === "NUMBERED") {
      if (card.color === undefined || card.number === undefined) return false;
    } else if (["SKIP", "REVERSE", "DRAW"].includes(card.type)) {
      if (card.color === undefined) return false;
    }
  }
  return true;
}
