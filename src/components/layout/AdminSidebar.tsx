import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faDatabase,
  faBuilding,
  faHome,
  faFlag,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import PropertyEyeMark from "./PropertyEyeMark";

const AdminSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/admin", label: "Admin Home", icon: faHome, end: true },
    { path: "/admin/records", label: "Official Records", icon: faDatabase },
    { path: "/admin/fraud-cases", label: "Fraud Cases", icon: faFlag },
    { path: "/admin/alto", label: "Alto Integration", icon: faBuilding },
    { path: "/", label: "Client Dashboard", icon: faChartLine },
  ];

  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-slate-950 text-white">
      <div className="flex min-h-[76px] items-center gap-3 border-b border-slate-800 px-5 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <PropertyEyeMark size="sm" />
        </div>
        <div>
          <span className="text-lg font-bold leading-none tracking-tight">
            Admin Panel
          </span>
          <p className="text-xs text-slate-400">Restricted operations</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              location.pathname === item.path ||
                (!item.end && location.pathname.startsWith(item.path))
                ? "bg-primary-600 text-white shadow-lg shadow-primary-900/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <FontAwesomeIcon icon={item.icon} className="w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-4 border-t border-slate-800 p-4">
        <div className="rounded-lg bg-slate-900 p-4">
          <p className="mb-1 text-xs text-slate-400">Signed in as</p>
          <p className="truncate text-sm font-semibold">
            {user?.agency_name || "Loading..."}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
