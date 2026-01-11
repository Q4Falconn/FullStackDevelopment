<template>
  <section>
    <h1>Game Setup</h1>

    <form @submit.prevent="onCreateGame" class="panel">
      <h2>Create game</h2>

      <div class="field">
        <label>Max players</label>
        <input v-model.number="maxPlayers" type="number" min="2" />
      </div>

      <div class="field">
        <label>Cards per player</label>
        <input v-model.number="cardsPerPlayer" type="number" min="1" />
      </div>

      <div class="field">
        <label>Target score</label>
        <input v-model.number="targetScore" type="number" min="1" />
      </div>

      <button type="submit">Create &amp; go to lobby</button>
    </form>

    <!-- Join existing game -->
    <section class="panel">
      <h2>Join existing game</h2>

      <p v-if="gameStore.lobbyGames.length === 0">No open games yet.</p>

      <ul v-else>
        <li v-for="g in gameStore.lobbyGames" :key="g.id">
          <strong>{{ g.host }}'s game</strong>
          — {{ g.players.length }}/{{ g.maxPlayers }} players — status:
          {{ g.status }}
          <button :disabled="g.status !== 'WAITING'" @click="onJoin(g.id)">
            Join
          </button>
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { onMounted } from "vue";

const router = useRouter();
const gameStore = useGameStore();
const auth = useAuthStore();

const maxPlayers = ref(4);
const cardsPerPlayer = ref(7);
const targetScore = ref(500);

function ensureName(): boolean {
  const username = auth.user?.username?.trim();
  if (!username) {
    // Shouldn't happen because route is protected,
    // but guard anyway.
    router.push({ name: "login" });
    return false;
  }

  gameStore.setCurrentPlayerName(username);
  return true;
}

onMounted(() => {
  gameStore.fetchGames();
});

function onCreateGame() {
  if (!ensureName()) return;

  gameStore.createLobbyGame({
    maxPlayers: maxPlayers.value,
    cardsPerPlayer: cardsPerPlayer.value,
    targetScore: targetScore.value,
  });

  router.push("/play");
}

function onJoin(id: string) {
  if (!ensureName()) return;

  gameStore.joinLobbyGame(id);
  router.push("/play");
}
</script>

<style scoped>
.panel {
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-width: 420px;
}

.field {
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
}

.field input {
  padding: 0.25rem 0.5rem;
}
</style>
