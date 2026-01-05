import { HydratedDocument, Schema, model, Types } from "mongoose";

export interface IGame {
  id: string;
  amountOfPlayers: number;
  players: Types.ObjectId[];
  scores: number[];
  targetScore: number;
  cardsPerPlayer: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const gameSchema = new Schema<IGame>({
  amountOfPlayers: { type: Number, required: true },
  players: [{ type: Schema.Types.ObjectId, ref: "User" }],
  scores: [{ type: Number, required: true }],
  targetScore: { type: Number, required: true },
  cardsPerPlayer: { type: Number, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Schema.Types.Date, required: true },
});

export type GameDocument = HydratedDocument<IGame>;

export const Game = model<IGame>("Game", gameSchema)