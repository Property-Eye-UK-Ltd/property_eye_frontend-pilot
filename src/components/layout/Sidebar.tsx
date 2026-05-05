import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faFileUpload,
  faExclamationTriangle,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import PropertyEyeMark from "./PropertyEyeMark";

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/", label: "Dashboard", icon: faChartLine },
    { path: "/upload", label: "Upload Listings", icon: faFileUpload },
    { path: "/reports", label: "Fraud Reports", icon: faExclamationTriangle },
  ];

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50">
      <div className="flex min-h-[76px] items-center gap-3 border-b border-slate-800 px-5 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <PropertyEyeMark size="sm" />
        </div>
        <span className="text-xl font-bold leading-none tracking-tight">
          Property Eye
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
              location.pathname === item.path
                ? "bg-primary-600 text-white shadow-lg shadow-primary-900/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <FontAwesomeIcon icon={item.icon} className="w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Current Agency</p>
          <p className="text-sm font-semibold truncate">
            {user?.agency_name || "Loading..."}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
