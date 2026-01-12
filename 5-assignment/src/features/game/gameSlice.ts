import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { graphqlRequest } from "@/api/graphqlClient";
import {
  GAME_QUERY,
  GAME_UPDATED_SUB,
  START_GAME_MUTATION,
  DRAW_CARD_MUTATION,
  PLAY_CARD_MUTATION,
} from "@/api/queries";
import { subscribeGraphql } from "@/api/graphqlWs";
import type { ApiGame } from "./types";
import { fetchGames } from "./lobbySlice";
import { Subscription } from "rxjs";

let gameSub: Subscription | null = null;

type GameState = {
  currentPlayerName: string | null;
  serverGame: ApiGame | null;
  status: "idle" | "loading" | "error";
  error?: string;
};

export const loadGame = createAsyncThunk(
  "game/load",
  async (args: { gameId: string }) => {
    const data = await graphqlRequest<
      { game: ApiGame | null },
      { gameId: string }
    >(GAME_QUERY, { gameId: args.gameId });
    if (!data.game) throw new Error("Game not found");
    return data.game;
  }
);

export const subscribeToGame = createAsyncThunk(
  "game/subscribe",
  async (args: { gameId: string }, { dispatch }) => {
    gameSub?.unsubscribe();
    gameSub = subscribeGraphql<{ gameUpdated: ApiGame }, { gameId: string }>(
      GAME_UPDATED_SUB,
      { gameId: args.gameId }
    ).subscribe({
      next: (msg) => {
        if (msg?.gameUpdated) {
          dispatch(gameSlice.actions.setServerGame(msg.gameUpdated));
          dispatch(fetchGames());
        }
      },
      error: (err) => {
        console.error("gameUpdated subscription error", err);
      },
    });

    return true;
  }
);

export const unsubscribeFromGame = createAsyncThunk(
  "game/unsubscribe",
  async () => {
    gameSub?.unsubscribe();
    gameSub = null;
    return true;
  }
);

export const startGame = createAsyncThunk(
  "game/start",
  async (args: { gameId: string }, { dispatch }) => {
    await graphqlRequest<{ startGame: ApiGame }, { gameId: string }>(
      START_GAME_MUTATION,
      { gameId: args.gameId }
    );
    const data = await graphqlRequest<
      { game: ApiGame | null },
      { gameId: string }
    >(GAME_QUERY, { gameId: args.gameId });
    if (data.game) dispatch(gameSlice.actions.setServerGame(data.game));
    return true;
  }
);

export const drawCard = createAsyncThunk(
  "game/draw",
  async (args: { gameId: string }) => {
    await graphqlRequest<{ drawCard: ApiGame }, { gameId: string }>(
      DRAW_CARD_MUTATION,
      { gameId: args.gameId }
    );
    return true;
  }
);

export const playCard = createAsyncThunk(
  "game/play",
  async (args: {
    gameId: string;
    cardIndex: number;
    nextColor?: string | null;
  }) => {
    await graphqlRequest<
      { playCard: ApiGame },
      { gameId: string; cardIndex: number; nextColor?: string | null }
    >(PLAY_CARD_MUTATION, {
      gameId: args.gameId,
      cardIndex: args.cardIndex,
      nextColor: args.nextColor ?? null,
    });
    return true;
  }
);

const initialState: GameState = {
  currentPlayerName: null,
  serverGame: null,
  status: "idle",
};

export const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setCurrentPlayerName: (s, a: { payload: string | null }) => {
      s.currentPlayerName = a.payload;
    },
    setServerGame: (s, a: { payload: ApiGame | null }) => {
      s.serverGame = a.payload;
    },
    clearGame: (s) => {
      s.serverGame = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGame.pending, (s) => {
        s.status = "loading";
        s.error = undefined;
      })
      .addCase(loadGame.fulfilled, (s, a) => {
        s.status = "idle";
        s.serverGame = a.payload;
      })
      .addCase(loadGame.rejected, (s, a) => {
        s.status = "error";
        s.error = a.error.message;
      });
  },
});

export const { setCurrentPlayerName, setServerGame, clearGame } =
  gameSlice.actions;
export default gameSlice.reducer;
