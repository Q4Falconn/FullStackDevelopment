<template>
  <section>
    <h1>Game Over</h1>

    <p v-if="!gameStore.hasWinner">
      No winner yet. Go back to <RouterLink to="/play">Play</RouterLink>.
    </p>

    <div v-else>
      <h2>
        Winner:
        <strong>{{ winnerName }}</strong>
      </h2>

      <h3>Final scores</h3>
      <ul>
        <li v-for="(player, index) in gameStore.players" :key="player">
          {{ player }} — {{ gameStore.scores[index] }} points
          <span v-if="index === gameStore.winnerIndex"> 🏆</span>
        </li>
      </ul>

      <p style="margin-top: 1.5rem">
        <RouterLink to="/summary">View match summary</RouterLink>
        &nbsp;|&nbsp;
        <RouterLink to="/">Back to setup</RouterLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGameStore } from "@/stores/gameStore";

const gameStore = useGameStore();

const winnerName = computed(() => {
  if (gameStore.winnerIndex === undefined) return "";
  return gameStore.players[gameStore.winnerIndex] ?? "";
});
</script>
