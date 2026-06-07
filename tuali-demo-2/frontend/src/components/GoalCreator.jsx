import React, { useState } from "react";
import { validateGoal, setGoal } from "../lib/api";

const GOAL_TYPES = [
  { type: "reduce_waste",    label: "Reducir merma",         desc: "Mejorar el sell-through de mis productos" },
  { type: "increase_sales",  label: "Aumentar ventas",       desc: "Incrementar mi revenue este mes" },
  { type: "increase_ticket", label: "Subir ticket promedio", desc: "Que cada cliente compre más por visita" },
  { type: "optimize_orders", label: "Optimizar pedidos",     desc: "Pedir lo justo, sin sobre-stock" },
];

const DURATION_OPTIONS = [
  { label: "1 semana",   days: "7",  desc: "Reto rápido con impacto inmediato" },
  { label: "2 semanas",  days: "14", desc: "Plazo equilibrado para ver resultados" },
  { label: "1 mes",      days: "30", desc: "Meta sólida con tiempo para ajustar" },
];

export default function GoalCreator({ onDone, onCancel, initialText = null, initialType = null }) {
  const [step, setStep]           = useState(initialText ? "duration" : "type");
  const [selectedType, setType]   = useState(() => {
    if (initialType) {
      const found = GOAL_TYPES.find(t => t.type === initialType);
      return found || { type: initialType, label: "Meta personalizada" };
    }
    if (initialText) return { type: "custom", label: "Meta personalizada" };
    return null;
  });
  const [goalText, setGoalText]   = useState(initialText || "");
  const [targetValue, setTarget]  = useState("");
  const [days, setDays]           = useState("30");
  const [validation, setValid]    = useState(null);
  const [saving, setSaving]       = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleSelectType = (t) => {
    setType(t);
    setStep("detail");
  };

  const handleValidate = async (overrideText, overrideDays) => {
    setSaving(true);
    setStep("validating");
    try {
      const text = overrideText || goalText;
      const d    = overrideDays  || days;
      const proposal = targetValue
        ? `${selectedType?.label || "Meta"}: ${text}. Objetivo: ${targetValue}, plazo: ${d} días`
        : `${text}. Plazo: ${d} días`;
      const result = await validateGoal(proposal);
      setValid(result);
      setStep("confirm");
    } catch {
      setValid({ isRealistic: true, message: "Meta registrada. ¡A darle!" });
      setStep("confirm");
    }
    setSaving(false);
  };

  const handleConfirm = async () => {
    setSaving(true);
    const finalTarget = validation?.suggestedGoal?.value || Number(targetValue) || 100;
    const goalData = {
      type:  selectedType?.type  || "custom",
      label: validation?.suggestedGoal?.label || selectedType?.label || "Meta personalizada",
      target: finalTarget,
      current: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + Number(days) * 86400000).toISOString(),
      weeklyMilestones: (validation?.weeklyMilestones || []).length > 0
        ? validation.weeklyMilestones.map(m => ({ ...m, achieved: null, done: false }))
        : [
            { week: 1, target: Math.round(finalTarget * 0.25), achieved: null, done: false },
            { week: 2, target: Math.round(finalTarget * 0.50), achieved: null, done: false },
            { week: 3, target: Math.round(finalTarget * 0.75), achieved: null, done: false },
            { week: 4, target: finalTarget,                    achieved: null, done: false },
          ],
      weeklyActions: [
        { id: "a1", text: "Registrar inventario completo",       done: false, impact: "+15%" },
        { id: "a2", text: "Completar primer check-in",            done: false, impact: "+10%" },
        { id: "a3", text: "Activar 1 recomendación del agente",  done: false, impact: "+20%" },
      ],
    };
    await setGoal(goalData);
    setSaving(false);
    setStep("done");
    setTimeout(() => onDone(goalData), 1500);
  };

  // ── Pantalla: elegir tipo ─────────────────────────────
  if (step === "type") return (
    <div style={styles.overlay}>
      <div style={styles.sheet}>
        <div style={styles.handle} />
        <p style={styles.title}>¿Qué quieres lograr?</p>
        <p style={styles.sub}>El agente validará que sea alcanzable.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          {GOAL_TYPES.map(t => (
            <button key={t.type} style={styles.typeBtn} onClick={() => handleSelectType(t)}>
              <p style={{ fontWeight: 700, fontSize: ".92rem", color: "#111827", marginBottom: 2 }}>{t.label}</p>
              <p style={{ fontSize: ".78rem", color: "#6B7280" }}>{t.desc}</p>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: ".78rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
            O crea tu propia meta
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              rows={2}
              placeholder="Ej: Quiero vender $5,000 más esta quincena..."
              value={goalText}
              onChange={e => setGoalText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && goalText.trim()) {
                  e.preventDefault();
                  setType({ type: "custom", label: "Meta personalizada" });
                  setStep("duration");
                }
              }}
              style={{
                flex: 1, padding: "12px 14px",
                border: "1.5px solid #E5E7EB", borderRadius: 14,
                fontSize: ".88rem", color: "#111827",
                resize: "none", outline: "none", lineHeight: 1.5,
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => {
                if (!goalText.trim()) return;
                setType({ type: "custom", label: "Meta personalizada" });
                setStep("duration");
              }}
              disabled={!goalText.trim()}
              style={{
                width: 44, height: 44, borderRadius: 99, flexShrink: 0,
                background: goalText.trim() ? "#E0281A" : "#E5E7EB",
                color: goalText.trim() ? "white" : "#9CA3AF",
                border: "none", cursor: goalText.trim() ? "pointer" : "default",
                fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .2s",
              }}
            >→</button>
          </div>
        </div>

        <button style={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );

  // ── Pantalla: detalle (tipo seleccionado desde botones) ──
  if (step === "detail") return (
    <div style={styles.overlay}>
      <div style={styles.sheet}>
        <div style={styles.handle} />
        <p style={styles.title}>{selectedType.label}</p>
        <p style={styles.sub}>Describe tu meta y el agente la validará.</p>

        <label style={styles.label}>¿Qué quieres lograr? (con tus palabras)</label>
        <textarea
          style={{ ...styles.input, resize: "none", height: 80, lineHeight: 1.5 }}
          placeholder={
            selectedType.type === "increase_sales"  ? "Ej: Quiero vender $3,000 más esta quincena enfocándome en bebidas" :
            selectedType.type === "increase_ticket" ? "Ej: Quiero que cada cliente gaste al menos $55 por visita" :
            selectedType.type === "reduce_waste"    ? "Ej: Quiero reducir mi merma de lácteos al 80% de sell-through" :
            "Ej: Quiero ordenar solo lo que necesito y evitar sobre-stock en abarrotes"
          }
          value={goalText}
          onChange={e => setGoalText(e.target.value)}
        />

        <label style={{ ...styles.label, marginTop: 14 }}>
          {selectedType.type === "increase_sales"  ? "¿Cuántos pesos más quieres vender?" :
           selectedType.type === "increase_ticket" ? "¿A qué ticket promedio quieres llegar ($)?" :
           selectedType.type === "reduce_waste"    ? "¿A qué % de sell-through quieres llegar?" :
           "¿Qué % de pedidos sin sobre-stock quieres?"}
        </label>
        <input
          style={styles.input}
          type="number"
          placeholder={selectedType.type === "increase_sales" ? "Ej: 3000" : selectedType.type === "increase_ticket" ? "Ej: 55" : "Ej: 80"}
          value={targetValue}
          onChange={e => setTarget(e.target.value)}
        />

        <label style={{ ...styles.label, marginTop: 18 }}>¿En cuánto tiempo?</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
          {DURATION_OPTIONS.map(opt => (
            <button key={opt.days} onClick={() => setDays(opt.days)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                background: days === opt.days ? "#FEF2F2" : "#F9FAFB",
                border: `1.5px solid ${days === opt.days ? "#E0281A" : "#E5E7EB"}`,
              }}>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontWeight: 700, fontSize: ".9rem", color: days === opt.days ? "#E0281A" : "#111827" }}>{opt.label}</p>
                <p style={{ fontSize: ".74rem", color: "#6B7280", marginTop: 1 }}>{opt.desc}</p>
              </div>
              {days === opt.days && <span style={{ color: "#E0281A", fontSize: "1.1rem" }}>✓</span>}
            </button>
          ))}
        </div>

        <button
          style={{ ...styles.confirmBtn, marginTop: 20, opacity: (!goalText && !targetValue) ? .5 : 1 }}
          onClick={() => handleValidate()}
          disabled={(!goalText && !targetValue) || saving}
        >
          Validar con el agente →
        </button>
        <button style={styles.cancelBtn} onClick={() => setStep("type")}>← Volver</button>
      </div>
    </div>
  );

  // ── Pantalla: elegir duración (viene de sugerencia) ───
  if (step === "duration") return (
    <div style={styles.overlay}>
      <div style={styles.sheet}>
        <div style={styles.handle} />
        <p style={styles.title}>¿En cuánto tiempo?</p>
        <div style={{
          background: "#F9FAFB", border: "1px solid #E5E7EB",
          borderRadius: 10, padding: "10px 14px", marginTop: 10, marginBottom: 20,
        }}>
          <p style={{ fontSize: ".78rem", color: "#6B7280", marginBottom: 2 }}>Tu meta</p>
          <p style={{ fontSize: ".86rem", color: "#111827", fontWeight: 600, lineHeight: 1.4 }}>
            {goalText.length > 80 ? goalText.slice(0, 80) + "…" : goalText}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => { setDays(opt.days); handleValidate(goalText, opt.days); }}
              style={styles.typeBtn}
            >
              <p style={{ fontWeight: 700, fontSize: ".95rem", color: "#111827", marginBottom: 2 }}>{opt.label}</p>
              <p style={{ fontSize: ".78rem", color: "#6B7280" }}>{opt.desc}</p>
            </button>
          ))}
        </div>

        <button style={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );

  // ── Pantalla: validando ───────────────────────────────
  if (step === "validating") return (
    <div style={styles.overlay}>
      <div style={styles.sheet}>
        <div style={styles.handle} />
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>El agente está analizando…</p>
          <p style={{ fontSize: ".84rem", color: "#6B7280", marginTop: 6 }}>Revisa tu historial de ventas y contexto</p>
        </div>
      </div>
    </div>
  );

  // ── Pantalla: confirmar ───────────────────────────────
  const needsMoreInfo = !validation?.suggestedGoal;
  const durationLabel = DURATION_OPTIONS.find(o => o.days === days)?.label || `${days} días`;

  if (step === "confirm") return (
    <div style={styles.overlay}>
      <div style={styles.sheet}>
        <div style={styles.handle} />
        <p style={styles.title}>{needsMoreInfo ? "El agente necesita más info" : "Resultado del agente"}</p>

        <div style={{
          background: needsMoreInfo ? "#EFF6FF" : validation?.isRealistic ? "#F0FDF4" : "#FFFBEB",
          border: `1px solid ${needsMoreInfo ? "#BFDBFE" : validation?.isRealistic ? "#86EFAC" : "#FDE68A"}`,
          borderRadius: 12, padding: "14px", marginBottom: 16, marginTop: 12,
        }}>
          <p style={{ fontSize: ".88rem", color: "#111827", lineHeight: 1.6 }}>
            {validation?.message || "Meta validada. ¡Adelante!"}
          </p>
        </div>

        {needsMoreInfo ? (
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                rows={2}
                autoFocus
                placeholder="Ej: quiero vender $2,000 más en 30 días..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && replyText.trim()) {
                    e.preventDefault();
                    const combined = `${goalText} — aclaración: ${replyText.trim()}`;
                    setGoalText(combined);
                    setReplyText("");
                    handleValidate(combined);
                  }
                }}
                style={{
                  flex: 1, padding: "12px 14px",
                  border: "1.5px solid #E5E7EB", borderRadius: 14,
                  fontSize: ".88rem", color: "#111827",
                  resize: "none", outline: "none", lineHeight: 1.5,
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={() => {
                  if (!replyText.trim()) return;
                  const combined = `${goalText} — aclaración: ${replyText.trim()}`;
                  setGoalText(combined);
                  setReplyText("");
                  handleValidate(combined);
                }}
                disabled={!replyText.trim()}
                style={{
                  width: 44, height: 44, borderRadius: 99, flexShrink: 0,
                  background: replyText.trim() ? "#E0281A" : "#E5E7EB",
                  color: replyText.trim() ? "white" : "#9CA3AF",
                  border: "none", cursor: replyText.trim() ? "pointer" : "default",
                  fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >→</button>
            </div>
            <button style={{ ...styles.cancelBtn, marginTop: 12 }} onClick={onCancel}>Cancelar</button>
          </>
        ) : (
          <>
            <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: ".82rem", color: "#6B7280" }}>Meta</span>
                <span style={{ fontSize: ".82rem", fontWeight: 700, color: "#111827" }}>{selectedType?.label || "Personalizada"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: ".82rem", color: "#6B7280" }}>Objetivo</span>
                <span style={{ fontSize: ".82rem", fontWeight: 700, color: "#E0281A" }}>
                  {validation?.suggestedGoal?.label || `${validation?.suggestedGoal?.value}`}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: ".82rem", color: "#6B7280" }}>Plazo</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {DURATION_OPTIONS.map(opt => (
                    <button key={opt.days} onClick={() => setDays(opt.days)}
                      style={{
                        padding: "4px 10px", borderRadius: 99, fontSize: ".76rem", fontWeight: 700,
                        background: days === opt.days ? "#E0281A" : "#E5E7EB",
                        color: days === opt.days ? "white" : "#374151",
                        border: "none", cursor: "pointer",
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button style={styles.confirmBtn} onClick={handleConfirm} disabled={saving}>
              {saving ? "Guardando…" : "Confirmar meta ✓"}
            </button>
            <button style={styles.cancelBtn} onClick={() => setStep(initialText ? "duration" : "detail")}>← Ajustar</button>
          </>
        )}
      </div>
    </div>
  );

  // ── Pantalla: éxito ───────────────────────────────────
  if (step === "done") return (
    <div style={styles.overlay}>
      <div style={styles.sheet}>
        <div style={styles.handle} />
        <div style={{ textAlign: "center", padding: "24px 0 16px" }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ display: "block", margin: "0 auto 14px" }}>
            <circle cx="28" cy="28" r="26" fill="#D1FAE5" stroke="#34D399" strokeWidth="2"/>
            <path d="M17 28l8 8 14-16" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827", marginBottom: 6 }}>¡Meta activada!</p>
          <p style={{ fontSize: ".86rem", color: "#6B7280", lineHeight: 1.5 }}>
            El agente ya monitorea tu inventario y te mandará recomendaciones automáticas.
          </p>
        </div>
        <p style={{ fontSize: ".82rem", color: "#6B7280", textAlign: "center", marginTop: 8 }}>Cerrando...</p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,.55)",
    zIndex: 200,
    display: "flex", alignItems: "flex-end",
  },
  sheet: {
    background: "#fff",
    borderRadius: "20px 20px 0 0",
    padding: "20px 18px 36px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  handle: {
    width: 32, height: 4, background: "#E5E7EB",
    borderRadius: 2, margin: "0 auto 18px",
  },
  title: { fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: 4 },
  sub:   { fontSize: ".84rem", color: "#6B7280" },
  label: { fontSize: ".8rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 },
  input: {
    width: "100%", padding: "12px 14px",
    border: "1.5px solid #E5E7EB", borderRadius: 10,
    fontSize: "1rem", fontWeight: 600, outline: "none",
    color: "#111827",
  },
  typeBtn: {
    width: "100%", textAlign: "left",
    background: "#F9FAFB", border: "1px solid #E5E7EB",
    borderRadius: 12, padding: "14px 16px", cursor: "pointer",
  },
  confirmBtn: {
    display: "block", width: "100%",
    background: "#E0281A", color: "white",
    borderRadius: 99, padding: 14,
    fontSize: ".95rem", fontWeight: 700,
    border: "none", cursor: "pointer",
    marginBottom: 10,
  },
  cancelBtn: {
    display: "block", width: "100%",
    background: "none", color: "#6B7280",
    border: "none", fontSize: ".88rem",
    padding: "8px 0", cursor: "pointer",
  },
};
