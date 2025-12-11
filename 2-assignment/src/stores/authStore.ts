import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface User {
  username: string;
}

const USER_KEY = "uno_user";
const USERS_KEY = "uno_users"; // simple local “db”

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => !!user.value);

  function loadFromStorage() {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      user.value = JSON.parse(raw);
    }
  }

  function saveUser(u: User | null) {
    if (typeof localStorage === "undefined") return;
    user.value = u;
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }

  function register(username: string, password: string) {
    const name = username.trim();
    if (!name || !password) {
      throw new Error("Username and password required");
    }

    const raw = localStorage.getItem(USERS_KEY);
    const users: Record<string, string> = raw ? JSON.parse(raw) : {};

    if (users[name]) {
      throw new Error("User already exists");
    }

    users[name] = password;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    saveUser({ username: name });
  }

  function login(username: string, password: string) {
    const name = username.trim();
    if (!name || !password) {
      throw new Error("Username and password required");
    }

    const raw = localStorage.getItem(USERS_KEY);
    const users: Record<string, string> = raw ? JSON.parse(raw) : {};

    if (!users[name] || users[name] !== password) {
      throw new Error("Invalid username or password");
    }

    saveUser({ username: name });
  }

  function logout() {
    saveUser(null);
  }

  loadFromStorage();

  return {
    user,
    isAuthenticated,
    register,
    login,
    logout,
  };
});
