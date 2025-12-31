
import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Maximize,
  Thermometer,
  Zap,
  Info,
  ExternalLink,
  User as UserIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { housesService } from '../services/houses';
import { predictionsService } from '../services/predictions';
import { Household, Prediction } from '../types';
import { useAuth } from '../App';

const HouseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [house, setHouse] = React.useState<Household | null>(null);
  const [predictions, setPredictions] = React.useState<Prediction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  React.useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [h, p] = await Promise.all([
          housesService.getHouse(id),
          predictionsService.getPredictions({ houseId: id })
        ]);
        setHouse(h);
        setPredictions(p);
      } catch (err) {
        console.error("Failed to fetch house details", err);
        setError("Failed to load house details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const chartData = useMemo(() => {
    return predictions.slice(0, 24).map(p => ({
      time: new Date(p.timestamp).getHours() + ':00',
      consumption: p.consumptionKwh,
      price: p.predictedPrice
    }));
  }, [predictions]);

  if (loading) return <div className="flex justify-center p-12 text-blue-600 font-bold">Loading...</div>;
  if (!house) return <div className="p-12 text-center text-red-600 font-bold">House not found</div>;


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* House Info Card */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Zap size={32} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{house.houseName}</h1>

            {isAdmin && house.ownerName && (
              <div className="flex items-center gap-2 text-blue-600 font-bold mb-3">
                <UserIcon size={18} />
                <span>Owner: {house.ownerName} ({house.userEmail})</span>
              </div>
            )}

            <p className="flex items-center gap-1.5 text-gray-500 text-sm mb-6">
              <MapPin size={16} /> {house.address}, {house.city}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Maximize size={16} /> <span className="text-xs font-semibold">Area</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{house.areaSqm} m²</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar size={16} /> <span className="text-xs font-semibold">Built</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{house.yearBuilt}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Users size={16} /> <span className="text-xs font-semibold">Members</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{house.members} people</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Thermometer size={16} /> <span className="text-xs font-semibold">Heating</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{house.heatingType}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Smart Meter ID</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{house.meterId}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-2xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <Info className="opacity-80" />
              <h3 className="font-bold">ML Insights</h3>
            </div>
            <p className="text-sm opacity-90 leading-relaxed">
              Based on your house's {house.heatingType} system and current weather, we expect a 15% drop in consumption during night hours. Use high-load appliances between 02:00 and 05:00 for minimum cost.
            </p>
          </div>
        </div>

        {/* Charts & Table Area */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6">Hourly Consumption (Last 24h)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="consumption" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.consumption > 2.5 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Recent Blockchain Verifications</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Predicted Price</th>
                    <th className="px-6 py-4">Transaction Hash</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {predictions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm italic">
                        No blockchain verification available
                      </td>
                    </tr>
                  ) : predictions.filter(p => p.blockchainConfirmed).slice(0, 5).map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{new Date(p.timestamp).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">€{p.predictedPrice.toFixed(3)}</td>
                      <td className="px-6 py-4 text-xs font-mono text-blue-600">
                        <div className="flex items-center gap-1">
                          {p.blockchainTx ? `${p.blockchainTx.substring(0, 10)}...` : 'N/A'}
                          <ExternalLink size={12} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100 uppercase tracking-tighter">
                            Confirmed
                          </span>
                          <span className="text-[9px] text-gray-400 mt-1 italic">(Simulated Chain)</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseDetails;
