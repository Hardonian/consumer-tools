import { getRuntimeConfig } from "../config.ts";
import { MemoryStore } from "./memory-store.ts";
import type { AppStore } from "./store.ts";
import { SupabaseRestStore } from "./supabase-rest-store.ts";

let store: AppStore | null = null;

export function getStore() {
  if (!store) {
    store = getRuntimeConfig().supabaseConfigured
      ? new SupabaseRestStore()
      : new MemoryStore();
  }
  return store;
}

export function setStoreForTests(nextStore: AppStore | null) {
  store = nextStore;
}
