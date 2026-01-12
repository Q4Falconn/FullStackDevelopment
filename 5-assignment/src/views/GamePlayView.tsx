import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loadGame,
  startGame,
  drawCard,
  playCard,
} from "@/features/game/gameSlice";
import type { Color, Card as UnoCard } from "@/model/deck";
import { fromMemento as gameFromMemento, type GameMemento } from "@/model/game";
import * as round from "@/model/round";
import Pile from "@/components/Pile";
import Card from "@/components/Card";

function promptColor(): Color | undefined {
  const v = window
    .prompt("Choose color: RED, GREEN, BLUE, YELLOW")
    ?.trim()
    .toUpperCase();
  if (!v) return undefined;
  if (v === "RED" || v === "GREEN" || v === "BLUE" || v === "YELLOW") return v;
  return undefined;
}

export default function GamePlayView() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  const gameId = useAppSelector((s) => s.lobby.currentGameId);
  const serverGame = useAppSelector((s) => s.game.serverGame);
  const me = useAppSelector((s) => s.auth.user?.username);

  useEffect(() => {
    if (gameId) dispatch(loadGame({ gameId }));
  }, [dispatch, gameId]);

  const derived = useMemo(() => {
    const m = serverGame?.state as unknown as GameMemento | undefined;
    if (!m) return null;
    try {
      const loaded = gameFromMemento(m);
      return loaded.state;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [serverGame?.state]);

  const roundState = derived?.currentRound;
  const players = derived?.players ?? [];
  const scores = derived?.scores ?? [];
  const winnerIndex = derived
    ? ((): number | undefined => {
        for (let i = 0; i < derived.scores.length; i++)
          if (derived.scores[i]! >= derived.targetScore) return i;
        return undefined;
      })()
    : undefined;

  useEffect(() => {
    if (winnerIndex !== undefined) nav("/game-over");
  }, [winnerIndex, nav]);

  if (!gameId) {
    return (
      <div>
        <p>No game selected. Go back to Setup.</p>
        <button onClick={() => nav("/")}>Go to Setup</button>
      </div>
    );
  }

  if (!serverGame) return <p>Loading game…</p>;

  if (serverGame.status === "WAITING") {
    return (
      <div>
        <h2>Waiting room</h2>
        <p>
          Game: <b>{gameId}</b>
        </p>
        <p>
          Players: {serverGame.players.map((p) => p.username).join(", ")} (
          {serverGame.players.length}/{serverGame.amountOfPlayers})
        </p>
        <button
          onClick={() => dispatch(startGame({ gameId }))}
          disabled={serverGame.players.length < 2}
        >
          Start game
        </button>
      </div>
    );
  }

  if (!roundState) return <p>Game started, waiting for state…</p>;

  const myIndex = me ? players.indexOf(me) : 0;
  const myHand = round.playerHand(roundState, myIndex) as UnoCard[];
  const topCard = roundState.discardPile[0];
  const playerInTurn = roundState.playerInTurn;
  const isMyTurn = playerInTurn === myIndex;

  async function onPlayCard(i: number, c: UnoCard) {
    if (!isMyTurn) return;
    if (!round.canPlay(roundState, i)) return;

    let nextColor: Color | undefined;
    if (c.type === "WILD" || c.type === "WILD DRAW") {
      nextColor = promptColor();
      if (!nextColor) return;
    }

    await dispatch(playCard({ gameId, cardIndex: i, nextColor })).unwrap();
  }

  return (
    <div>
      <h2>Play</h2>
      <p style={{ opacity: 0.8 }}>
        Game: <b>{gameId}</b> · Current color: <b>{roundState.currentColor}</b>
      </p>
      <p>
        Turn: <b>{players[playerInTurn ?? 0] ?? "—"}</b>{" "}
        {isMyTurn ? "(you)" : ""}
      </p>

      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Draw pile</div>
          <div
            onClick={() => (isMyTurn ? dispatch(drawCard({ gameId })) : null)}
            style={{ cursor: isMyTurn ? "pointer" : "not-allowed" }}
          >
            <Pile type="DRAW" />
          </div>
          <div style={{ opacity: 0.7, marginTop: 6 }}>
            {isMyTurn ? "Click to draw" : "Wait your turn"}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Discard pile</div>
          <Pile type="DISCARD" card={topCard} />
        </div>
      </div>

      <h3 style={{ marginTop: 22 }}>Your hand ({myHand.length})</h3>
      {!isMyTurn && <p style={{ opacity: 0.7 }}>You can’t play right now.</p>}

      <div className="cardGrid">
        {myHand.map((c, idx) => {
          const playable = isMyTurn && round.canPlay(roundState, idx);
          return (
            <div
              key={idx}
              onClick={() => playable && onPlayCard(idx, c)}
              style={{
                cursor: playable ? "pointer" : "not-allowed",
                opacity: playable ? 1 : 0.45,
                transform: playable ? "translateY(-2px)" : undefined,
              }}
              title={playable ? "Play" : "Cannot play"}
            >
              <Card card={c} />
            </div>
          );
        })}
      </div>

      <h3 style={{ marginTop: 24 }}>Scores</h3>
      <ul>
        {players.map((p, i) => (
          <li key={p}>
            {p}: {scores[i] ?? 0}
          </li>
        ))}
      </ul>
    </div>
  );
}
