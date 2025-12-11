<template>
  <section>
    <h1>Match Summary</h1>

    <p v-if="gameStore.players.length === 0">
      No match data. Start a game from the
      <RouterLink to="/">Setup</RouterLink> page.
    </p>

    <div v-else>
      <h2>Scores</h2>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Score</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(player, index) in gameStore.players" :key="player">
            <td>{{ player }}</td>
            <td>{{ gameStore.scores[index] }}</td>
            <td>
              <span v-if="index === gameStore.winnerIndex">Winner 🏆</span>
              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>

      <p style="margin-top: 1.5rem">
        <RouterLink to="/game-over">Back to Game Over</RouterLink>
        &nbsp;|&nbsp;
        <RouterLink to="/">Back to Setup</RouterLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useGameStore } from "@/stores/gameStore";

const gameStore = useGameStore();
</script>

<style scoped>
table {
  border-collapse: collapse;
  margin-top: 1rem;
}

th,
td {
  padding: 0.4rem 0.8rem;
  border: 1px solid #ddd;
}
</style>
