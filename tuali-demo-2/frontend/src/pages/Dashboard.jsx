import React, { useEffect, useState } from "react";
import useStore from "../store/useStore";
import ProactiveCard from "../components/ProactiveCard";
import { ProductSVG } from "../lib/productImages";
import { getInventory } from "../lib/api";

const CATEGORIES = [
  { label: "Pedido Fácil", bg: "#F3F4F6", icon: <svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="none"/><path d="M4 4h3l2 12h12l2-8H8" stroke="#9CA3AF" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="20" r="1.5" fill="#9CA3AF"/><circle cx="19" cy="20" r="1.5" fill="#9CA3AF"/></svg> },
  { label: "Refrescos",    bg: "#FFF0EE", icon: <svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="none"/><rect x="8" y="3" width="12" height="22" rx="5" fill="#FECACA"/><rect x="9" y="4" width="10" height="6" rx="2" fill="#E0281A"/><rect x="9" y="12" width="10" height="11" rx="2" fill="#FEE2E2"/></svg> },
  { label: "Agua",         bg: "#EFF6FF", icon: <svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="none"/><rect x="9" y="3" width="10" height="22" rx="4" fill="#DBEAFE"/><rect x="10" y="4" width="8" height="5" rx="2" fill="#93C5FD"/><rect x="10" y="11" width="8" height="12" rx="1" fill="#EFF6FF"/></svg> },
  { label: "Bebidas",      bg: "#FFF7ED", icon: <svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="none"/><path d="M8 6 L9 22 L19 22 L20 6 Z" fill="#FED7AA"/><path d="M8 6 L20 6" stroke="#F97316" strokeWidth="1.5" fill="none"/><rect x="10" y="10" width="8" height="4" fill="#FEF3C7"/></svg> },
  { label: "Botanas",      bg: "#FDF4FF", icon: <svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="none"/><ellipse cx="14" cy="16" rx="8" ry="5" fill="#E9D5FF"/><ellipse cx="14" cy="14" rx="7" ry="4" fill="#DDD6FE"/><ellipse cx="14" cy="12" rx="6" ry="3" fill="#C4B5FD"/></svg> },
  { label: "Lácteos",      bg: "#F0FDF4", icon: <svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="none"/><rect x="8" y="5" width="12" height="18" rx="3" fill="#BBF7D0"/><rect x="9" y="6" width="10" height="6" rx="2" fill="#6EE7B7"/><rect x="9" y="14" width="10" height="7" rx="1" fill="#D1FAE5"/></svg> },
];

