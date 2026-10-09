
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Network,
  Search,
  ShieldAlert,
  TerminalSquare,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/incidents", label: "Incidents", icon: ShieldAlert },
  { to: "/events", label: "Event explorer", icon: Activity },
];

export default function AppLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("/dashboard")}
          aria-label="TraceX home"
        >
          <span className="brand-mark">
            <Network size={20} />
          </span>
          <span className="brand-name">
            Trace<span>X</span>
            <small>THREAT INVESTIGATION</small>
          </span>
        </button>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="side-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Incidents" && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="workspace-label tools-label">
          INVESTIGATION
        </div>

        <nav className="side-nav">
          <NavLink
            to="/detection-engine"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <TerminalSquare size={17} strokeWidth={1.8} />
            <span>Detection engine</span>
            <span className="soon">LIVE</span>
          </NavLink>

          <NavLink
            to="/attack-graph"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <Network size={17} strokeWidth={1.8} />
            <span>Attack graph</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <div className="system-card-top">
              <span className="pulse-dot" />
              System status
            </div>
            <div className="system-status">Monitoring active</div>
            <div className="system-caption">
              Events are being collected
            </div>
          </div>

          <button
            className="nav-link nav-muted"
            onClick={() =>
              window.open(
                "https://github.com",
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            <CircleHelp size={17} />
            <span>Help &amp; resources</span>
          </button>

          <button className="profile-row" onClick={logout}>
            <div className="avatar">TX</div>
            <div className="profile-copy">
              <strong>TraceX Analyst</strong>
              <span>Signed in · Logout</span>
            </div>
            <LogOut size={16} className="profile-logout" />
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">
            <span>TraceX</span>
            <span className="crumb-slash">/</span>
            <strong>Security operations</strong>
          </div>

          <div className="topbar-actions">
            <div className="environment-pill">
              <span className="pulse-dot" />
              LOCAL ENVIRONMENT
            </div>

            <button
              className="icon-button"
              title="Search"
              onClick={() => navigate("/incidents")}
            >
              <Search size={17} />
            </button>

            <button
              className="icon-button"
              title="Notifications"
              onClick={() => navigate("/incidents")}
            >
              <Bell size={17} />
              <i />
            </button>

            <div className="topbar-divider" />

            <div className="topbar-user">
              <div className="avatar small">TX</div>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>

        <footer className="footer">
          <span>
            <span className="pulse-dot" />
            TraceX systems operational
          </span>
          <span>
            Security investigation workspace <b>·</b> v1.0
          </span>
        </footer>
      </div>
    </div>
  );
}