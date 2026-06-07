// src/lib/api.js  — Cliente HTTP para el backend

import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getInventory     = ()                     => api.get("/inventory").then(r => r.data);
export const addInventory     = (data)                 => api.post("/inventory", data).then(r => r.data);
export const checkIn          = (id, unitsSold)        => api.post(`/inventory/${id}/checkin`, { unitsSold }).then(r => r.data);
export const restock          = (id, units)            => api.post(`/inventory/${id}/restock`, { units }).then(r => r.data);
export const getPurchaseHistory = (month, year)        => api.get("/inventory/history", { params: { month, year } }).then(r => r.data);

export const getGoalSuggestions = ()                   => api.get("/goal/suggestions").then(r => r.data);
export const getGoal          = ()                     => api.get("/goal").then(r => r.data);
export const validateGoal     = (proposal)             => api.post("/goal/validate", { proposal }).then(r => r.data);
export const setGoal          = (data)                 => api.post("/goal/set", data).then(r => r.data);
export const updateGoalAction = (actionId, done)       => api.patch(`/goal/action/${actionId}`, { done }).then(r => r.data);

export const chat             = (message, history)     => api.post("/chat", { message, history }).then(r => r.data);

export const getCards         = ()                     => api.get("/cards").then(r => r.data);
export const dismissCard      = (id)                   => api.post(`/cards/${id}/dismiss`).then(r => r.data);
export const activatePromo    = (id)                   => api.post(`/cards/${id}/activate-promo`).then(r => r.data);

export const getPromos        = ()                     => api.get("/promos").then(r => r.data);
