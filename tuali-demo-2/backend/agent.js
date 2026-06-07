// ─────────────────────────────────────────────────────────
//  agent.js  —  Orquestador con Claude API + tool use
// ─────────────────────────────────────────────────────────

const Anthropic = require("@anthropic-ai/sdk");
const tools = require("./tools");
const db = require("./mockData");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Ejecutor de tools ─────────────────────────────────────
function executeTool(name, input) {
  switch (name) {
    case "get_inventory": {
      let inv = db.getInventory();
      if (input.filter === "low_rotation") {
        inv = inv.filter((i) => i.sellThrough < 50 && i.unitsRemaining > 0);
      } else if (input.filter === "high_rotation") {
        inv = inv.filter((i) => i.sellThrough >= 70);
      } else if (input.filter === "out_of_stock") {
        inv = inv.filter((i) => i.unitsRemaining === 0);
      }
      return {
        inventory: inv,
        summary: {
          totalProducts: inv.length,
          wasteRisk: inv.filter((i) => i.sellThrough < 50 && i.unitsRemaining > 0).length,
          highRotation: inv.filter((i) => i.sellThrough >= 70).length,
        },
      };
    }

    case "get_goal": {
      const goal = db.getGoal();
      const gap = goal.target - goal.current;
      return {
        goal,
        gap,
        onTrack: gap <= 20,
        nextMilestone: goal.weeklyMilestones.find((m) => !m.done) || null,
        pendingActions: goal.weeklyActions.filter((a) => !a.done),
      };
    }

    case "get_promos": {
      const promos = db.getPromos();
      if (input.productName) {
        return promos.filter((p) =>
          p.applicableProducts.some((prod) =>
            prod.toLowerCase().includes(input.productName.toLowerCase())
          )
        );
      }
      return promos;
    }

    case "update_stock": {
      const updated = db.updateStock(input.productId, input.unitsSold);
      if (!updated) return { error: "Producto no encontrado" };
      db.runProactiveEngine();
      return {
        updated,
        newCards: db.getProactiveCards().slice(-1),
      };
    }

    case "validate_goal": {
      const history = db.getSalesHistory();
      const { goalType, targetValue, timeframeDays } = input;
      let isRealistic = true;
      let adjustedValue = targetValue;
      let justification = "";

      if (goalType === "increase_sales") {
        const maxRealistic = history.monthlyAvg * 0.3 * (timeframeDays / 30);
        if (targetValue > maxRealistic) {
          isRealistic = false;
          adjustedValue = Math.round(maxRealistic);
          justification = `Tus ventas promedio mensuales son $${history.monthlyAvg.toLocaleString()}. Una meta de +$${targetValue.toLocaleString()} en ${timeframeDays} días (+${Math.round((targetValue / history.monthlyAvg) * 100)}%) es muy agresiva. Te sugiero $${adjustedValue.toLocaleString()} adicionales (+${Math.round((adjustedValue / history.monthlyAvg) * 100)}%), que es alcanzable con las acciones correctas.`;
        } else {
          justification = `Meta realista. Representa el ${Math.round((targetValue / history.monthlyAvg) * 100)}% de tu promedio mensual.`;
        }
      } else if (goalType === "reduce_waste") {
        isRealistic = targetValue <= 90;
        adjustedValue = Math.min(targetValue, 85);
        justification =
          targetValue <= 80
            ? "Meta alcanzable en el plazo propuesto con las acciones correctas."
            : "Meta muy ambiciosa. Ajustamos a 85% para que sea motivante y alcanzable.";
      }

      return { isRealistic, adjustedValue, justification, originalValue: targetValue };
    }

    default:
      return { error: `Tool desconocida: ${name}` };
  }
}

// ── Agente principal (multi-turn con tool use) ────────────
async function runAgent({ systemPrompt, messages, maxIterations = 5 }) {
  let iteration = 0;
  let currentMessages = [...messages];

  while (iteration < maxIterations) {
    iteration++;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: currentMessages,
    });

    // Si terminó sin tool use, devolver respuesta
    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return { text: textBlock?.text || "", toolsUsed: [] };
    }

    // Procesar tool_use blocks
    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      const toolResults = [];

      for (const block of toolUseBlocks) {
        const result = executeTool(block.name, block.input);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      // Añadir respuesta del asistente y resultados al historial
      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
      continue;
    }

    // Fallback
    const textBlock = response.content.find((b) => b.type === "text");
    return { text: textBlock?.text || "", toolsUsed: [] };
  }

  return { text: "No pude completar el análisis. Intenta de nuevo.", toolsUsed: [] };
}

// ── Sistema proactivo (cron) ──────────────────────────────
async function runProactiveAnalysis() {
  db.runProactiveEngine();
  console.log(
    `[Proactive Engine] ${new Date().toLocaleTimeString()} — Cards generadas: ${db.getProactiveCards().length}`
  );
}

