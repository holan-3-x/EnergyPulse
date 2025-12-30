
import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  Activity,
  Calendar,
  ChevronRight,
  Zap,
  Home,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { housesService } from '../services/houses';
import { predictionsService } from '../services/predictions';
import { Household, Prediction } from '../types';

const Dashboard: React.FC = () => {
  const [houses, setHouses] = React.useState<Household[]>([]);
  const [predictions, setPredictions] = React.useState<Prediction[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [h, p] = await Promise.all([
          housesService.getHouses(),
          predictionsService.getPredictions()
        ]);
        setHouses(h);
        setPredictions(p);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    return predictions.slice(0, 12).map(p => ({
      time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: p.predictedPrice,
      consumption: p.consumptionKwh
    }));
  }, [predictions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin text-blue-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Energy Overview</h1>
          <p className="text-gray-500">Here is what's happening with your households today.</p>
        </div>
        <Link
          to="/register"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} /> Add New House
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Consumption', value: '42.8 kWh', trend: '+12%', up: true, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg. Price/Hour', value: '€0.24', trend: '-2.5%', up: false, icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Monthly Est.', value: '€142.10', trend: '+5%', up: true, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Active Meters', value: '02', trend: 'Stable', up: null, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              {stat.up !== null && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.up ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.trend}
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Price Prediction Forecast (Next 12h)</h3>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Predicted Price (€)
              </span>
            </div>
          </div>
          <div className="flex-1 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* House List */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Registered Houses</h3>
            <Link to="/houses" className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="space-y-4">
            <div className="space-y-4">
              {houses.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 text-center">No houses added yet.</p>
              ) : houses.map((house) => (
                <Link
                  key={house.id}
                  to={`/houses/${house.id}`}
                  className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 border border-gray-100 shadow-sm">
                      <Home size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{house.houseName}</h4>
                      <p className="text-xs text-gray-500">{house.city}, {house.region}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-semibold opacity-80 mb-1">Blockchain Status</p>
              <h4 className="font-bold mb-3">Predictions Verified</h4>
              <div className="flex items-center gap-2 text-[10px] bg-white/10 w-fit px-2 py-1 rounded-full">
                <ShieldCheck size={12} /> Live Node Connected
              </div>
            </div>
            <Activity size={80} className="absolute -right-4 -bottom-4 opacity-10" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
