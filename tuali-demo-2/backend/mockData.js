// ─────────────────────────────────────────────────────────
//  mockData.js  —  Persistencia con SQLite (better-sqlite3)
// ─────────────────────────────────────────────────────────

const Database = require("better-sqlite3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const db = new Database(path.join(__dirname, "tuali.db"));

// ── Crear tablas si no existen ────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    presentation TEXT,
    unitsBought INTEGER DEFAULT 0,
    unitsRemaining INTEGER DEFAULT 0,
    unitsSold INTEGER DEFAULT 0,
    purchasePrice REAL DEFAULT 0,
    entryDate TEXT,
    sellThrough INTEGER DEFAULT 0,
    checkedIn INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS goal (
    id TEXT PRIMARY KEY,
    type TEXT,
    label TEXT,
    target INTEGER,
    current INTEGER DEFAULT 0,
    startDate TEXT,
    endDate TEXT,
    weeklyMilestones TEXT,
    weeklyActions TEXT
  );

  CREATE TABLE IF NOT EXISTS purchase_history (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    productName TEXT NOT NULL,
    units INTEGER NOT NULL,
    pricePerUnit REAL NOT NULL,
    total REAL NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS proactive_cards (
    id TEXT PRIMARY KEY,
    type TEXT,
    icon TEXT,
    title TEXT,
    body TEXT,
    suggestion TEXT,
    promoId TEXT,
    productId TEXT,
    createdAt TEXT,
    dismissed INTEGER DEFAULT 0,
    promoActivated INTEGER DEFAULT 0
  );
`);

// ── Seed inicial si la BD está vacía ─────────────────────
const count = db.prepare("SELECT COUNT(*) as n FROM inventory").get();
if (count.n === 0) {
  const insert = db.prepare(`
    INSERT INTO inventory (id, name, presentation, unitsBought, unitsRemaining, unitsSold, purchasePrice, entryDate, sellThrough, checkedIn)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const tenDaysAgo   = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo   = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  insert.run("inv-001", "Coca-Cola 500ml",        "Caja de 6 latas",   30, 30, 10,  12.0, sevenDaysAgo, 0, 0);
  insert.run("inv-002", "Sabritas Adobadas 150g", "Caja de 12 bolsas", 24,  8, 16,  9.5, tenDaysAgo,  67, 1);
  insert.run("inv-003", "Agua Ciel 600ml",        "Paquete de 24",     48, 48, 0,   7.0, twoDaysAgo,   0, 0);
  insert.run("inv-004", "Agua Ciel 1L",           "Paquete de 12",     24, 24, 0,  11.0, twoDaysAgo,   0, 0);
  insert.run("inv-005", "Jumex Durazno 355ml",    "Paquete de 6",      48, 48, 0,   8.5, twoDaysAgo,   0, 0);
  insert.run("inv-006", "Jumex Manzana 355ml",    "Paquete de 6",      48, 48, 0,   8.5, twoDaysAgo,   0, 0);
  insert.run("inv-007", "Fanta 700ml",            "Paquete de 6",      48, 48, 0,  13.0, twoDaysAgo,   0, 0);
}

const goalCount = db.prepare("SELECT COUNT(*) as n FROM goal").get();
if (goalCount.n === 0) {
  db.prepare(`INSERT INTO goal VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    "goal-001",
    "reduce_waste",
    "Reducir merma",
    80, 33,
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
    JSON.stringify([
      { week: 1, target: 40, achieved: 33, done: false },
      { week: 2, target: 60, achieved: null, done: false },
      { week: 3, target: 70, achieved: null, done: false },
      { week: 4, target: 80, achieved: null, done: false },
    ]),
    JSON.stringify([
      { id: "a1", text: "Activar promo 2x1 en Coca-Cola", done: false, impact: "+18%" },
      { id: "a2", text: "Revisar stock de Sabritas antes del próximo pedido", done: true, impact: "+5%" },
      { id: "a3", text: "Etiquetar productos con baja rotación", done: false, impact: "+8%" },
    ])
  );
}

// ── Promos (estáticas) ────────────────────────────────────
const promos = [
  { id: "promo-001", name: "2x1 en refrescos",        applicableProducts: ["Coca-Cola","Pepsi","Fanta"],    discount: "50%", validUntil: new Date(Date.now() + 5*24*60*60*1000).toISOString(), description: "Aplica en latas y botellas" },
  { id: "promo-002", name: "Descuento 15% en botanas", applicableProducts: ["Sabritas","Ruffles","Doritos"], discount: "15%", validUntil: new Date(Date.now() + 3*24*60*60*1000).toISOString(), description: "En presentaciones individuales" },
  { id: "promo-003", name: "3x2 en agua embotellada",  applicableProducts: ["Ciel","Epura","Bonafont"],      discount: "33%", validUntil: new Date(Date.now() + 7*24*60*60*1000).toISOString(), description: "Botellas de 600ml y 1L" },
  { id: "promo-004", name: "Combo Jumex",              applicableProducts: ["Jumex"],                        discount: "20%", validUntil: new Date(Date.now() + 4*24*60*60*1000).toISOString(), description: "Compra 3 jugos Jumex y obtén 20% de descuento" },
];

// ── Helpers ───────────────────────────────────────────────
function computeST(item) {
  if (!item.unitsBought) return 0;
  return Math.round((item.unitsSold / item.unitsBought) * 100);
}

function parseGoal(row) {
  if (!row) return null;
  return {
    ...row,
    weeklyMilestones: JSON.parse(row.weeklyMilestones || "[]"),
    weeklyActions:    JSON.parse(row.weeklyActions    || "[]"),
  };
}

function runProactiveEngine() {
  const inventory = db.prepare("SELECT * FROM inventory").all();
  inventory.forEach(item => {
    const st = computeST(item);
    const daysInStock = Math.round((Date.now() - new Date(item.entryDate).getTime()) / 86400000);

    // Auto-dismiss waste_risk si ya mejoró el sell-through
    if (st >= 50 || item.unitsRemaining === 0) {
      db.prepare("UPDATE proactive_cards SET dismissed=1 WHERE type='waste_risk' AND productId=? AND dismissed=0")
        .run(item.id);
    }

    // Auto-dismiss stock_out si ya se resurtió
    if (item.unitsRemaining > 5) {
      db.prepare("UPDATE proactive_cards SET dismissed=1 WHERE type='stock_out' AND productId=? AND dismissed=0")
        .run(item.id);
    }

    if (st < 50 && daysInStock >= 5 && item.unitsRemaining > 0) {
      const exists = db.prepare(
        "SELECT id FROM proactive_cards WHERE type='waste_risk' AND productId=? AND dismissed=0"
      ).get(item.id);
      if (!exists) {
        const promoMatch = promos.find(p =>
          p.applicableProducts.some(n => item.name.toLowerCase().includes(n.toLowerCase()))
        );
        db.prepare(`INSERT INTO proactive_cards VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
          uuidv4(), "waste_risk", "⚠️",
          `Riesgo de merma: ${item.name}`,
          `Tienes ${item.unitsRemaining} unidades con sell-through del ${st}%.`,
          promoMatch ? `Activa la promo "${promoMatch.name}" para acelerar la rotación.` : "Reduce el precio esta semana.",
          promoMatch?.id || null,
          item.id,
          new Date().toISOString(),
          0, 0
        );
      }
    }

    if (st > 80 && item.unitsRemaining <= 5) {
      const exists = db.prepare(
        "SELECT id FROM proactive_cards WHERE type='stock_out' AND productId=? AND dismissed=0"
      ).get(item.id);
      if (!exists) {
        db.prepare(`INSERT INTO proactive_cards VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
          uuidv4(), "stock_out", "📦",
          `Reposición urgente: ${item.name}`,
          `Solo te quedan ${item.unitsRemaining} unidades (sell-through ${st}%).`,
          `Registra un pedido de mínimo ${Math.ceil(item.unitsBought * 0.5)} unidades.`,
          null, item.id,
          new Date().toISOString(),
          0, 0
        );
      }
    }
  });
}

// ── Exports ───────────────────────────────────────────────
module.exports = {
  getInventory: () => db.prepare("SELECT * FROM inventory").all(),

  getGoal: () => parseGoal(db.prepare("SELECT * FROM goal LIMIT 1").get()),

  getPromos: () => promos,

  getSalesHistory: () => ({
    monthlyAvg: 18000, lastMonth: 17200,
    thisMonthSoFar: 5800, weeklyTrend: [4200,4500,4100,4400], avgTicket: 47,
  }),

  getProactiveCards: () => db.prepare("SELECT * FROM proactive_cards WHERE dismissed=0").all(),

  updateStock: (productId, unitsSold) => {
    const item = db.prepare("SELECT * FROM inventory WHERE id=?").get(productId);
    if (!item) return null;
    const remaining = item.unitsBought - unitsSold;
    const st = Math.round((unitsSold / item.unitsBought) * 100);
    db.prepare(`
      UPDATE inventory SET unitsSold=?, unitsRemaining=?, sellThrough=?, checkedIn=1 WHERE id=?
    `).run(unitsSold, remaining, st, productId);
    return db.prepare("SELECT * FROM inventory WHERE id=?").get(productId);
  },

  restockItem: (id, units) => {
    const item = db.prepare("SELECT * FROM inventory WHERE id=?").get(id);
    if (!item) return null;
    db.prepare("UPDATE inventory SET unitsBought=unitsBought+?, unitsRemaining=unitsRemaining+? WHERE id=?")
      .run(units, units, id);
    db.prepare("INSERT INTO purchase_history VALUES (?,?,?,?,?,?,?)")
      .run(uuidv4(), id, item.name, units, item.purchasePrice, units * item.purchasePrice, new Date().toISOString());
    return db.prepare("SELECT * FROM inventory WHERE id=?").get(id);
  },

  getPurchaseHistory: (month, year) => {
    const from = new Date(year, month - 1, 1).toISOString();
    const to   = new Date(year, month, 1).toISOString();
    return db.prepare("SELECT * FROM purchase_history WHERE date >= ? AND date < ? ORDER BY date ASC").all(from, to);
  },

  addInventoryItem: (data) => {
    const existing = db.prepare("SELECT * FROM inventory WHERE LOWER(name)=LOWER(?)").get(data.name);
    if (existing && existing.unitsRemaining > data.unitsBought * 0.5) {
      return { item: existing, wasExisting: true, warning: true,
        message: `Ya tienes ${existing.unitsRemaining} unidades de ${existing.name}. Recomendamos máximo ${Math.ceil(existing.unitsBought * 0.2)} unidades.` };
    }
    if (existing) {
      db.prepare("UPDATE inventory SET unitsBought=unitsBought+?, unitsRemaining=unitsRemaining+? WHERE id=?")
        .run(data.unitsBought, data.unitsBought, existing.id);
      return { item: db.prepare("SELECT * FROM inventory WHERE id=?").get(existing.id), wasExisting: true };
    }
    const newItem = {
      id: uuidv4(), name: data.name, presentation: data.presentation || "",
      unitsBought: data.unitsBought, unitsRemaining: data.unitsBought,
      unitsSold: 0, purchasePrice: data.purchasePrice,
      entryDate: new Date().toISOString(), sellThrough: 0, checkedIn: 0,
    };
    db.prepare(`INSERT INTO inventory VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      newItem.id, newItem.name, newItem.presentation,
      newItem.unitsBought, newItem.unitsRemaining, newItem.unitsSold,
      newItem.purchasePrice, newItem.entryDate, newItem.sellThrough, newItem.checkedIn
    );
    return { item: newItem, wasExisting: false };
  },

  dismissCard: (cardId) => {
    db.prepare("UPDATE proactive_cards SET dismissed=1 WHERE id=?").run(cardId);
    return { id: cardId, dismissed: true };
  },

  activatePromo: (cardId) => {
    const card = db.prepare("SELECT * FROM proactive_cards WHERE id=?").get(cardId);
    if (!card) return null;
    db.prepare("UPDATE proactive_cards SET dismissed=1, promoActivated=1 WHERE id=?").run(cardId);
    const item = db.prepare("SELECT * FROM inventory WHERE id=?").get(card.productId);
    if (item) {
      const bonus = Math.min(15, item.unitsRemaining);
      const newSold = item.unitsSold + bonus;
      const newRemaining = item.unitsRemaining - bonus;
      const st = Math.round((newSold / item.unitsBought) * 100);
      db.prepare("UPDATE inventory SET unitsSold=?, unitsRemaining=?, sellThrough=? WHERE id=?")
        .run(newSold, newRemaining, st, item.id);
      const goal = db.prepare("SELECT * FROM goal LIMIT 1").get();
      if (goal) {
        const newCurrent = Math.min(85, goal.current + 30);
        db.prepare("UPDATE goal SET current=? WHERE id=?").run(newCurrent, goal.id);
      }
    }
    return {
      card,
      updatedInventory: db.prepare("SELECT * FROM inventory").all(),
      updatedGoal: parseGoal(db.prepare("SELECT * FROM goal LIMIT 1").get()),
    };
  },

  setGoal: (data) => {
    const existing = db.prepare("SELECT id FROM goal LIMIT 1").get();
    const id = existing?.id || uuidv4();
    const milestones = JSON.stringify(data.weeklyMilestones || []);
    const actions    = JSON.stringify(data.weeklyActions    || []);
    if (existing) {
      db.prepare(`UPDATE goal SET type=?,label=?,target=?,current=?,startDate=?,endDate=?,weeklyMilestones=?,weeklyActions=? WHERE id=?`)
        .run(data.type, data.label, data.target, data.current || 0, data.startDate || new Date().toISOString(), data.endDate || "", milestones, actions, id);
    } else {
      db.prepare(`INSERT INTO goal VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(id, data.type, data.label, data.target, 0, new Date().toISOString(), "", milestones, actions);
    }
    return parseGoal(db.prepare("SELECT * FROM goal WHERE id=?").get(id));
  },

  updateGoalAction: (actionId, done) => {
    const goal = db.prepare("SELECT * FROM goal LIMIT 1").get();
    if (!goal) return null;
    const actions = JSON.parse(goal.weeklyActions || "[]");
    const updated = actions.map(a => a.id === actionId ? { ...a, done } : a);
    db.prepare("UPDATE goal SET weeklyActions=? WHERE id=?").run(JSON.stringify(updated), goal.id);
    return parseGoal(db.prepare("SELECT * FROM goal WHERE id=?").get(goal.id));
  },

  runProactiveEngine,
  computeSellThrough: computeST,
};
