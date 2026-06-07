// ─────────────────────────────────────────────────────────
//  tools.js  —  Definición de tools para Claude API
// ─────────────────────────────────────────────────────────

const tools = [
  {
    name: "get_inventory",
    description:
      "Obtiene el estado actual del inventario: productos, unidades disponibles, sell-through y alertas de rotación. Úsalo para diagnosticar el estado del negocio.",
    input_schema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          enum: ["all", "low_rotation", "high_rotation", "out_of_stock"],
          description: "Filtro opcional para mostrar solo productos en cierta condición",
        },
      },
      required: [],
    },
  },
  {
    name: "get_goal",
    description:
      "Obtiene el progreso hacia la meta activa del tendero: porcentaje de avance, hitos semanales, brecha restante y acciones recomendadas esta semana.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_promos",
    description:
      "Obtiene las promociones de Tuali disponibles que son relevantes para el inventario actual y la meta activa del tendero.",
    input_schema: {
      type: "object",
      properties: {
        productName: {
          type: "string",
          description: "Nombre del producto para buscar promos específicas (opcional)",
        },
      },
      required: [],
    },
  },
  {
    name: "update_stock",
    description:
      "Registra cuántas unidades se han vendido de un producto. Actualiza el inventario y recalcula el sell-through. Úsalo después del check-in semanal.",
    input_schema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "ID del producto a actualizar",
        },
        unitsSold: {
          type: "number",
          description: "Número total de unidades vendidas hasta ahora (no el delta, sino el total)",
        },
      },
      required: ["productId", "unitsSold"],
    },
  },
  {
    name: "validate_goal",
    description:
      "Evalúa si una meta propuesta por el tendero es realista. Usa el historial de ventas y el contexto del negocio para validar o ajustar. Devuelve si es realista, un ajuste sugerido y la justificación.",
    input_schema: {
      type: "object",
      properties: {
        goalType: {
          type: "string",
          enum: ["reduce_waste", "increase_sales", "increase_ticket", "optimize_orders"],
          description: "Tipo de meta",
        },
        targetValue: {
          type: "number",
          description: "Valor objetivo propuesto (ej: 10000 para ventas adicionales en pesos, o 80 para % de sell-through)",
        },
        timeframeDays: {
          type: "number",
          description: "Días para alcanzar la meta",
        },
      },
      required: ["goalType", "targetValue", "timeframeDays"],
    },
  },
];

module.exports = tools;
