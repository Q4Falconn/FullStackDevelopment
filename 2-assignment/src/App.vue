<template>
  <div id="app">
    <header class="header">
      <h2>UNO Assignment</h2>
      <nav class="top-nav">
        <RouterLink to="/">Setup</RouterLink>
        <RouterLink to="/play">Play</RouterLink>
        <RouterLink to="/game-over">Game Over</RouterLink>
        <RouterLink to="/summary">Summary</RouterLink>
      </nav>
    </header>

    <main class="main">
      <RouterView />
      <button @click="play">Play first player</button>
      <h1>Amount of players {{ game.playerCount }}</h1>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Game } from "./model/game";

const currentRoundMemento = {
  players: ["A", "B", "C"],
  hands: [
    [{ type: "WILD" }, { type: "DRAW", color: "GREEN" }],
    [{ type: "NUMBERED", color: "RED", number: 7 }],
    [{ type: "SKIP", color: "RED" }],
  ],
  drawPile: [{ type: "WILD DRAW" }],
  discardPile: [
    { type: "NUMBERED", color: "BLUE", number: 7 },
    { type: "SKIP", color: "BLUE" },
  ],
  currentColor: "BLUE",
  currentDirection: "clockwise",
  dealer: 2,
  playerInTurn: 1,
};

const unoMemento = {
  players: ["A", "B", "C"],
  currentRound: currentRoundMemento,
  targetScore: 500,
  scores: [220, 430, 80],
  cardsPerPlayer: 7,
};

const game = ref(Game.createFromMemento(unoMemento));

console.log("Game memento:", game.value.toMemento());

function play() {
  const playedCard = game.value.currentRound().play(0);
  console.log("Played Card:", playedCard);
}
</script>

<style scoped>
#app {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  border-bottom: 1px solid #ddd;
}

.top-nav {
  display: flex;
  gap: 1rem;
}

.top-nav a.router-link-exact-active {
  font-weight: bold;
  text-decoration: underline;
}

.main {
  padding: 2rem;
}
</style>
