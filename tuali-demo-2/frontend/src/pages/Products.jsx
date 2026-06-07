import React, { useEffect, useState } from "react";
import { getInventory, restock, getPurchaseHistory } from "../lib/api";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function generateDoc(rows, month, year) {
  const monthName = MONTHS[month - 1];
  const total      = rows.reduce((s, r) => s + r.total, 0);
  const totalUnits = rows.reduce((s, r) => s + r.units, 0);

  const byProduct = {};
  rows.forEach(r => {
    if (!byProduct[r.productName]) byProduct[r.productName] = { units: 0, total: 0, orders: 0, price: r.pricePerUnit };
    byProduct[r.productName].units  += r.units;
    byProduct[r.productName].total  += r.total;
    byProduct[r.productName].orders += 1;
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Compras ${monthName} ${year}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827;background:#F9FAFB;padding:16px;}
    .card{background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);}
    .header-brand{display:flex;align-items:center;gap:10px;margin-bottom:4px;}
    .dot{width:36px;height:36px;background:#E0281A;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .brand-name{font-size:20px;font-weight:800;color:#E0281A;}
    .doc-sub{font-size:13px;color:#6B7280;}
    .meta{font-size:12px;color:#6B7280;margin-top:8px;line-height:1.6;}
    .divider{height:2px;background:#E0281A;border-radius:2px;margin:12px 0;}
    .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px;}
    .stat{background:#F3F4F6;border-radius:12px;padding:12px 8px;text-align:center;}
    .stat-val{font-size:20px;font-weight:800;color:#111827;}
    .stat-val.red{color:#E0281A;}
    .stat-lbl{font-size:10px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.4px;margin-top:2px;}
    .section{font-size:13px;font-weight:700;color:#374151;margin:4px 0 10px;text-transform:uppercase;letter-spacing:.4px;}
    .row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F3F4F6;}
    .row:last-child{border-bottom:none;}
    .row-name{font-size:14px;font-weight:600;color:#111827;flex:1;}
    .row-right{text-align:right;flex-shrink:0;}
    .row-val{font-size:14px;font-weight:700;color:#111827;}
    .row-sub{font-size:11px;color:#6B7280;margin-top:1px;}
    .total-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0 0;border-top:2px solid #E5E7EB;margin-top:4px;}
    .total-lbl{font-size:14px;font-weight:700;color:#111827;}
    .total-val{font-size:18px;font-weight:800;color:#E0281A;}
    .detail-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #F3F4F6;}
    .detail-row:last-child{border-bottom:none;}
    .detail-name{font-size:13px;font-weight:600;color:#111827;}
    .detail-date{font-size:11px;color:#9CA3AF;margin-top:1px;}
    .detail-right{text-align:right;flex-shrink:0;}
    .detail-val{font-size:13px;font-weight:700;color:#111827;}
    .detail-units{font-size:11px;color:#6B7280;}
    .empty{text-align:center;padding:24px;color:#9CA3AF;font-size:13px;}
    .footer{text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px;padding-bottom:24px;}
  </style>
</head>
<body>
  <div class="card">
    <div class="header-brand">
      <div class="dot"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
      <div>
        <div class="brand-name">Tuali</div>
        <div class="doc-sub">Resumen de compras mensual</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="meta">
      <strong>${monthName} ${year}</strong> · Abarrotes El Recreo<br/>
      Generado: ${new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"})}
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-val red">$${total.toLocaleString("es-MX",{minimumFractionDigits:2})}</div><div class="stat-lbl">Invertido</div></div>
    <div class="stat"><div class="stat-val">${totalUnits}</div><div class="stat-lbl">Unidades</div></div>
    <div class="stat"><div class="stat-val">${rows.length}</div><div class="stat-lbl">Órdenes</div></div>
  </div>

  <div class="card" style="margin-top:12px;">
    <div class="section">Por producto</div>
    ${Object.entries(byProduct).map(([name, d]) => `
    <div class="row">
      <div class="row-name">${name}</div>
      <div class="row-right">
        <div class="row-val">$${d.total.toLocaleString("es-MX",{minimumFractionDigits:2})}</div>
        <div class="row-sub">${d.units} uds · ${d.orders} orden${d.orders>1?"es":""}</div>
      </div>
    </div>`).join("")}
    <div class="total-row">
      <div class="total-lbl">Total</div>
      <div class="total-val">$${total.toLocaleString("es-MX",{minimumFractionDigits:2})}</div>
    </div>
  </div>

  <div class="card">
    <div class="section">Detalle de compras</div>
    ${rows.length === 0
      ? `<div class="empty">No se registraron compras este mes.</div>`
      : rows.map(r => `
    <div class="detail-row">
      <div>
        <div class="detail-name">${r.productName}</div>
        <div class="detail-date">${new Date(r.date).toLocaleDateString("es-MX",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
      </div>
      <div class="detail-right">
        <div class="detail-val">$${r.total.toLocaleString("es-MX",{minimumFractionDigits:2})}</div>
        <div class="detail-units">${r.units} uds</div>
      </div>
    </div>`).join("")}
  </div>

  <div class="footer">Tuali · ${monthName} ${year}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `compras-${monthName.toLowerCase()}-${year}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Products() {
  const [items, setItems]       = useState([]);
  const [qty, setQty]           = useState({});
  const [loading, setLoading]   = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [done, setDone]         = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  const handleResumen = async () => {
    setGenLoading(true);
    const now = new Date();
    try {
      const rows = await getPurchaseHistory(now.getMonth() + 1, now.getFullYear());
      generateDoc(rows, now.getMonth() + 1, now.getFullYear());
    } catch { /* ignore */ }
    setGenLoading(false);
  };

  useEffect(() => {
    getInventory()
      .then(data => {
        setItems(data);
        const init = {};
        data.forEach(p => { init[p.id] = 0; });
        setQty(init);
      })
      .finally(() => setLoading(false));
  }, []);

  const change = (id, delta) => {
    setQty(q => ({ ...q, [id]: Math.max(0, (q[id] || 0) + delta) }));
  };

  const total = Object.values(qty).reduce((s, v) => s + v, 0);

  const handleOrder = async () => {
    const lineas = items.filter(p => qty[p.id] > 0);
    if (!lineas.length) return;
    setOrdering(true);
    try {
      await Promise.all(lineas.map(p => restock(p.id, qty[p.id])));
      const fresh = await getInventory();
      setItems(fresh);
      const reset = {};
      fresh.forEach(p => { reset[p.id] = 0; });
      setQty(reset);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch { /* ignore */ }
    setOrdering(false);
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-row">
          <div>
            <p className="topbar-store">Punto de venta</p>
            <p className="topbar-name">Productos <span className="chevron">▼</span></p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleResumen}
              disabled={genLoading}
              title="Resumen mensual"
              style={{
                background: "#F3F4F6", border: "none", borderRadius: 99,
                width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {genLoading
                ? <span style={{ fontSize: 13 }}>⏳</span>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
              }
            </button>
            <button className="topbar-cart">🛒</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px 120px" }}>
        {loading ? (
          <p style={{ color: "#6B7280", fontSize: ".88rem", textAlign: "center", marginTop: 32 }}>
            Cargando productos…
          </p>
        ) : items.map(item => {
          const q      = qty[item.id] || 0;
          const isOut  = item.unitsRemaining === 0;
          const isRisk = item.unitsRemaining < 10;
          return (
            <div key={item.id} style={{
              background: "#fff", border: "1px solid #F3F4F6",
              borderRadius: 16, padding: "14px 16px", marginBottom: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,.05)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              {/* Ícono */}
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E0281A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: ".9rem", color: "#111827", marginBottom: 3 }}>
                  {item.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{
                    fontSize: ".8rem", fontWeight: 600,
                    color: isOut ? "#9CA3AF" : isRisk ? "#E0281A" : "#6B7280",
                  }}>
                    {isOut ? "Sin stock" : `${item.unitsRemaining} uds`}
                  </p>
                  {isRisk && (
                    <span style={{
                      fontSize: ".68rem", fontWeight: 600, padding: "1px 6px",
                      background: "#FEF9C3", color: "#A16207", borderRadius: 99,
                    }}>
                      ⚠ {isOut ? "Agotado" : "Riesgo"}
                    </span>
                  )}
                </div>
              </div>

              {/* Selector +/- */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => change(item.id, -1)}
                  disabled={q === 0}
                  style={{
                    width: 32, height: 32, borderRadius: 99,
                    background: q === 0 ? "#F3F4F6" : "#FEF2F2",
                    color: q === 0 ? "#D1D5DB" : "#E0281A",
                    border: "none", fontSize: "1.2rem", fontWeight: 700,
                    cursor: q === 0 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >−</button>
                <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700, fontSize: ".95rem", color: "#111827" }}>
                  {q}
                </span>
                <button
                  onClick={() => change(item.id, 1)}
                  style={{
                    width: 32, height: 32, borderRadius: 99,
                    background: "#E0281A", color: "white",
                    border: "none", fontSize: "1.2rem", fontWeight: 700,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón fijo abajo */}
      <div style={{
        position: "fixed", bottom: 64, left: 0, right: 0,
        padding: "12px 16px", background: "white",
        boxShadow: "0 -2px 12px rgba(0,0,0,.08)",
      }}>
        {done ? (
          <div style={{
            background: "#F0FDF4", border: "1px solid #86EFAC",
            borderRadius: 99, padding: "14px", textAlign: "center",
            fontWeight: 700, color: "#16A34A", fontSize: ".95rem",
          }}>
            ✓ Pedido aplicado al inventario
          </div>
        ) : (
          <button
            onClick={handleOrder}
            disabled={total === 0 || ordering}
            style={{
              width: "100%", padding: 14, borderRadius: 99,
              background: total === 0 ? "#E5E7EB" : "#E0281A",
              color: total === 0 ? "#9CA3AF" : "white",
              border: "none", fontWeight: 700, fontSize: ".95rem",
              cursor: total === 0 ? "default" : "pointer",
            }}
          >
            {ordering ? "Aplicando pedido…" : total === 0 ? "Selecciona unidades a pedir" : `Hacer pedido · ${total} uds`}
          </button>
        )}
      </div>
    </>
  );
}
