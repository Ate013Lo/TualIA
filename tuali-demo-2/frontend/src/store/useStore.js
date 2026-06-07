// src/store/useStore.js

import { create } from "zustand";
import * as api from "../lib/api";

const useStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────
  inventory:      [],
  goal:           null,
  cards:          [],
  loading:        false,
  error:          null,

  // ── Actions ─────────────────────────────────────────────
  fetchInventory: async () => {
    const inventory = await api.getInventory();
    set({ inventory });
  },

  fetchGoal: async () => {
    const goal = await api.getGoal();
    set({ goal });
  },

  fetchCards: async () => {
    const cards = await api.getCards();
    set({ cards });
  },

  fetchAll: async () => {
    set({ loading: true });
    try {
      const [inventory, goal, cards] = await Promise.all([
        api.getInventory(),
        api.getGoal(),
        api.getCards(),
      ]);
      set({ inventory, goal, cards, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  addInventoryItem: async (data) => {
    const result = await api.addInventory(data);
    await get().fetchInventory();
    return result;
  },

  doCheckIn: async (id, unitsSold) => {
    const result = await api.checkIn(id, unitsSold);
    await get().fetchAll();
    return result;
  },

  dismissCard: async (id) => {
    await api.dismissCard(id);
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }));
  },

  activatePromo: async (id) => {
    const result = await api.activatePromo(id);
    set({ inventory: result.updatedInventory, goal: result.updatedGoal });
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }));
    return result;
  },

  toggleGoalAction: async (actionId, done) => {
    const goal = await api.updateGoalAction(actionId, done);
    set({ goal });
  },
}));

export default useStore;
