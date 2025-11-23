import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faFileUpload, 
  faExclamationTriangle, 
  faCog,
  faBuilding,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: faChartLine },
    { path: '/upload', label: 'Upload Listings', icon: faFileUpload },
    { path: '/reports', label: 'Fraud Reports', icon: faExclamationTriangle },
    { path: '/admin', label: 'Admin / PPD', icon: faCog },
  ];

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white">
            <FontAwesomeIcon icon={faBuilding} />
        </div>
        <span className="text-xl font-bold tracking-tight">Property Eye</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
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
            <p className="text-sm font-semibold truncate">{user?.agency_name || 'Loading...'}</p>
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