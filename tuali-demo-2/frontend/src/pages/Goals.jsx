import React, { useEffect, useRef, useState } from "react";
import useStore from "../store/useStore";
import { chat, getGoalSuggestions } from "../lib/api";
import { GoalIconSVG } from "../lib/productImages";
import GoalCreator from "../components/GoalCreator";

// ── Metas predefinidas por perfil ─────────────────────────
const PROFILE_GOALS = {
  default: [
    {
      id: "g1",
      type: "reduce_waste",
      color: "#FEF2F2",
      iconColor: "#E0281A",
      title: "Reducir merma",
      desc: "Mejora el sell-through de tus productos más lentos y evita pérdidas.",
      pts: 150,
      loyaltyMsg: "Suma 150 puntos Tuali al completarla",
      target: 80,
      current: 45,
      unit: "%",
      unitLabel: "sell-through promedio",
      trend: "+12% esta semana",
      trendUp: true,
      actions: [
        { id: "a1", text: "Activar promo 2x1 en Coca-Cola", done: false },
        { id: "a2", text: "Revisar stock de Sabritas", done: true },
        { id: "a3", text: "Etiquetar productos con baja rotación", done: false },
      ],
      weekly: [35, 38, 42, 45],
    },
    {
      id: "g2",
      type: "increase_sales",
      color: "#F0FDF4",
      iconColor: "#16A34A",
      title: "Aumentar ventas $3,000",
      desc: "Incrementa tu revenue mensual con las acciones recomendadas por el agente.",
      pts: 300,
      loyaltyMsg: "Suma 300 puntos Tuali al completarla",
      target: 3000,
      current: 1200,
      unit: "$",
      unitLabel: "de $3,000 en ventas adicionales",
      trend: "+$320 vs semana pasada",
      trendUp: true,
      actions: [
        { id: "b1", text: "Activar promo de refresco semanal", done: false },
        { id: "b2", text: "Resurtir Coca-Cola antes del fin de semana", done: false },
      ],
      weekly: [200, 450, 900, 1200],
    },
    {
      id: "g3",
      type: "increase_ticket",
      color: "#FAF5FF",
      iconColor: "#7C3AED",
      title: "Ticket promedio $55",
      desc: "Sube el valor promedio por cliente de $45 a $55 con bundles sugeridos.",
      pts: 200,
      loyaltyMsg: "Suma 200 puntos Tuali al completarla",
      target: 55,
      current: 48,
      unit: "$",
      unitLabel: "ticket promedio actual",
      trend: "+$3 vs semana pasada",
      trendUp: true,
      actions: [
        { id: "c1", text: "Crear bundle Refresco + Botana", done: true },
        { id: "c2", text: "Ofrecer agua al cobrar cualquier producto", done: false },
      ],
      weekly: [45, 46, 47, 48],
    },
    {
      id: "g4",
      type: "optimize_orders",
      color: "#EFF6FF",
      iconColor: "#1D4ED8",
      title: "Optimizar pedidos",
      desc: "Reduce sobre-stock y quiebres. Pide lo justo según tu rotación real.",
      pts: null,
      loyaltyMsg: null,
      target: 90,
      current: 60,
      unit: "%",
      unitLabel: "pedidos sin sobre-stock",
      trend: "+5% esta semana",
      trendUp: true,
      actions: [
        { id: "d1", text: "Usar sugerencia de cantidad del agente en próximo pedido", done: false },
      ],
      weekly: [50, 55, 58, 60],
    },
  ],
};

const SUGGESTIONS = [
  "¿Cómo voy con mi meta?",
  "¿Qué hago esta semana?",
  "¿Por qué no avanzo?",
];

