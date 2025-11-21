import { Shuffler } from "../utils/random_utils";
import { Card, Deck } from "./deck";

const MIN_AMOUNT_OF_PLAYERS = 2;
const MAX_AMOUNT_OF_PLAYERS = 10;

export class Round {
  private deck: Deck = new Deck();
  private discardPileDeck: Card[] = [];
  private players: string[] = [];
  private playerHands: Card[][] = [];
  private privateDealer: number = 1;

  constructor(
    players: string[],
    dealer: number,
    shuffler: Shuffler<Card>,
    cardsPerPlayer: number
  ) {
    if (
      players.length < MIN_AMOUNT_OF_PLAYERS ||
      players.length > MAX_AMOUNT_OF_PLAYERS
    ) {
      throw new Error(
        `A round requires at least ${MIN_AMOUNT_OF_PLAYERS} players and at most ${MAX_AMOUNT_OF_PLAYERS} players.`
      );
    }

    this.players = players;
    this.privateDealer = dealer;

    // Shuffle the deck
    this.deck.shuffle(shuffler);

    players.forEach((player, index) => {
      this.playerHands.push([]);
      for (let i = 0; i < cardsPerPlayer; i++) {
        const card = this.deck.deal();

        if (card === undefined) {
          throw new Error("Not enough cards in the deck to deal");
        }

        this.playerHands[index].push(card);
      }
    });

    let topCard = this.deck.deal();
    if (topCard === undefined) {
      throw new Error("Not enough cards in the deck to start the round");
    }

    while (topCard.type === "WILD" || topCard.type === "WILD DRAW") {
      this.discardPileDeck.push(topCard);
      this.deck.shuffle(shuffler);
      topCard = this.deck.deal()!;
    }

    this.discardPileDeck.push(topCard);
  }

  player(index: number): string {
    if (index < 0 || index >= this.players.length) {
      throw new Error("Player index out of bounds");
    }

    return this.players[index];
  }

  get playerCount(): number {
    return this.players.length;
  }

  get dealer(): number {
    return this.privateDealer;
  }

  playerHand(playerIndex: number): Readonly<Card>[] {
    return this.playerHands[playerIndex];
  }

  discardPile(): Deck {
    return new Deck(this.discardPileDeck);
  }

  drawPile(): Deck {
    return this.deck;
  }
}
