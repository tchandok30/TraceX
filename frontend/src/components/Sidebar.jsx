import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "⌂",
    },
    {
      name: "Incidents",
      path: "/dashboard",
      icon: "⚠",
    },
    {
      name: "Security Lab",
      path: "/security-lab",
      icon: "⚗",
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
            T
          </div>

          <div>
            <h1 className="font-bold text-lg text-white">
              TraceX
            </h1>

            <p className="text-xs text-slate-500">
              Security Operations
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">

        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                isActive
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`
            }
          >
            <span className="text-lg">
              {item.icon}
            </span>

            {item.name}
          </NavLink>
        ))}

      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-slate-800">

        <div className="px-4 py-3 mb-2">
          <p className="text-xs text-slate-500">
            Logged in as
          </p>

          <p className="text-sm text-slate-300 mt-1">
            Investigator
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-900 transition text-left"
        >
          ⇥ Logout
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;