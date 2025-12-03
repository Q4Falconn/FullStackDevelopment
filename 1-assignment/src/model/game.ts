import { fromMemento, Round } from "./round";

export class GameMemento {
  players: string[] = [];
  currentRound: any = undefined;
  targetScore: number = 0;
  scores: number[] = [];
  cardsPerPlayer: number = 0;
}

export class Game {
  private players: string[] = [];
  private currentRoundModel: Round | undefined;
  private targetScorePrivate: number = 0;
  private scores: number[] = [];
  private cardsPerPlayer: number = 0;

  static createFromMemento(memento: any): Game {
    if (memento.players.length < 2) {
      throw new Error("A game must have at least two players.");
    }

    if (memento.targetScore <= 0) {
      throw new Error("Target score must be positive.");
    }

    if (memento.scores.filter((s: any) => s < 0).length > 0) {
      throw new Error("Scores must be non-negative.");
    }

    if (memento.scores.length != memento.players.length) {
      throw new Error("Scores length must match players length.");
    }

    if (memento.scores.filter((s: any) => s > memento.targetScore).length > 1) {
      throw new Error("There can be at most one winner.");
    }

    const game = new Game();
    game.players = memento.players;
    game.scores = [...memento.scores];
    game.targetScorePrivate = memento.targetScore;
    game.cardsPerPlayer = memento.cardsPerPlayer;

    const winner = game.winner();
    if (winner === undefined && memento.currentRound === undefined) {
      throw new Error(
        "An unfinished game must have a current round in the memento."
      );
    }

    if (winner === undefined) {
      game.currentRoundModel = fromMemento(
        memento.currentRound,
        undefined as any
      );

      game.currentRoundModel.onEnd(game.onRoundFinished);
    }

    return game;
  }

  player(index: number): string {
    return this.players[index];
  }

  currentRound(): Round | undefined {
    return this.currentRoundModel;
  }

  winner(): number | undefined {
    for (let i = 0; i < this.scores.length; i++) {
      if (this.scores[i] >= this.targetScore) {
        return i;
      }
    }

    return undefined;
  }

  score(playerIndex: number): number {
    return this.scores[playerIndex];
  }

  get targetScore(): number {
    return this.targetScorePrivate;
  }

  get playerCount(): number {
    return this.players.length;
  }

  toMemento(): any {
    return {
      players: this.players,
      currentRound: this.currentRoundModel?.toMemento(),
      targetScore: this.targetScorePrivate,
      scores: this.scores,
      cardsPerPlayer: this.cardsPerPlayer,
    };
  }

  private onRoundFinished = ({ winner }: { winner: number }) => {
    this.scores[winner] += this.currentRoundModel?.score() || 0;
    if (this.scores[winner] >= this.targetScore) {
      this.currentRoundModel = undefined;
    } else {
      // this.currentRoundModel = new Round(this.players, this.);
    }
  };
}

export const createFromMemento = (memento: any): Game =>
  Game.createFromMemento(memento);
