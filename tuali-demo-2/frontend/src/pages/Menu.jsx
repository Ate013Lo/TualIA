import React from "react";
const ITEMS = ["Mi perfil","Puntos y recompensas","Configuración","Ayuda","Cerrar sesión"];
export default function Menu() {
  return (
    <>
      <div className="topbar"><div className="topbar-row"><p className="topbar-name" style={{ fontSize: "1.1rem" }}>Menú</p></div></div>
      <div style={{ margin: "16px" }}>
        {ITEMS.map(item => (
          <div key={item} style={{ background: "var(--white)", borderRadius: "var(--r)", border: "1px solid var(--gray-line)", padding: "16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".95rem", fontWeight: 500 }}>
            {item} <span style={{ color: "var(--gray-text)" }}>›</span>
          </div>
        ))}
      </div>
    </>
  );
}
