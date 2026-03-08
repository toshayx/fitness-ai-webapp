import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, History, Settings, LogOut } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const { username, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-primary-light tracking-tight">Fitness AI</h1>
          <nav className="flex gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary-light"
                      : "text-text-muted hover:text-text hover:bg-surface-hover"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-muted">{username}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-danger transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
