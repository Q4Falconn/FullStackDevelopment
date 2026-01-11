import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apolloClient } from "@/apollo/client";
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY } from "@/graphql/auth";

type LoginResult = {
  login: {
    token: string;
    user: {
      id: string;
      username: string;
    };
  };
};

type LoginVars = {
  username: string;
  password: string;
};

type MeResult = {
  me: { id: string; username: string } | null;
};

interface User {
  id: string;
  username: string;
}

const USER_KEY = "uno_user";
const TOKEN_KEY = "auth_token";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => !!user.value);

  function loadFromStorage() {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) user.value = JSON.parse(raw);
  }

  function saveUser(u: User | null) {
    user.value = u;
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }

  async function register(username: string, password: string) {
    const name = username.trim();
    if (!name || !password) throw new Error("Username and password required");

    await apolloClient.mutate({
      mutation: REGISTER_MUTATION,
      variables: { username: name, password },
      fetchPolicy: "no-cache",
    });

    // Option: auto-login after register
    await login(name, password);
  }

  async function login(username: string, password: string) {
    const name = username.trim();
    if (!name || !password) throw new Error("Username and password required");

    const res = await apolloClient.mutate<LoginResult, LoginVars>({
      mutation: LOGIN_MUTATION,
      variables: { username: name, password },
      fetchPolicy: "no-cache",
    });

    const payload = res.data?.login;
    if (!payload?.token || !payload?.user) {
      throw new Error("Invalid username or password");
    }

    localStorage.setItem(TOKEN_KEY, payload.token);
    saveUser(payload.user);
  }

  async function refreshMe() {
    // useful on app load if token exists
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      saveUser(null);
      return;
    }

    const res = await apolloClient.query<MeResult>({
      query: ME_QUERY,
      fetchPolicy: "no-cache",
    });

    saveUser(res.data?.me ?? null);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    saveUser(null);
    apolloClient.clearStore();
  }

  loadFromStorage();

  return {
    user,
    isAuthenticated,
    register,
    login,
    refreshMe,
    logout,
  };
});
