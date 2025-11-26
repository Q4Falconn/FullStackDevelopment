import { Shuffler } from "../utils/random_utils";
import { Card, Deck, NumberedCard } from "./deck";

const MIN_AMOUNT_OF_PLAYERS = 2;
const MAX_AMOUNT_OF_PLAYERS = 10;

export class Round {
  private deck: Deck = new Deck();
  private discardPileDeck: Card[] = [];
  private players: string[] = [];
  private playerHands: Card[][] = [];
  private privateDealer: number;

  private currentPlayerIndex: number = 0;
  private direction: 1 | -1 = 1;

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

    const n = this.players.length;
    let startIndex = (this.privateDealer + 1) % n;
    let direction: 1 | -1 = 1;

    switch (topCard.type) {
      case "SKIP":
        startIndex = (startIndex + 1) % n;
        break;

      case "REVERSE":
        if (n === 2) {
          startIndex = (startIndex + 1) % n;
        } else {
          direction = -1;
          startIndex = (this.privateDealer - 1 + n) % n;
        }
        break;

      case "DRAW":
        const firstNewCard = this.deck.deal();
        const secondNewCard = this.deck.deal();
        if (firstNewCard) {
          this.playerHands[startIndex].push(firstNewCard);
        }
        if (secondNewCard) {
          this.playerHands[startIndex].push(secondNewCard);
        }
        startIndex = (startIndex + 1) % n;
        break;
    }

    this.currentPlayerIndex = startIndex;
    this.direction = direction;
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

  playerInTurn(): number {
    return this.currentPlayerIndex;
  }

  play(cardIndex : number): void {
    const isLegalMove = this.isLegalMove(cardIndex)
    if (!isLegalMove) {
      throw new Error("Illegal move")
    }
  
  }

  private isLegalMove(cardIndex : number): boolean {
    const currentCard = this.playerHands[this.currentPlayerIndex][cardIndex]
    if (currentCard.type === "WILD" || currentCard.type === "WILD DRAW") {
      return true
    }
    const discardPileAsDeckType = new Deck(this.discardPileDeck)
    const topCard = discardPileAsDeckType.top()
    if (currentCard.color !== (topCard as NumberedCard).color) {
      return false
    }
    if (currentCard.type === "NUMBERED" && topCard!.type === "NUMBERED" && currentCard.number === topCard?.number) {
      return true
    }

    return false
  }
}