export default function Dashboard() {
  const { cards, fetchAll } = useStore();
  const [showInventory, setShowInventory] = useState(false);
  const [inventory, setInventory]         = useState([]);

  const openInventory = async () => {
    setShowInventory(true);
    try {
      const data = await getInventory();
      setInventory(data);
    } catch { /* backend offline */ }
  };

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="topbar-row">
          <div>
            <p className="topbar-store">Punto de venta</p>
            <p className="topbar-name">
              Abarrotes El Recreo
              <span className="chevron">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="#E0281A" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={openInventory} aria-label="Inventario" style={{
              background: "#F3F4F6", border: "none", borderRadius: 99,
              width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="5" rx="1"/>
                <path d="M2 8h20v13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8z"/>
                <path d="M9 21V12h6v9"/>
              </svg>
            </button>
            <button className="topbar-cart" aria-label="Carrito">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E0281A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="searchbar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input placeholder="Buscar" readOnly />
        </div>
      </div>

      <div className="order-chip">
        <div className="order-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8l3.5 3.5 6.5-7" stroke="#E0281A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="order-label">Pedido</p>
          <div className="order-row">
            <span className="order-num">#3000010763</span>
            <span className="order-badge">Confirmado</span>
          </div>
        </div>
      </div>

      <div className="cats">
        {CATEGORIES.map(c => (
          <div className="cat-item" key={c.label}>
            <div className="cat-img" style={{ background: c.bg }}>{c.icon}</div>
            <span className="cat-label">{c.label}</span>
          </div>
        ))}
      </div>

      {cards.length > 0 && (
        <div style={{ padding: "0 16px 4px" }}>
          {cards.map(c => <ProactiveCard key={c.id} card={c} />)}
        </div>
      )}

      <div className="banner" style={{ margin: "10px 16px" }}>
        <svg width="100%" height="100%" viewBox="0 0 358 120" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="358" height="120" fill="#CC1A0E"/>
          <rect width="180" height="120" fill="#B01507"/>
          <circle cx="260" cy="60" r="70" fill="#D41A0C"/>
          <rect x="210" y="15" width="16" height="90" rx="8" fill="rgba(255,255,255,.12)"/>
          <rect x="232" y="8" width="16" height="104" rx="8" fill="rgba(255,255,255,.15)"/>
          <rect x="254" y="15" width="16" height="90" rx="8" fill="rgba(255,255,255,.12)"/>
          <rect x="276" y="20" width="14" height="80" rx="7" fill="rgba(255,255,255,.1)"/>
          <text x="20" y="46" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="white">Ofertas Coca-Cola</text>
          <text x="20" y="66" fontFamily="Arial" fontSize="13" fill="rgba(255,255,255,.85)">Esta semana</text>
          <rect x="20" y="80" width="72" height="24" rx="12" fill="white"/>
          <text x="56" y="96" fontFamily="Arial" fontSize="11" fontWeight="bold" fill="#CC1A0E" textAnchor="middle">Ver oferta</text>
        </svg>
      </div>
      <div className="banner-dots">
        {[0,1,2].map(i => <span key={i} className={i === 2 ? "active" : ""} />)}
      </div>

      <div className="section-hd">
        <h2>Pedido Fácil</h2>
        <a href="#">Ver todos ›</a>
      </div>

      <div className="product-card">
        <div className="product-img-placeholder" style={{ background: "#F0F9FF", borderRadius: 8 }}>
          <div dangerouslySetInnerHTML={{ __html: ProductSVG.agua }} />
        </div>
        <div className="product-info">
          <p className="product-name">Ciel Agua Purificada, Botella Pet 600 ml, 24 Piezas</p>
          <p className="product-price">$198.00</p>
          <p className="product-unit">Paquetes</p>
          <div className="qty-row">
            <div className="qty-box">0</div>
            <div className="qty-add">+</div>
          </div>
        </div>
      </div>

      <button className="add-pkgs-btn">Agrega 2 Paquetes</button>

      {/* Panel de inventario */}
      {showInventory && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setShowInventory(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} />
          <div style={{
            position: "relative", background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "16px 0 32px", maxHeight: "80vh", overflowY: "auto",
          }}>
            <div style={{ width: 32, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 14px" }}>
              <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#111827" }}>Resumen de inventario</p>
              <button onClick={openInventory} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
              </button>
            </div>

            {inventory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#6B7280", fontSize: ".88rem" }}>
                Cargando inventario…
              </div>
            ) : inventory.map(item => {
              const isOut  = item.unitsRemaining === 0;
              const isRisk = item.unitsRemaining < 10;
              return (
                <div key={item.id} style={{
                  margin: "0 16px 10px", padding: "14px 16px",
                  background: "#fff", border: "1px solid #F3F4F6",
                  borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E0281A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ fontWeight: 600, fontSize: ".9rem", color: "#111827" }}>{item.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {isRisk && (
                        <span style={{
                          fontSize: ".7rem", fontWeight: 600, padding: "2px 7px",
                          background: "#FEF9C3", color: "#A16207", borderRadius: 99,
                        }}>
                          ⚠ {isOut ? "Agotado" : "Riesgo"}
                        </span>
                      )}
                      <p style={{
                        fontWeight: 700, fontSize: ".9rem",
                        color: isOut ? "#9CA3AF" : isRisk ? "#E0281A" : "#111827",
                      }}>
                        {isOut ? "Sin stock" : `${item.unitsRemaining} uds`}
                      </p>
                      
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
