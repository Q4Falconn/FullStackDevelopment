<template>
  <section class="play-root">
    <h1>Play</h1>

    <p v-if="!gameStore.currentLobbyGame">
      No game selected. Go to <RouterLink to="/">Setup</RouterLink>.
    </p>

    <!-- Waiting room -->
    <div v-else-if="gameStore.isWaitingRoom" class="waiting-room card">
      <h2>Waiting room</h2>

      <p>
        Host: <strong>{{ gameStore.currentLobbyGame!.host }}</strong>
      </p>

      <h3>Players</h3>
      <ul class="waiting-list">
        <li v-for="p in gameStore.currentLobbyGame!.players" :key="p">
          {{ p }}
        </li>
      </ul>

      <p class="waiting-count">
        {{ gameStore.currentLobbyGame!.players.length }} /
        {{ gameStore.currentLobbyGame!.maxPlayers }} players joined
      </p>

      <button v-if="isHost" @click="gameStore.startGame()">Start game</button>
      <p v-else>Waiting for the host to start…</p>
    </div>

    <!-- Game room -->
    <div v-else-if="gameStore.game" class="table-layout">
      <!-- Players strip -->
      <div class="players-strip card">
        <h2>Players</h2>
        <div class="players-list">
          <div
            v-for="p in playerViews"
            :key="p.name"
            class="player-chip"
            :class="{
              'player-chip--me': p.isMe,
              'player-chip--turn': p.isTurn,
            }"
          >
            <div class="avatar">{{ p.initials }}</div>
            <div class="player-meta">
              <span class="player-name">{{ p.name }}</span>
              <span class="player-tag" v-if="p.isMe">You</span>
              <span class="player-tag player-tag--turn" v-if="p.isTurn">
                Turn
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Center table: piles + status -->
      <div class="center-area card">
        <div class="piles-row">
          <div class="pile-block">
            <div class="pile-label">Draw pile</div>
            <Pile
              :deckType="{ type: 'DRAW' }"
              :card="gameStore.currentRound?.drawPile().top() as CardType"
            />
            <div class="pile-meta">
              Cards left:
              {{ gameStore.currentRound?.drawPile().size ?? "?" }}
            </div>
          </div>

          <div class="pile-block">
            <div class="pile-label">Discard pile</div>
            <Pile
              :deckType="{ type: 'DISCARD' }"
              :card="gameStore.currentRound?.discardPile().top()"
            />
            <div class="pile-meta">Top card</div>
          </div>
        </div>

        <div class="turn-info">
          <h3>
            Player in turn:
            <span class="turn-name">
              {{ currentTurnName ?? gameStore.playerInTurn }}
            </span>
          </h3>

          <p v-if="gameStore.isMyTurn" class="turn-message turn-message--mine">
            Your turn!
            <span v-if="!gameStore.canPlayAny">
              (no playable card, you may draw)
            </span>
          </p>
          <p v-else class="turn-message">
            Waiting for {{ currentTurnName ?? "other player" }}…
          </p>

          <button
            class="primary"
            @click="onDraw"
            :disabled="!gameStore.isMyTurn"
          >
            Draw
          </button>
        </div>

        <!-- Wild color picker -->
        <div v-if="pendingWildIndex !== null" class="panel color-picker">
          <p>Choose a color for your Wild card:</p>
          <div class="color-buttons">
            <button
              v-for="c in colors"
              :key="c"
              class="color-btn"
              :data-color="c"
              @click="chooseWildColor(c)"
            >
              {{ c }}
            </button>
          </div>
        </div>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </div>

      <!-- Your hand -->
      <div class="hand-area card">
        <h3>Your hand</h3>
        <div class="hand-row">
          <div
            v-for="(card, index) in myHand"
            :key="index"
            class="card-wrapper"
          >
            <Card
              :card="card as CardType"
              @click="onCardClick(index)"
              :class="{
                clickable: gameStore.isMyTurn && gameStore.canPlayCard(index),
                'card--disabled': !gameStore.isMyTurn,
              }"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "@/stores/gameStore";
import Card from "@/components/Card.vue";
import Pile from "@/components/Pile.vue";
import { colors, type Color, type Card as CardType } from "@/model/deck";

const gameStore = useGameStore();
const router = useRouter();

