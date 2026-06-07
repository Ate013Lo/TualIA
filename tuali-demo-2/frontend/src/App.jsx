import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Dashboard  from "./pages/Dashboard";
import Products   from "./pages/Products";
import Goals      from "./pages/Goals";
import Orders     from "./pages/Orders";
import Menu       from "./pages/Menu";
import CheckInModal from "./components/CheckInModal";

const HomeIcon   = ({active}) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={active?"#E0281A":"#9CA3AF"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><rect x="8" y="13" width="6" height="7" rx="1"/></svg>;
const GridIcon   = ({active}) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={active?"#E0281A":"#9CA3AF"} strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="13" y="3" width="6" height="6" rx="1"/><rect x="3" y="13" width="6" height="6" rx="1"/><rect x="13" y="13" width="6" height="6" rx="1"/></svg>;
const StarIcon   = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#E0281A" stroke="#E0281A" strokeWidth="1.2"><path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9z"/></svg>;
const ClipIcon   = ({active}) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={active?"#E0281A":"#9CA3AF"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="14" height="18" rx="2"/><path d="M8 2v3h6V2"/><path d="M8 10h6M8 14h4"/></svg>;
const TargetIcon = ({active}) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={active?"#E0281A":"#9CA3AF"} strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><circle cx="11" cy="11" r="4"/><circle cx="11" cy="11" r="1" fill={active?"#E0281A":"#9CA3AF"}/></svg>;
const MenuIcon   = ({active}) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={active?"#E0281A":"#9CA3AF"} strokeWidth="1.7" strokeLinecap="round"><line x1="3" y1="6" x2="19" y2="6"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="16" x2="19" y2="16"/></svg>;

const NAV = [
  { path: "/",        Icon: HomeIcon,   label: "Inicio"    },
  { path: "/products",Icon: GridIcon,   label: "Productos" },
  { path: "/gana",    Icon: StarIcon,   label: "Gana", isStar: true },
  { path: "/orders",  Icon: ClipIcon,   label: "Pedidos"   },
  { path: "/goals",   Icon: TargetIcon, label: "Metas"     },
  { path: "/menu",    Icon: MenuIcon,   label: "Menú"      },
];

function shouldShowCheckin() {
  const last = localStorage.getItem("tuali_checkin_date");
  if (!last) return true;
  return (Date.now() - Number(last)) / (1000*60*60*24) >= 7;
}

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showCheckin, setShowCheckin] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { if (shouldShowCheckin()) setShowCheckin(true); }, 1200);
    return () => clearTimeout(t);
  }, []);

  const dismissCheckin = () => {
    localStorage.setItem("tuali_checkin_date", String(Date.now()));
    setShowCheckin(false);
  };

  return (
    <>
      <div className="page">
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/products" element={<Products />}  />
          <Route path="/gana"     element={<Dashboard />} />
          <Route path="/orders"   element={<Orders />}    />
          <Route path="/goals"    element={<Goals />}     />
          <Route path="/menu"     element={<Menu />}      />
        </Routes>
      </div>

      {showCheckin && <CheckInModal onDismiss={dismissCheckin} />}

      <nav className="bottom-nav">
        {NAV.map(({ path, Icon, label, isStar }) => {
          const active = pathname === path;
          return (
            <button key={path}
              className={`nav-btn${active ? " active" : ""}${isStar ? " gana-btn" : ""}`}
              onClick={() => navigate(path)}
              aria-label={label}
            >
              <span className="nav-icon"><Icon active={active} /></span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
