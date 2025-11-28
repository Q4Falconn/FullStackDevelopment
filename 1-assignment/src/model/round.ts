import { Shuffler, standardShuffler } from "../utils/random_utils";
import { Card, colors, Deck, NumberedCard } from "./deck";

const MIN_AMOUNT_OF_PLAYERS = 2;
const MAX_AMOUNT_OF_PLAYERS = 10;

export class Round {
  private deck: Deck = new Deck();
  private discardPileDeck: Card[] = [];
  private players: string[] = [];
  private hands: Card[][] = [];
  private privateDealer: number;
  private currentColor: (typeof colors)[number] = "RED";

  private currentPlayerIndex: number = 0;
  private currentDirection: "clockwise" | "counterclockwise" = "clockwise";

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
      this.hands.push([]);
      for (let i = 0; i < cardsPerPlayer; i++) {
        const card = this.deck.deal();

        if (card === undefined) {
          throw new Error("Not enough cards in the deck to deal");
        }

        this.hands[index].push(card);
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

    this.currentPlayerIndex = this.privateDealer;
    this.currentColor = topCard.color;
    this.setCurrentPlayerIndex(topCard);
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
    return this.hands[playerIndex];
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

  play(cardIndex: number, nextColor?: (typeof colors)[number]): Card {
    const canPlay = this.canPlay(cardIndex, nextColor);

    // const currentCard = this.hands[this.currentPlayerIndex][cardIndex];
    const discardPileAsDeckType = new Deck(this.discardPileDeck);
    let topCard = discardPileAsDeckType.top()!;

    if (!canPlay) {
      throw new Error("Illegal move");
    }

    const playedCard = this.hands[this.currentPlayerIndex].splice(
      cardIndex,
      1
    )[0];
    this.discardPileDeck.push(playedCard);

    if (
      !nextColor &&
      playedCard.type !== "WILD" &&
      playedCard.type !== "WILD DRAW" &&
      topCard.type !== "WILD" &&
      topCard.type !== "WILD DRAW" &&
      topCard.color !== playedCard.color
    ) {
      this.currentColor = playedCard.color;
    }

    topCard = playedCard;

    if (nextColor) {
      this.currentColor = nextColor;
    }

    this.setCurrentPlayerIndex(topCard);

    return playedCard;
  }

  canPlay(currentCardIndex: number, nextColor?: string): boolean {
    const currentCard = this.hands[this.currentPlayerIndex][currentCardIndex];
    const discardPileAsDeckType = new Deck(this.discardPileDeck);
    const topCard = discardPileAsDeckType.top();

    if (!topCard) {
      throw new Error("Discard pile is empty");
    }

    if (
      currentCard.type !== "WILD" &&
      currentCard.type !== "WILD DRAW" &&
      nextColor
    ) {
      throw new Error("Illegal to name a color on a colored card");
    }

    if (
      (currentCard.type === "WILD" || currentCard.type === "WILD DRAW") &&
      !nextColor
    ) {
      throw new Error("Can't play Wild or Wild Draw without new Color");
    }

    if (
      currentCard.type === "WILD" ||
      currentCard.type === "WILD DRAW" ||
      topCard.type === "WILD" ||
      topCard.type === "WILD DRAW"
    ) {
      return true;
    }

    if (currentCard.color === this.currentColor) {
      return true;
    }

    if (
      currentCard.type === "NUMBERED" &&
      topCard!.type === "NUMBERED" &&
      currentCard.number === topCard.number
    ) {
      return true;
    }

    return false;
  }

  canPlayAny(): boolean {
    for (
      let card = 0;
      card < this.hands[this.currentPlayerIndex].length;
      card++
    ) {
      const cardModel = this.hands[this.currentPlayerIndex][card];
      let color: (typeof colors)[number] | undefined = undefined;
      if (cardModel.type === "WILD" || cardModel.type === "WILD DRAW") {
        color = "BLUE";
      }
      const canPlay = this.canPlay(card, color);

      if (canPlay) {
        return true;
      }
    }
    return false;
  }

  draw(): number {
    let card = this.deck.deal();
    const currentHand = this.hands[this.currentPlayerIndex];

    if (!card) {
      console.log(this.discardPileDeck)
      this.deck = new Deck(this.discardPileDeck.slice(0, -1))
      // this.discardPileDeck = this.discardPileDeck.slice(-1)
      card = this.deck.deal()!
    }

    let color: (typeof colors)[number] | undefined = undefined;
    if (card.type === "WILD" || card.type === "WILD DRAW") {
      color = "BLUE";
    }

    currentHand.push(card);

    if (!this.canPlay(currentHand.length - 1, color)) {
      const n = this.players.length;
      this.currentPlayerIndex =
        this.currentDirection === "clockwise"
          ? (this.currentPlayerIndex + 1) % n
          : (this.currentPlayerIndex - 1 + n) % n;
    }
    return currentHand.length;
  }

  createRoundFromMemento(memento: any): Round {
    const round = new Round(
      memento.players,
      memento.dealer,
      standardShuffler,
      7
    );

    if (memento.hands.filter((hand: any) => hand.length === 0).length > 1) {
      throw new Error("There are two or more winners in the memento");
    }

    if (memento.hands.length !== memento.players.length) {
      throw new Error("Memento hands length does not match number of players");
    }

    if (memento.discardPile.length === 0) {
      throw new Error("Memento discard pile is empty");
    }

    if (
      memento.currentColor === undefined ||
      !colors.includes(memento.currentColor)
    ) {
      throw new Error("Memento is missing currentColor");
    }

    if (memento.dealer < 0 || memento.dealer >= memento.players.length) {
      throw new Error("Memento has invalid dealer index");
    }

    round.hands = memento.hands;
    round.deck = new Deck(memento.drawPile);
    round.discardPileDeck = memento.discardPile;
    const topCard = round.discardPile().top() as Card;
    if (
      topCard.type !== "WILD" &&
      topCard.type !== "WILD DRAW" &&
      topCard.color !== memento.currentColor
    ) {
      throw new Error("Memento currentColor does not match top card color");
    }

    round.currentColor = memento.currentColor;
    round.currentDirection = memento.currentDirection;
    if (memento.playerInTurn === undefined && !round.isGameOver()) {
      throw new Error("Memento is missing playerInTurn");
    }

    if (
      memento.playerInTurn < 0 ||
      memento.playerInTurn >= memento.players.length
    ) {
      throw new Error("Memento has invalid playerInTurn index");
    }

    round.currentPlayerIndex = memento.playerInTurn;

    return round;
  }

  toMemento(): any {
    return {
      players: this.players,
      hands: this.hands,
      drawPile: this.deck.toMemento(),
      discardPile: this.discardPileDeck,
      currentColor: this.currentColor,
      currentDirection: this.currentDirection,
      dealer: this.privateDealer,
      playerInTurn: this.currentPlayerIndex,
    };
  }

  private setCurrentPlayerIndex(topCard: Card): void {
    const n = this.players.length;
    let startIndex = this.currentPlayerIndex;

    switch (topCard.type) {
      case "SKIP":
        startIndex = (startIndex + 2) % n;
        break;

      case "REVERSE":
        if (n === 2) {
          startIndex = (startIndex + 1) % n;
        } else {
          this.currentDirection =
            this.currentDirection === "counterclockwise"
              ? "clockwise"
              : "counterclockwise";
          const sign = this.currentDirection === "counterclockwise" ? -1 : 1;
          startIndex = (startIndex + sign * 1 + n) % n;
        }
        break;

      case "DRAW":
        const firstNewCard = this.deck.deal();
        const secondNewCard = this.deck.deal();
        if (firstNewCard) {
          this.hands[(startIndex + 1) % n].push(firstNewCard);
        }
        if (secondNewCard) {
          this.hands[(startIndex + 1) % n].push(secondNewCard);
        }
        startIndex = (startIndex + 2) % n;
        break;
      case "WILD DRAW":
        const playerReceiver = (startIndex + 1) % n;
        for (let card = 0; card < 4; card++) {
          const newCard = this.deck.deal();
          if (!newCard) {
            throw new Error("No cards left");
          }
          this.hands[playerReceiver].push(newCard);
        }
        startIndex = (startIndex + 2) % n;
        break;
      default: {
        startIndex =
          this.currentDirection === "clockwise"
            ? (startIndex + 1) % n
            : (startIndex - 1 + n) % n;
        break;
      }
    }

    this.currentPlayerIndex = startIndex;
  }

  private isGameOver(): boolean {
    return this.hands.some((hand) => hand.length === 0);
  }
}
