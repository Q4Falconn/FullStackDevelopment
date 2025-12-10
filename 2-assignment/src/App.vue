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

      <h1>{{ game.playerCount }}</h1>
      <Pile
        :deckType="{ type: 'DISCARD' }"
        :card="(game.currentRound()!.discardPile().top())"
      />

      <Pile
        :deckType="{ type: 'DRAW' }"
        :card="(game.currentRound()!.drawPile().top() as CardType)"
      />

      <h2>Player in turn {{ game.currentRound()!.playerInTurn() }}</h2>

      <p v-if="game.currentRound()!.playerInTurn() == currentPlayer">
        Your turn!
      </p>
      <div
        v-for="(card, index) in currentPlayerHand"
        :key="index"
        style="display: inline-block; margin-right: 10px"
      >
        <Card :card="(card as CardType)"></Card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import Card from "@/components/Card.vue";
import { computed, reactive, ref } from "vue";
import type { Card as CardType } from "./model/deck";
import Pile from "./components/Pile.vue";
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

const game = reactive(Game.createFromMemento(unoMemento));

const currentPlayer = ref(0);
const currentPlayerHand = computed(() => {
  const currentRound = game.currentRound();
  if (!currentRound) {
    return [];
  }

  return currentRound.playerHand(currentPlayer.value);
});
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