// ── Chatbot de metas (modo reactivo) ─────────────────────
const GOALS_SYSTEM_PROMPT = `Eres el asistente de metas de Tuali. Ayudas al tendero a crecer su negocio.

REGLAS:
•⁠  ⁠Respuestas MUY cortas: solo utiliza bullets simples.
•⁠  ⁠Solo lo más importante. Si hay 20 productos, menciona máximo 15 (los más urgentes).
•⁠  ⁠Tono de WhatsApp: directo, amigable, sin formalismos.
•⁠  ⁠Siempre termina con UNA sola acción concreta para HOY.
•⁠  ⁠Nunca uses emojis de tabla ni pipes (|). Solo texto o bullets simples.
•⁠  ⁠Si el tendero no pregunta detalles, no los des.`;

async function askGoalsChatbot(userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  return await runAgent({
    systemPrompt: GOALS_SYSTEM_PROMPT,
    messages,
    maxIterations: 4,
  });
}

// ── Validador de metas (onboarding) ──────────────────────
const VALIDATION_SYSTEM_PROMPT = `Eres el agente de validación de metas de Tuali.
Cuando el tendero propone una meta, usa el tool validate_goal para evaluar si es realista.

INSTRUCCIÓN CRÍTICA: Tu respuesta debe ser SOLO el JSON puro. Sin texto antes, sin texto después, sin bloques de código, sin backticks, sin explicaciones. Literalmente el primer carácter debe ser { y el último debe ser }.

Formato:
{"isRealistic":true,"suggestedGoal":{"type":"reduce_waste","value":80,"label":"Reducir merma al 80%"},"message":"Mensaje corto y amigable en español, máximo 2 oraciones, sin JSON","weeklyMilestones":[{"week":1,"target":20},{"week":2,"target":40},{"week":3,"target":60},{"week":4,"target":80}]}

IMPORTANTE: El campo "message" debe ser texto legible en español, NUNCA JSON ni código.`;

async function validateGoal(goalProposal) {
  const messages = [
    {
      role: "user",
      content: `El tendero quiere: ${goalProposal}. Valida y ajusta si es necesario.`,
    },
  ];

  const result = await runAgent({
    systemPrompt: VALIDATION_SYSTEM_PROMPT,
    messages,
    maxIterations: 3,
  });

  try {
    const first = result.text.indexOf("{");
    const last  = result.text.lastIndexOf("}");
    const clean = first !== -1 && last !== -1
      ? result.text.slice(first, last + 1)
      : result.text.trim();
    return JSON.parse(clean);
  } catch {
    return {
      isRealistic: true,
      message: result.text,
      suggestedGoal: null,
    };
  }
}

// ── Sugerencias de metas basadas en inventario real ──────
async function generateGoalSuggestions() {
  const inventory = db.getInventory();

  const inventoryContext = inventory.map(i => ({
    nombre: i.name,
    unidadesRestantes: i.unitsRemaining,
    unidadesVendidas: i.unitsSold,
    sellThrough: `${i.sellThrough}%`,
    precioCompra: `$${i.purchasePrice}`,
  }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `Eres el agente de sugerencias de metas de Tuali. Analizas el inventario real de una tienda de abarrotes y generas exactamente 4 sugerencias de metas personalizadas y concretas. Responde SOLO con un JSON array puro. Sin markdown, sin backticks, sin texto adicional. El primer carácter debe ser [ y el último ].`,
    messages: [{
      role: "user",
      content: `Inventario actual de la tienda:
${JSON.stringify(inventoryContext, null, 2)}

Genera exactamente 4 sugerencias de metas específicas para ESTE inventario, usando datos reales (productos con bajo sell-through, sobre-stock, oportunidades de venta, etc.).

Formato JSON requerido (array de 4 objetos, un objeto por tipo):
[
  {
    "type": "reduce_waste",
    "title": "Título conciso (máx 5 palabras)",
    "description": "Una sola oración que explique por qué esta meta es relevante para su inventario actual. Menciona un producto específico.",
    "goalText": "Texto claro de la meta para el validador. Incluye producto, número objetivo y plazo en días."
  }
]

Usa cada uno de estos tipos exactamente una vez: reduce_waste, increase_sales, increase_ticket, optimize_orders.`,
    }],
  });

  const text = response.content.find(b => b.type === "text")?.text?.trim() || "[]";
  try {
    const first = text.indexOf("[");
    const last  = text.lastIndexOf("]");
    const clean = first !== -1 && last !== -1 ? text.slice(first, last + 1) : "[]";
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

module.exports = { askGoalsChatbot, validateGoal, runProactiveAnalysis, executeTool, generateGoalSuggestions };
