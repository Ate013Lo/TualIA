import React, { useState } from "react";
import useStore from "../store/useStore";

const WarnIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 2L21 19H1L11 2Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="11" y1="9" x2="11" y2="13" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="11" cy="16" r="0.9" fill="#92400E"/>
  </svg>
);
const BoxIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="2" y="7" width="18" height="13" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/>
    <path d="M2 11h18" stroke="#93C5FD" strokeWidth="1.2"/>
    <path d="M1 7l3-5h14l3 5" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8 7v4" stroke="#93C5FD" strokeWidth="1.2"/><path d="M14 7v4" stroke="#93C5FD" strokeWidth="1.2"/>
  </svg>
);

export default function ProactiveCard({ card }) {
  const { dismissCard, activatePromo } = useStore();
  const [done, setDone] = useState(false);

  if (done) return (
    <div style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", gap: 10, alignItems: "center" }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="8" fill="#D1FAE5" stroke="#34D399" strokeWidth="1.5"/>
        <path d="M5 9l3 3 5-5" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontSize: ".84rem", color: "#065F46", fontWeight: 600 }}>Promo activada — revisa Mis Metas</span>
    </div>
  );

  return (
    <div style={{ background: "#FFFBEB", border: "1.5px solid #F59E0B", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        {card.type === "stock_out" ? <BoxIcon /> : <WarnIcon />}
        <p style={{ fontWeight: 700, fontSize: ".9rem", color: "#111827", flex: 1 }}>{card.title}</p>
      </div>
      <p style={{ fontSize: ".82rem", color: "#6B7280", lineHeight: 1.5, marginBottom: 8 }}>{card.body}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.2"/>
          <path d="M4.5 7h5M7 4.5v5" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <p style={{ fontSize: ".82rem", color: "#5B21B6", fontWeight: 600 }}>{card.suggestion}</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {card.promoId && (
          <button style={{ flex: 1, background: "#E0281A", color: "white", borderRadius: 99, padding: "9px", fontSize: ".84rem", fontWeight: 700, border: "none", cursor: "pointer" }}
            onClick={async () => { await activatePromo(card.id); setDone(true); }}>
            Activar promo
          </button>
        )}
        <button style={{ flex: 1, background: "#F3F4F6", color: "#374151", borderRadius: 99, padding: "9px", fontSize: ".84rem", fontWeight: 600, border: "1px solid #E5E7EB", cursor: "pointer" }}
          onClick={() => dismissCard(card.id)}>
          Ignorar
        </button>
      </div>
    </div>
  );
}