const isHost = computed(
  () =>
    !!gameStore.currentLobbyGame &&
    gameStore.currentLobbyGame.host === gameStore.currentPlayerName
);

const myHand = computed(() => gameStore.currentPlayerHand);

const errorMessage = ref("");
const pendingWildIndex = ref<number | null>(null);

// players view model
const playerViews = computed(() =>
  gameStore.players.map((name, index) => {
    const initials = name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("");

    return {
      name,
      initials: initials || name[0]?.toUpperCase() || "?",
      isMe: index === gameStore.currentPlayerIndex,
      isTurn: index === gameStore.playerInTurn,
    };
  })
);

const currentTurnName = computed(() => {
  if (gameStore.playerInTurn === undefined || gameStore.playerInTurn === null) {
    return null;
  }
  return gameStore.players[gameStore.playerInTurn] ?? null;
});

// Redirect to game-over when there is a winner
watch(
  () => gameStore.winnerIndex,
  (winner) => {
    if (winner !== undefined && winner !== null) {
      router.push("/game-over");
    }
  }
);

const onCardClick = (index: number) => {
  errorMessage.value = "";

  const card = myHand.value[index];
  if (!card) return;

  if (!gameStore.isMyTurn) {
    errorMessage.value = "Not your turn";
    return;
  }

  if (card.type === "WILD" || card.type === "WILD DRAW") {
    pendingWildIndex.value = index;
    return;
  }

  try {
    gameStore.playCardAt(index);
  } catch (e: any) {
    errorMessage.value = e?.message ?? "Cannot play this card";
  }
};

const chooseWildColor = (color: Color) => {
  if (pendingWildIndex.value === null) return;

  errorMessage.value = "";
  try {
    gameStore.playCardAt(pendingWildIndex.value, color);
    pendingWildIndex.value = null;
  } catch (e: any) {
    errorMessage.value = e?.message ?? "Cannot play this wild card";
  }
};

const onDraw = () => {
  errorMessage.value = "";
  try {
    gameStore.drawCard();
  } catch (e: any) {
    errorMessage.value = e?.message ?? "Cannot draw a card";
  }
};
</script>

<style scoped>
.play-root {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-layout {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 1rem;
}

.card {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 1rem;
  background: #fafafa;
}

.waiting-room {
  max-width: 480px;
}

.waiting-list {
  padding-left: 1.25rem;
}

.waiting-count {
  margin-top: 0.5rem;
}

/* Players strip */

.players-strip h2 {
  margin-top: 0;
}

.players-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.player-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  background: #f0f0f0;
  border: 1px solid transparent;
  min-width: 0;
}

.player-chip--me {
  border-color: #4c6fff;
  background: #eef2ff;
}

.player-chip--turn {
  box-shadow: 0 0 0 2px #f97316;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  background: #111827;
  color: white;
}

.player-meta {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.player-tag {
  font-size: 0.7rem;
  opacity: 0.8;
}

.player-tag--turn {
  color: #f97316;
}

/* Center area */

.center-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.piles-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
}

.pile-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.pile-label {
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.8;
}

.pile-meta {
  font-size: 0.8rem;
  opacity: 0.8;
}

.turn-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
}

.turn-name {
  font-weight: 600;
}

.turn-message {
  margin: 0.25rem 0 0.5rem;
  font-size: 0.9rem;
}

.turn-message--mine {
  color: #16a34a;
}

/* Wild picker */

.panel {
  margin-top: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-width: 360px;
  background: white;
}

.color-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.color-btn {
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  border: 1px solid #ddd;
  font-size: 0.8rem;
  cursor: pointer;
}

.color-btn[data-color="RED"] {
  border-color: #ef4444;
}
.color-btn[data-color="GREEN"] {
  border-color: #22c55e;
}
.color-btn[data-color="BLUE"] {
  border-color: #3b82f6;
}
.color-btn[data-color="YELLOW"] {
  border-color: #eab308;
}

/* Hand */

.hand-area h3 {
  margin-top: 0;
}

.hand-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.card-wrapper {
  display: inline-block;
}

.clickable {
  cursor: pointer;
}

.card--disabled {
  opacity: 0.8;
}

.error {
  color: #c00;
  margin-top: 0.5rem;
}

/* Buttons */

button {
  cursor: pointer;
}

button.primary {
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: none;
  background: #4f46e5;
  color: white;
  font-size: 0.9rem;
}

button.primary:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
