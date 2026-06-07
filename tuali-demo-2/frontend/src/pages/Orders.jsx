import React from "react";
export default function Orders() {
  return (
    <>
      <div className="topbar">
        <div className="topbar-row">
          <div><p className="topbar-store">Punto de venta</p><p className="topbar-name">Pedidos <span className="chevron">▼</span></p></div>
        </div>
      </div>
      <div className="order-chip" style={{ cursor: "pointer" }}>
        <div className="order-icon">✓</div>
        <div><p className="order-label">Pedido</p>
          <div className="order-row"><span className="order-num">#3000010763</span><span className="order-badge">Confirmado</span></div>
        </div>
      </div>
      <p className="empty-msg" style={{ marginTop: 32 }}>Historial de pedidos próximamente.</p>
    </>
  );
}
