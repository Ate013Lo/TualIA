import React, { useState } from "react";
import { checkIn } from "../lib/api";
import { ProductSVG } from "../lib/productImages";

const MOCK_PRODUCTS = [
  { id: "inv-001", name: "Coca-Cola 500ml", qty: 30, unitLabel: "5 paquetes de 6 latas", svg: ProductSVG.coca },
  { id: "inv-002", name: "Sabritas Adobadas 150g", qty: 20, unitLabel: "20 bolsas", svg: ProductSVG.sabritas },
  { id: "inv-003", name: "Agua Ciel 600ml", qty: 48, unitLabel: "2 paquetes de 24 piezas", svg: ProductSVG.agua },
  { id: "inv-004", name: "Agua Ciel 1L", qty: 48, unitLabel: "2 paquetes de 24 piezas", svg: ProductSVG.aguaL },
  { id: "inv-005", name: "Jumex Durazno 355ml", qty: 48, unitLabel: "8 paquetes de 6 piezas", svg: ProductSVG.jumex },
  { id: "inv-006", name: "Jumex Manzana 355ml", qty: 48, unitLabel: "8 paquetes de 6 piezas", svg: ProductSVG.jumexManzana },
  { id: "inv-007", name: "Fanta 700 ml", qty: 48, unitLabel: "8 paquetes de 6 piezas", svg: ProductSVG.fanta },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7l3.5 3.5 6.5-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 2l10 10M12 2L2 12" stroke="#374151" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export default function CheckInModal({ onDismiss }) {
  const [step, setStep]     = useState(0);
  const [phase, setPhase]   = useState("ask");
  const [qty, setQty]       = useState("");
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);

  const product = MOCK_PRODUCTS[step];
  const total   = MOCK_PRODUCTS.length;

  const handleYes = async () => {
    setSaving(true);
    try { await checkIn(product.id, product.qty); } catch {}
    setSaving(false);
    setResults(r => [...r, { ...product, sold: product.qty, st: 100 }]);
    advance();
  };

  const handleQtySubmit = async () => {
    const n = Number(qty);
    if (isNaN(n) || n < 0) return;
    setSaving(true);
    try { await checkIn(product.id, n); } catch {}
    setSaving(false);
    const st = Math.round((n / product.qty) * 100);
    setResults(r => [...r, { ...product, sold: n, st }]);
    setQty(""); setPhase("ask");
    advance();
  };

  const advance = () => {
    if (step + 1 >= total) setPhase("done");
    else { setStep(s => s + 1); setPhase("ask"); }
  };

  if (phase === "done") {
    return (
      <div className="modal-overlay" onClick={onDismiss}>
        <div className="modal-sheet" onClick={e => e.stopPropagation()}>
          <div className="modal-handle" />
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ display: "block", margin: "0 auto" }} aria-hidden="true">
              <circle cx="26" cy="26" r="24" fill="#D1FAE5" stroke="#34D399" strokeWidth="2"/>
              <path d="M15 26l7 7 15-15" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="modal-title">¡Check-in completado!</p>
          <p className="modal-subtitle">El agente analizó tu inventario.</p>
          <div style={{ margin: "12px 0 18px" }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: ".88rem", fontWeight: 600, color: "#111827" }}>{r.name}</span>
                <span style={{ fontSize: ".82rem", fontWeight: 700, color: r.st >= 70 ? "#10B981" : r.st >= 40 ? "#F59E0B" : "#E0281A" }}>
                  {r.st}% vendido
                </span>
              </div>
            ))}
          </div>
          <button className="modal-btn modal-btn-red" style={{ width: "100%", borderRadius: 99, padding: 13 }} onClick={onDismiss}>
            Ver recomendaciones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: ".78rem", fontWeight: 700, color: "#6B7280" }}>Check-in semanal</span>
          <span style={{ fontSize: ".78rem", color: "#6B7280" }}>{step + 1} / {total}</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 18 }}>
          <div className="progress-fill" style={{ width: `${(step / total) * 100}%` }} />
        </div>

        <div style={{ width: 80, height: 90, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}
          dangerouslySetInnerHTML={{ __html: product.svg }} />

        <p className="modal-title">{product.name}</p>

        {phase === "ask" && (
          <>
            <p className="modal-subtitle">
              Compraste <strong>{product.unitLabel}</strong> hace 7 días.<br/>¿Ya los vendiste todos?
            </p>
            <div className="modal-btns">
              <button className="modal-btn modal-btn-yes" onClick={handleYes} disabled={saving}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CheckIcon /> Sí, todo
              </button>
              <button className="modal-btn modal-btn-no" onClick={() => setPhase("howmany")} disabled={saving}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <XIcon /> No
              </button>
            </div>
          </>
        )}

        {phase === "howmany" && (
          <>
            <p className="modal-subtitle">¿Cuántos has vendido hasta ahora?</p>
            <input
              className="modal-qty-input"
              type="number" min="0" max={product.qty}
              placeholder={`0 – ${product.qty}`}
              value={qty}
              onChange={e => setQty(e.target.value)}
              autoFocus
            />
            <div className="modal-btns" style={{ marginTop: 12 }}>
              <button className="modal-btn modal-btn-red" onClick={handleQtySubmit} disabled={saving || qty === ""}
                style={{ flex: 1, borderRadius: 99 }}>
                {saving ? "Guardando…" : "Registrar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
