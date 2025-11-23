import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faExclamationTriangle, 
  faCheckCircle, 
  faPoundSign,
  faSpinner,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ENDPOINTS } from '../config';
import { AgencyStats } from '../types';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconDefinition;
  colorClass: string;
  subtext?: string;
}

const StatCard = ({ title, value, icon, colorClass, subtext }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('500', '100')}`}>
        <FontAwesomeIcon icon={icon} className={colorClass} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const agencyId = user?.agency_id;

  // Fetch Stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<AgencyStats>({
    queryKey: ['agency-stats'],
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.AGENCY.STATS);
      return response.data;
    },
  });

  const chartData = [
    { name: 'Suspicious', value: stats?.suspicious_matches || 0, color: '#f59e0b' },
    { name: 'Confirmed Fraud', value: stats?.confirmed_fraud || 0, color: '#ef4444' },
    { name: 'Cleared', value: (stats?.total_listings || 0) - (stats?.suspicious_matches || 0) - (stats?.confirmed_fraud || 0), color: '#10b981' },
  ];

  // Filter out zero values for cleaner chart
  const activeChartData = chartData.filter(d => d.value > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Listings" 
          value={stats?.total_listings?.toLocaleString() || 0} 
          icon={faHome} 
          colorClass="text-slate-700" 
          subtext="Properties monitored"
        />
        <StatCard 
          title="Suspicious Matches" 
          value={stats?.suspicious_matches?.toLocaleString() || 0} 
          icon={faExclamationTriangle} 
          colorClass="text-amber-500" 
          subtext="Requires verification"
        />
        <StatCard 
          title="Confirmed Fraud" 
          value={stats?.confirmed_fraud?.toLocaleString() || 0} 
          icon={faCheckCircle} 
          colorClass="text-red-500" 
          subtext="Sales bypassing agency"
        />
        <StatCard 
          title="Potential Savings" 
          value={`£${(stats?.potential_savings || 0).toLocaleString()}`} 
          icon={faPoundSign} 
          colorClass="text-green-600" 
          subtext="Est. recovered commission"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Portfolio Health</h3>
          <div className="h-64 w-full">
            {activeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {activeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                {isLoadingStats ? <FontAwesomeIcon icon={faSpinner} spin /> : 'No data available'}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Recent */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium text-green-900">System Operational</p>
                <p className="text-xs text-green-700">All services running</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div>
                <p className="text-sm font-medium text-blue-900">PPD Data Up-to-Date</p>
                <p className="text-xs text-blue-700">Last sync: Today</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;