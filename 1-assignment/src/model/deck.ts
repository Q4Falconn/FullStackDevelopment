export const colors = ["BLUE", "GREEN", "RED", "YELLOW"] as const;
export const actionTypes = [
  "SKIP",
  "REVERSE",
  "DRAW",
  "NUMBERED",
  "WILD",
  "WILD DRAW",
] as const;

type Color = (typeof colors)[number];
type ActionType = (typeof actionTypes)[number];

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

export class Deck {
  private cards: Card[] = [];

  constructor(cards?: Card[]) {
    if (cards) {
      const areCardsValid = valdateCards(cards);

      if (!areCardsValid) {
        throw new Error("Invalid cards in deck memento");
      }

      this.cards = [...cards];
      return;
    }

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
        if (t === "NUMBERED" || t === "WILD" || t === "WILD DRAW") {
          continue;
        }

        built.push({ type: t, color });
        built.push({ type: t, color });
      }
    }

    for (let i = 0; i < 4; i++) {
      built.push({ type: "WILD" });
    }

    for (let i = 0; i < 4; i++) {
      built.push({ type: "WILD DRAW" });
    }

    this.cards = built;
  }

  get size(): number {
    return this.cards.length;
  }

  top(): Card | undefined {
    return this.cards[this.cards.length - 1];
  }

  deal(): Card | undefined {
    return this.cards.shift();
  }

  filter(pred: (card: Card) => boolean): Deck {
    const filtered = this.cards.filter(pred);
    const d = new Deck([]);
    (d as any).cards = filtered;
    return d;
  }

  shuffle(shuffler: (cards: Card[]) => void): void {
    shuffler(this.cards);
  }

  toMemento(): Record<string, string | number>[] {
    return this.cards.map((card) => {
      let memento: Record<string, string | number> = { type: card.type };
      if ("color" in card && card.color) {
        memento.color = card.color;
      }

      if ("number" in card && card.number !== undefined) {
        memento.number = card.number;
      }

      return memento;
    });
  }
}

export function hasColor(card: Card, color: Color): boolean {
  return "color" in card && card.color === color;
}

export function hasNumber(card: Card, number: number): boolean {
  return "number" in card && card.number === number;
}

function valdateCards(cards: any): boolean {
  const hasInvalidType = !cards.every((card: any) =>
    actionTypes.includes(card.type)
  );

  if (hasInvalidType) {
    return false;
  }

  for (const card of cards) {
    if (card.type === "NUMBERED") {
      if (card.color === undefined || card.number === undefined) {
        return false;
      }
    } else if (["SKIP", "REVERSE", "DRAW"].includes(card.type)) {
      if (card.color === undefined) {
        return false;
      }
    }
  }

  return true;
}
