import { createRouter, createWebHistory } from "vue-router";

import GameSetupView from "@/views/GameSetupView.vue";
import GamePlayView from "@/views/GamePlayView.vue";
import GameOverView from "@/views/GameOverView.vue";
import MatchSummaryView from "@/views/MatchSummaryView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "setup", component: GameSetupView },
    { path: "/play", name: "play", component: GamePlayView },
    { path: "/game-over", name: "game-over", component: GameOverView },
    { path: "/summary", name: "summary", component: MatchSummaryView },
  ],
});

export default router;
