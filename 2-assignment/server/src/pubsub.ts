import { EventEmitter } from "node:events";

export const pubsub = new EventEmitter();

export const GAME_UPDATED = "GAME_UPDATED";