function GoalDetail({ goal, onBack }) {
  const [actions, setActions] = useState(goal.actions);
  const [messages, setMessages] = useState([
    { role: "bot", text: `Hola 👋 Estoy viendo tu meta "${goal.title}". ¿En qué te ayudo?` },
  ]);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const chatRef             = useRef(null);
  
  

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing]);

  const pct = goal.unit === "$"
    ? Math.min(100, Math.round((goal.current / goal.target) * 100))
    : Math.min(100, Math.round((goal.current / goal.target) * 100));

  const sendMsg = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: msg }]);
    setTyping(true);
    try {
      const history = messages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      const res = await chat(msg, history);
      setMessages(m => [...m, { role: "bot", text: res.reply }]);

      // ── ElevenLabs voz ──────────────────────────────────
      const EL_KEY = "PEGA_AQUI_TU_ELEVENLABS_KEY"; // reemplaza con tu key sk_...
      if (EL_KEY && EL_KEY !== "sk_db5e4b0813731973125cb9647d426d27086142f8b89dee34") {
        try {
          const vr = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
            method: "POST",
            headers: { "xi-api-key": EL_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({
              text: res.reply,
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            }),
          });
          const blob = await vr.blob();
          new Audio(URL.createObjectURL(blob)).play();
        } catch (e) { console.warn("ElevenLabs error:", e); }
      }
      // ────────────────────────────────────────────────────
    } catch {
      setMessages(m => [...m, { role: "bot", text: "Revisa que el backend esté corriendo con tu API key." }]);
    }
    setTyping(false);
  };

  const toggleAction = (id) => {
    setActions(a => a.map(x => x.id === id ? { ...x, done: !x.done } : x));
  };

  return (
    <>
      <div className="goal-detail-header">
        <button className="goal-detail-back" onClick={onBack}>
          ← Volver a metas
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div className="goal-icon-wrap" style={{ background: goal.color, fontSize: "1.5rem", width: 48, height: 48 }}>
            <span dangerouslySetInnerHTML={{ __html: GoalIconSVG({ type: goal.type }) }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>{goal.title}</p>
            {goal.pts && (
              <span className="chip chip-gold">⭐ {goal.loyaltyMsg}</span>
            )}
          </div>
        </div>
        {/* Big progress */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", color: "var(--gray-text)", marginBottom: 6 }}>
            <span>Progreso</span>
            <span style={{ fontWeight: 700, color: "var(--black)" }}>{pct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 12 }}>
            <div className="progress-fill" style={{
              width: `${pct}%`,
              background: pct >= 70 ? "var(--green)" : pct >= 40 ? "var(--gold)" : "var(--red)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: ".78rem", color: "var(--gray-text)" }}>
            <span>{goal.unit}{goal.current.toLocaleString()} actual</span>
            <span>Meta: {goal.unit}{goal.target.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-row">
        <div className="stat-box">
          <p className={`stat-val ${goal.trendUp ? "green" : "red"}`}>{goal.trend.split(" ")[0]}</p>
          <p className="stat-lbl">vs semana pasada</p>
        </div>
        <div className="stat-box">
          <p className="stat-val red">{100 - pct}%</p>
          <p className="stat-lbl">restante para la meta</p>
        </div>
        <div className="stat-box">
          <p className="stat-val purple">{goal.pts ?? "—"}</p>
          <p className="stat-lbl">puntos al completar</p>
        </div>
        <div className="stat-box">
          <p className="stat-val" style={{ fontSize: "1.2rem" }}>{actions.filter(a => a.done).length}/{actions.length}</p>
          <p className="stat-lbl">acciones completadas</p>
        </div>
      </div>

      {/* Weekly progress bars */}
      <div style={{ margin: "0 16px 16px", background: "var(--white)", borderRadius: "var(--r)", border: "1px solid var(--gray-line)", padding: "14px" }}>
        <p style={{ fontWeight: 700, fontSize: ".9rem", marginBottom: 12 }}>Progreso semanal</p>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 64 }}>
          {goal.weekly.map((v, i) => {
            const h = Math.round((v / goal.target) * 100);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "100%", height: `${Math.max(4, h * 0.6)}px`,
                  background: i === goal.weekly.length - 1 ? "var(--red)" : "var(--gray-line)",
                  borderRadius: 4,
                }} />
                <span style={{ fontSize: ".68rem", color: "var(--gray-text)" }}>S{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ margin: "0 16px 16px", background: "var(--white)", borderRadius: "var(--r)", border: "1px solid var(--gray-line)", padding: "14px" }}>
        <p style={{ fontWeight: 700, fontSize: ".9rem", marginBottom: 12 }}>Acciones recomendadas</p>
        {actions.map(a => (
          <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={a.done} onChange={() => toggleAction(a.id)}
              style={{ accentColor: "var(--red)", width: 18, height: 18 }} />
            <span style={{ fontSize: ".88rem", textDecoration: a.done ? "line-through" : "none", color: a.done ? "var(--gray-text)" : "var(--black)" }}>
              {a.text}
            </span>
          </label>
        ))}
      </div>

      {/* Chatbot */}
      <div style={{ margin: "0 16px 16px", background: "var(--white)", borderRadius: "var(--r)", border: "1px solid var(--gray-line)", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--gray-line)" }}>
          <p style={{ fontWeight: 700, fontSize: ".9rem" }}>💬 Pregúntale al agente</p>
        </div>
        <div className="chat-wrap" ref={chatRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role === "user" ? "user" : "bot"}`}>{m.text}</div>
          ))}
          {typing && (
            <div className="bubble bot" style={{ display: "flex", gap: 4, padding: "10px 14px" }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "var(--gray-text)",
                  animation: `bounce .8s infinite ${i * 0.15}s`,
                  display: "inline-block",
                }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 16px" }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMsg(s)} disabled={typing}
              style={{ background: "var(--gray-bg)", border: "1px solid var(--gray-line)", borderRadius: "var(--r-pill)", padding: "5px 12px", fontSize: ".76rem", fontWeight: 600, color: "var(--gray-dk)" }}>
              {s}
            </button>
          ))}
        </div>
        <div className="chat-input-row">
          <input className="chat-input" placeholder="Escribe tu pregunta…" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !typing && sendMsg()} disabled={typing} />
          <button className="chat-send-btn" onClick={() => sendMsg()} disabled={typing || !input.trim()}>→</button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}

export default function Goals() {
  const [tab, setTab]           = useState("metas");
  const [selected, setSelected] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [customGoalText, setCustomGoalText] = useState("");
  const [customGoalInit, setCustomGoalInit] = useState(null);
  const [customGoalType, setCustomGoalType] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [goals, setGoals] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("custom_goals") || "[]");
      return [...PROFILE_GOALS.default, ...saved];
    } catch {
      return PROFILE_GOALS.default;
    }
  });

  const handleNuevaMeta = async () => {
    setShowSuggestions(true);
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const data = await getGoalSuggestions();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  const handleSuggestionPick = (s) => {
    setShowSuggestions(false);
    setCustomGoalInit(s.goalText);
    setCustomGoalType(s.type);
    setShowCreator(true);
  };

  const handleCustomGoalSubmit = () => {
    if (!customGoalText.trim()) return;
    setCustomGoalInit(customGoalText.trim());
    setCustomGoalText("");
    setShowCreator(true);
  };

  const handleGoalSaved = (savedGoal) => {
    if (!savedGoal) return;
    const COLOR_MAP = {
      increase_sales:  { color: "#F0FDF4", iconColor: "#16A34A" },
      reduce_waste:    { color: "#FEF2F2", iconColor: "#E0281A" },
      increase_ticket: { color: "#FAF5FF", iconColor: "#7C3AED" },
      optimize_orders: { color: "#EFF6FF", iconColor: "#1D4ED8" },
      custom:          { color: "#FFF7ED", iconColor: "#EA580C" },
    };
    const colors = COLOR_MAP[savedGoal.type] || COLOR_MAP.custom;
    const newGoal = {
      id: `custom-${Date.now()}`,
      type: savedGoal.type,
      color: colors.color,
      iconColor: colors.iconColor,
      title: savedGoal.label,
      desc: "Meta personalizada creada con el agente.",
      loyaltyMsg: null,
      target: savedGoal.target,
      current: 0,
      unit: savedGoal.type === "increase_sales" || savedGoal.type === "increase_ticket" ? "$" : "%",
      trend: "Recién iniciada",
      trendUp: true,
      actions: (savedGoal.weeklyActions || []).map(a => ({ id: a.id, text: a.text, done: a.done })),
      weekly: [0],
    };
    setGoals(prev => {
      const updated = [...prev, newGoal];
      const custom = updated.filter(g => g.id.startsWith("custom-"));
      localStorage.setItem("custom_goals", JSON.stringify(custom));
      return updated;
    });
  };

  if (selected) {
    return <GoalDetail goal={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-row">
          <div>
            <p className="topbar-store">Punto de venta</p>
            <p className="topbar-name">Metas <span className="chevron">▼</span></p>
          </div>
          <button className="topbar-cart">⭐</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="goals-tabs">
        <button className={`goals-tab${tab === "metas" ? " active" : ""}`} onClick={() => setTab("metas")}>
          Mis metas
        </button>
        <button className={`goals-tab${tab === "seguimiento" ? " active" : ""}`} onClick={() => setTab("seguimiento")}>
          Seguimiento
        </button>
      </div>

      <button
  onClick={handleNuevaMeta}
  style={{
    display: "flex", alignItems: "center", gap: 6,
    margin: "12px 16px 4px", width: "calc(100% - 32px)",
    background: "#E0281A", color: "white",
    borderRadius: 99, padding: "12px 16px",
    fontSize: ".92rem", fontWeight: 700,
    border: "none", cursor: "pointer",
  }}
>
  + Nueva meta
</button>

{showCreator && (
  <GoalCreator
    initialText={customGoalInit}
    initialType={customGoalType}
    onDone={(savedGoal) => { handleGoalSaved(savedGoal); setShowCreator(false); setCustomGoalInit(null); setCustomGoalType(null); }}
    onCancel={() => { setShowCreator(false); setCustomGoalInit(null); setCustomGoalType(null); }}
  />
)}

{showSuggestions && (
  <div
    onClick={() => setShowSuggestions(false)}
    style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,.45)",
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: "#fff", borderRadius: "22px 22px 0 0",
        padding: "20px 16px 40px", maxHeight: "82vh", overflowY: "auto",
      }}
    >
      {/* Handle */}
      <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 99, margin: "0 auto 18px" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>✨</div>
        <div>
          <p style={{ fontWeight: 800, fontSize: "1rem", color: "#111827" }}>Sugerencias para tu tienda</p>
          <p style={{ fontSize: ".76rem", color: "#6B7280" }}>El agente analizó tu inventario actual</p>
        </div>
      </div>

      <div style={{ height: 1, background: "#F3F4F6", margin: "14px 0" }} />

      {loadingSuggestions ? (
        [0,1,2,3].map(i => (
          <div key={i} style={{
            height: 76, borderRadius: 14, background: "#F3F4F6",
            marginBottom: 10, animation: "pulse 1.2s infinite",
            opacity: 1 - i * 0.15,
          }} />
        ))
      ) : suggestions.length === 0 ? (
        <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: ".88rem", padding: "24px 0" }}>
          No se pudieron generar sugerencias. Intenta de nuevo.
        </p>
      ) : (
        suggestions.map((s, i) => {
          const COLORS = {
            reduce_waste:    { bg: "#FEF2F2", icon: "#E0281A" },
            increase_sales:  { bg: "#F0FDF4", icon: "#16A34A" },
            increase_ticket: { bg: "#FAF5FF", icon: "#7C3AED" },
            optimize_orders: { bg: "#EFF6FF", icon: "#1D4ED8" },
          };
          const ICONS = {
            reduce_waste: "📉", increase_sales: "📈",
            increase_ticket: "🧾", optimize_orders: "📦",
          };
          const c = COLORS[s.type] || { bg: "#FFF7ED", icon: "#EA580C" };
          return (
            <button
              key={i}
              onClick={() => handleSuggestionPick(s)}
              style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                borderRadius: 14, padding: "13px 14px", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 11, background: c.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.3rem", flexShrink: 0,
              }}>
                {ICONS[s.type] || "⭐"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: ".9rem", color: "#111827" }}>{s.title}</p>
                <p style={{ fontSize: ".78rem", color: "#6B7280", marginTop: 3, lineHeight: 1.4 }}>{s.description}</p>
              </div>
              <span style={{ color: "#9CA3AF", fontSize: "1.3rem", flexShrink: 0 }}>›</span>
            </button>
          );
        })
      )}

      <button
        onClick={() => { setShowSuggestions(false); setCustomGoalInit(null); setCustomGoalType(null); setShowCreator(true); }}
        style={{
          width: "100%", marginTop: 6,
          background: "transparent", border: "1.5px dashed #D1D5DB",
          borderRadius: 14, padding: "13px 14px",
          fontSize: ".88rem", color: "#6B7280", fontWeight: 600,
          cursor: "pointer",
        }}
      >
        + Escribir mi propia meta
      </button>
    </div>

    <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }`}</style>
  </div>
)}

      <div style={{ marginTop: 14 }}>
        {tab === "metas" && (
          <>
            <p style={{ padding: "0 16px 12px", fontSize: ".82rem", color: "var(--gray-text)", lineHeight: 1.5 }}>
              Metas recomendadas para tu negocio. Algunas suman puntos a tu programa de lealtad Tuali. ⭐
            </p>
            {goals.map(g => (
              <div className="goal-card" key={g.id}>
                <div className="goal-card-head">
                  <div className="goal-icon-wrap" style={{ background: g.color }}>
                    <span dangerouslySetInnerHTML={{ __html: GoalIconSVG({ type: g.type }) }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="goal-title">{g.title}</p>
                    <p className="goal-desc">{g.desc}</p>
                    {g.loyaltyMsg && (
                      <div className="mt8">
                        <span className="chip chip-gold">⭐ {g.loyaltyMsg}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="goal-progress-section">
                  <div className="goal-progress-label">
                    <span>
                      {g.unit === "$" ? `$${g.current.toLocaleString()} de $${g.target.toLocaleString()}` : `${g.current}% de ${g.target}%`}
                    </span>
                    <span>{Math.round((g.current / g.target) * 100)}% completado</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((g.current / g.target) * 100))}%` }} />
                  </div>
                </div>
                <button className="goal-btn" onClick={() => setSelected(g)}>
                  Ver detalle →
                </button>
              </div>
            ))}

            {/* Barra de meta personalizada */}
            <div style={{ margin: "20px 16px 8px" }}>
              <p style={{ fontSize: ".78rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>
                Crea tu propia meta
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  rows={2}
                  placeholder="Ej: Quiero vender $5,000 más esta quincena enfocándome en bebidas..."
                  value={customGoalText}
                  onChange={e => setCustomGoalText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCustomGoalSubmit(); } }}
                  style={{
                    flex: 1, padding: "12px 14px", border: "1.5px solid #E5E7EB",
                    borderRadius: 14, fontSize: ".88rem", color: "#111827",
                    resize: "none", outline: "none", lineHeight: 1.5,
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={handleCustomGoalSubmit}
                  disabled={!customGoalText.trim()}
                  style={{
                    width: 44, height: 44, borderRadius: 99, flexShrink: 0,
                    background: customGoalText.trim() ? "#E0281A" : "#E5E7EB",
                    color: customGoalText.trim() ? "white" : "#9CA3AF",
                    border: "none", cursor: customGoalText.trim() ? "pointer" : "default",
                    fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background .2s",
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "seguimiento" && (
          <>
            <p style={{ padding: "0 16px 12px", fontSize: ".82rem", color: "var(--gray-text)" }}>
              Toca una meta para ver el análisis completo y chatear con el agente.
            </p>
            {goals.map(g => {
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              return (
                <div
                  key={g.id}
                  className="inv-row"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(g)}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: "var(--r-sm)", background: g.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.4rem", flexShrink: 0,
                  }}>
                    <span dangerouslySetInnerHTML={{ __html: GoalIconSVG({ type: g.type }) }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="inv-name">{g.title}</p>
                    <div className="progress-bar mt8" style={{ height: 6 }}>
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: pct >= 70 ? "var(--green)" : pct >= 40 ? "var(--gold)" : "var(--red)",
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: ".74rem", color: "var(--gray-text)" }}>
                      <span>{g.trend}</span>
                      <span style={{ fontWeight: 700, color: "var(--black)" }}>{pct}%</span>
                    </div>
                  </div>
                  <span style={{ color: "var(--gray-text)", fontSize: "1.1rem", marginLeft: 4 }}>›</span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
