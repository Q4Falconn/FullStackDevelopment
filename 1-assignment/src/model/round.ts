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
  private shuffler: Shuffler<Card> = standardShuffler;
  private currentColor: (typeof colors)[number] = "RED";
  private unoCalledBy: number[] = [];
  private onEndCallbacks: Array<(e: { winner: number }) => void> = [];

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
      this.discardPileDeck.unshift(topCard);
      this.deck.shuffle(shuffler);
      topCard = this.deck.deal()!;
    }

    this.discardPileDeck.unshift(topCard);

    this.currentPlayerIndex = this.privateDealer;
    this.currentColor = topCard.color;
    this.setCurrentPlayerIndex(topCard);
    this.shuffler = shuffler;
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

  playerInTurn(): number | undefined {
    if (this.isGameOver()) {
      return undefined;
    }

    return this.currentPlayerIndex;
  }

  play(cardIndex: number, nextColor?: (typeof colors)[number]): Card {
    const canPlay = this.canPlay(cardIndex);
    this.colorCardValidator(cardIndex, nextColor);

    const hasUnoBeenCalled = this.unoCalledBy.includes(this.currentPlayerIndex);
    if (hasUnoBeenCalled) {
      this.unoCalledBy = this.unoCalledBy.filter(
        (player) => player === this.currentPlayerIndex
      );
    }

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
    this.discardPileDeck.unshift(playedCard);

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

    const isWinner = this.hands.some((hand) => hand.length === 0);
    if (isWinner) {
      this.onEndCallbacks.forEach((callback) =>
        callback({ winner: this.winner()! })
      );
    }

    return playedCard;
  }

  canPlay(currentCardIndex: number): boolean {
    if (this.isGameOver()) {
      return false;
    }

    if (
      currentCardIndex < 0 ||
      currentCardIndex >= this.hands[this.currentPlayerIndex].length
    ) {
      return false;
    }

    const currentCard = this.hands[this.currentPlayerIndex][currentCardIndex];
    const discardPileAsDeckType = new Deck(this.discardPileDeck);
    const topCard = discardPileAsDeckType.top();

    if (!topCard) {
      throw new Error("Discard pile is empty");
    }

    const hasColorCardWithCurrentColor = this.hands[
      this.currentPlayerIndex
    ].some(
      (card) =>
        card.type !== "WILD" &&
        card.type !== "WILD DRAW" &&
        card.color === this.currentColor
    );

    if (currentCard.type === "WILD DRAW" && hasColorCardWithCurrentColor) {
      return false;
    }

    if (currentCard.type === "WILD" || currentCard.type === "WILD DRAW") {
      return true;
    }

    if (currentCard.color === this.currentColor) {
      return true;
    }

    if (currentCard.type === topCard.type && currentCard.type !== "NUMBERED") {
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
      const canPlay = this.canPlay(card);

      if (canPlay) {
        return true;
      }
    }

    return false;
  }

  draw(): number {
    if (this.isGameOver()) {
      throw new Error("Round is over");
    }

    this.unoCalledBy = [];
    let card = this.deck.deal()!;
    const currentHand = this.hands[this.currentPlayerIndex];
    currentHand.push(card);

    if (!this.canPlay(currentHand.length - 1)) {
      const n = this.players.length;
      this.currentPlayerIndex =
        this.currentDirection === "clockwise"
          ? (this.currentPlayerIndex + 1) % n
          : (this.currentPlayerIndex - 1 + n) % n;
    }

    if (this.deck.size === 0) {
      this.refreshDeckFromDiscardPile();
    }

    return currentHand.length;
  }

  static createRoundFromMemento(memento: any, shuffler: Shuffler<Card>): Round {
    const round = Object.create(Round.prototype) as Round;

    round.onEndCallbacks = [];

    round.shuffler = shuffler;

    // clone arrays so we don't mutate memento across tests
    round.players = [...memento.players];
    round.privateDealer = memento.dealer;
    round.unoCalledBy = [];

    // shallow-copy each hand
    round.hands = memento.hands.map((hand: Card[]) => [...hand]);

    // clone piles
    round.deck = new Deck([...memento.drawPile]);
    round.discardPileDeck = [...memento.discardPile];

    round.currentColor = memento.currentColor;
    round.currentDirection = memento.currentDirection;
    round.currentPlayerIndex = memento.playerInTurn;
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

    const topCard = memento.discardPile[0] as Card;
    if (
      topCard.type !== "WILD" &&
      topCard.type !== "WILD DRAW" &&
      topCard.color !== memento.currentColor
    ) {
      throw new Error("Memento currentColor does not match top card color");
    }

    if (memento.playerInTurn === undefined && !round.isGameOver()) {
      throw new Error("Memento is missing playerInTurn");
    }

    if (
      memento.playerInTurn < 0 ||
      memento.playerInTurn >= memento.players.length
    ) {
      throw new Error("Memento has invalid playerInTurn index");
    }

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

  catchUnoFailure({
    accuser,
    accused,
  }: {
    accuser: number;
    accused: number;
  }): boolean {
    if (this.unoCalledBy.includes(accused)) {
      return false;
    }

    if (this.hands[accused].length !== 1) {
      return false;
    }

    if (this.currentPlayerIndex === accused) {
      return false;
    }

    const n = this.players.length;
    const nextPlayerIndex =
      this.currentDirection === "clockwise"
        ? (accused + 1) % n
        : (accused - 1 + n) % n;

    // if next player played out, no penalty
    const someonePlayedAfterAccused =
      this.currentPlayerIndex !== accused &&
      this.currentPlayerIndex !== nextPlayerIndex;

    if (someonePlayedAfterAccused) {
      return false;
    }

    // fails if the next player has drawn a card
    const isLastCardForDrawing =
      this.discardPile().top()?.type === "DRAW" ||
      this.discardPile().top()?.type === "WILD DRAW";

    if (isLastCardForDrawing) {
      return false;
    }

    // adds 4 cards to the hand of the accused player if successful
    const newCards: Card[] = [];
    for (let i = 0; i < 4; i++) {
      let card = this.deck.deal();
      if (!card) {
        this.refreshDeckFromDiscardPile();
        card = this.deck.deal()!;
      }

      newCards.push(card);
    }

    this.hands[accused].push(...newCards);

    return true;
  }

  sayUno(playerIndex: number): void {
    if (this.isGameOver()) {
      throw new Error("Round is over");
    }

    if (playerIndex < 0 || playerIndex >= this.players.length) {
      throw new Error("Player index out of bounds");
    }

    this.unoCalledBy.push(playerIndex);
  }

  hasEnded(): boolean {
    return this.isGameOver();
  }

  winner(): number | undefined {
    for (let i = 0; i < this.hands.length; i++) {
      if (this.hands[i].length === 0) {
        return i;
      }
    }

    return undefined;
  }

  score(): number | undefined {
    if (!this.isGameOver()) {
      return undefined;
    }

    let totalScore = 0;

    for (let i = 0; i < this.hands.length; i++) {
      if (this.hands[i].length === 0) {
        continue;
      }

      for (const card of this.hands[i]) {
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

  onEnd(callback: ({ winner }: { winner: number }) => void): void {
    this.onEndCallbacks.push(({ winner }: { winner: number }) => {
      callback({ winner });
    });
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
          startIndex = (startIndex + 2) % n;
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
        if (firstNewCard) {
          this.hands[(startIndex + 1) % n].push(firstNewCard);
        } else {
          this.refreshDeckFromDiscardPile();
          this.hands[(startIndex + 1) % n].push(this.deck.deal()!);
        }

        const secondNewCard = this.deck.deal();
        if (secondNewCard) {
          this.hands[(startIndex + 1) % n].push(secondNewCard);
        } else {
          this.refreshDeckFromDiscardPile();
          this.hands[(startIndex + 1) % n].push(this.deck.deal()!);
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

  private refreshDeckFromDiscardPile(): void {
    const [top, ...rest] = this.discardPileDeck;
    this.discardPileDeck = [top];
    this.deck = new Deck(rest);
  }

  private colorCardValidator(cardIndex: number, nextColor?: string): void {
    const card = this.hands[this.currentPlayerIndex][cardIndex];
    if (card.type !== "WILD" && card.type !== "WILD DRAW" && nextColor) {
      throw new Error("Illegal to name a color on a colored card");
    }

    if ((card.type === "WILD" || card.type === "WILD DRAW") && !nextColor) {
      throw new Error("Can't play Wild or Wild Draw without new Color");
    }
  }
}

export const fromMemento = (memento: any, shuffler: Shuffler<Card>): Round =>
  Round.createRoundFromMemento(memento, shuffler);
