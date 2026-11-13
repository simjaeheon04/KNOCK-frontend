import { NavLink, Link, useLocation } from "react-router-dom";
import {
  DoorOpen,
  House,
  Flag,
  NotebookPen,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useKnock } from "../context/KnockContext";
const links = [
  { to: "/home", label: "홈", icon: House },
  { to: "/missions", label: "현실 미션", icon: Flag },
  { to: "/records", label: "내 기록", icon: NotebookPen },
];
export default function Layout({ children }) {
  const location = useLocation();
  const main = useRef();
  const { notice, setNotice, storageError, dismissNotification } = useKnock();
  useEffect(() => {
    window.scrollTo(0, 0);
    main.current?.focus();
  }, [location.pathname]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      <aside className="sidebar">
        <Link to="/home" className="brand">
          <span className="brand-symbol">
            <DoorOpen size={25} strokeWidth={1.5} />
          </span>
          <span>
            KNOCK<small>나만의 작은 대화</small>
          </span>
        </Link>
        <nav aria-label="주요 메뉴">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              <Icon size={20} />
              {label}
              <ArrowUpRight size={15} className="nav-arrow" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="little-line" />
          <p>
            하루 한 번,
            <br />
            작은 대화의 문을 열어요.
          </p>
          <Link to="/safety">
            <ShieldCheck size={15} /> 안전 안내
          </Link>
          <span className="demo-badge">프론트엔드 데모</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link to="/home" className="mobile-brand">
            <DoorOpen size={21} /> KNOCK
          </Link>
          <span className="topbar-caption">작은 용기가 새로운 대화로</span>
          <Link to="/records/settings" className="topbar-privacy">
            <ShieldCheck size={15} />
            <span>내 기록은 내가 선택해요</span>
          </Link>
        </header>
        <main id="main" tabIndex={-1} ref={main}>
          {children}
        </main>
        <footer className="site-footer">
          <span>KNOCK · 노크</span>
          <span>나만의 속도로 한 문장부터</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="모바일 주요 메뉴">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {(notice || storageError) && (
        <div className="toast" role={storageError ? "alert" : "status"}>
          {storageError || notice}
          <button onClick={dismissNotification} aria-label="알림 닫기">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
