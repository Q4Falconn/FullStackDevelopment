import { createRouter, createWebHistory } from "vue-router";

import GameSetupView from "@/views/GameSetupView.vue";
import GamePlayView from "@/views/GamePlayView.vue";
import GameOverView from "@/views/GameOverView.vue";
import MatchSummaryView from "@/views/MatchSummaryView.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";

import { pinia } from "@/stores";
import { useAuthStore } from "@/stores/authStore";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", name: "login", component: LoginView },
    { path: "/register", name: "register", component: RegisterView },
    {
      path: "/",
      name: "setup",
      component: GameSetupView,
      meta: { requiresAuth: true },
    },
    {
      path: "/play",
      name: "play",
      component: GamePlayView,
      meta: { requiresAuth: true },
    },
    {
      path: "/game-over",
      name: "game-over",
      component: GameOverView,
      meta: { requiresAuth: true },
    },
    {
      path: "/summary",
      name: "summary",
      component: MatchSummaryView,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore(pinia);

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: "login", query: { redirect: to.fullPath } });
  } else if (
    (to.name === "login" || to.name === "register") &&
    auth.isAuthenticated
  ) {
    next({ name: "setup" });
  } else {
    next();
  }
});

export default router;
