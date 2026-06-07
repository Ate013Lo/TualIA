// ─────────────────────────────────────────────────────────
//  server.js  —  API REST + cron proactivo
// ─────────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const db = require("./mockData");
const { askGoalsChatbot, validateGoal, runProactiveAnalysis, generateGoalSuggestions } = require("./agent");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Cron: motor proactivo cada 24h (o cada minuto en demo) ─
// Para demo hackathon corremos cada 30 segundos para mostrar tarjetas
cron.schedule("*/30 * * * * *", () => {
  runProactiveAnalysis();
});

// ────────────────────────────────────────────────────────
//  INVENTARIO
// ────────────────────────────────────────────────────────
app.get("/api/inventory", (req, res) => {
  res.json(db.getInventory());
});

app.post("/api/inventory", (req, res) => {
  const { name, presentation, unitsBought, purchasePrice } = req.body;
  if (!name || !unitsBought || !purchasePrice) {
    return res.status(400).json({ error: "Faltan campos requeridos: name, unitsBought, purchasePrice" });
  }

  // Avisar si ya tiene stock suficiente
  const existing = db.getInventory().find(
    (i) => i.name.toLowerCase() === name.toLowerCase()
  );
  if (existing && existing.unitsRemaining > unitsBought * 0.5) {
    return res.status(200).json({
      warning: true,
      message: `Ya tienes ${existing.unitsRemaining} unidades de ${name}. Con tu sell-through actual (${existing.sellThrough}%), no te conviene pedir ${unitsBought} más. Recomendamos máximo ${Math.ceil(existing.unitsBought * 0.2)} unidades.`,
      currentStock: existing,
    });
  }

  const result = db.addInventoryItem({ name, presentation, unitsBought, purchasePrice });
  res.json(result);
});

// Historial de compras mensual
app.get("/api/inventory/history", (req, res) => {
  const now   = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year  = parseInt(req.query.year)  || now.getFullYear();
  res.json(db.getPurchaseHistory(month, year));
});

// Resurtir producto existente
app.post("/api/inventory/:id/restock", (req, res) => {
  const { units } = req.body;
  if (!units || units <= 0) return res.status(400).json({ error: "Unidades inválidas" });
  const item = db.restockItem(req.params.id, Number(units));
  if (!item) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(item);
});

// Check-in semanal
app.post("/api/inventory/:id/checkin", (req, res) => {
  const { unitsSold } = req.body;
  const updated = db.updateStock(req.params.id, unitsSold);
  if (!updated) return res.status(404).json({ error: "Producto no encontrado" });

  // Disparar motor proactivo inmediatamente
  runProactiveAnalysis();

  res.json({
    item: updated,
    proactiveCards: db.getProactiveCards(),
    goalProgress: db.getGoal().current,
  });
});

// ────────────────────────────────────────────────────────
//  METAS
// ────────────────────────────────────────────────────────
app.get("/api/goal", (req, res) => {
  res.json(db.getGoal());
});

app.get("/api/goal/suggestions", async (req, res) => {
  try {
    const suggestions = await generateGoalSuggestions();
    res.json(suggestions);
  } catch (err) {
    console.error("generateGoalSuggestions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goal/validate", async (req, res) => {
  const { proposal } = req.body;
  if (!proposal) return res.status(400).json({ error: "Falta proposal" });
  try {
    const result = await validateGoal(proposal);
    res.json(result);
  } catch (err) {
    console.error("validateGoal error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goal/set", (req, res) => {
  const updated = db.setGoal(req.body);
  res.json(updated);
});

app.patch("/api/goal/action/:actionId", (req, res) => {
  const { done } = req.body;
  const updated = db.updateGoalAction(req.params.actionId, done);
  res.json(updated);
});

// ────────────────────────────────────────────────────────
//  CHATBOT DE METAS
// ────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "Falta message" });

  try {
    const result = await askGoalsChatbot(message, history);
    res.json({ reply: result.text });
  } catch (err) {
    console.error("chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────
//  TARJETAS PROACTIVAS
// ────────────────────────────────────────────────────────
app.get("/api/cards", (req, res) => {
  res.json(db.getProactiveCards());
});

app.post("/api/cards/:id/dismiss", (req, res) => {
  const card = db.dismissCard(req.params.id);
  if (!card) return res.status(404).json({ error: "Card no encontrada" });
  res.json({ dismissed: true });
});

app.post("/api/cards/:id/activate-promo", (req, res) => {
  const card = db.activatePromo(req.params.id);
  if (!card) return res.status(404).json({ error: "Card no encontrada" });
  res.json({
    success: true,
    updatedInventory: db.getInventory(),
    updatedGoal: db.getGoal(),
  });
});

// ────────────────────────────────────────────────────────
//  PROMOS
// ────────────────────────────────────────────────────────
app.get("/api/promos", (req, res) => {
  res.json(db.getPromos());
});

// ────────────────────────────────────────────────────────
//  HEALTH
// ────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🌱 Tuali Growth Agent Backend corriendo en http://localhost:${PORT}`);
  console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "✅ configurada" : "❌ falta (crea .env)"}`);
  console.log(`   Motor proactivo: activo (cron cada 30 seg en modo demo)\n`);
  runProactiveAnalysis(); // correr al inicio
});
