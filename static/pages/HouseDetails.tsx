
import React, { useMemo, useState, useEffect } from 'react';
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
  User as UserIcon,
  Cloud,
  TrendingDown,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { housesService } from '../services/houses';
import { predictionsService } from '../services/predictions';
import { Household, Prediction } from '../types';
import { useAuth } from '../App';

const HouseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [house, setHouse] = useState<Household | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Hover States for Chart Interaction
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);
  const [hoverHour, setHoverHour] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const [h, p, f] = await Promise.all([
          housesService.getHouse(id),
          predictionsService.getPredictions({ houseId: id }),
          housesService.getForecast(id)
        ]);

        setHouse(h);
        // Extract predictions array from paginated response
        setHistory(p?.predictions || []);
        setForecast(f || []);
      } catch (err: any) {
        console.error("Failed to fetch node data:", err);
        setError(err.response?.data?.error || "Meter registry timeout. Node might be offline.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const consumptionData = useMemo(() => {
    return history.slice(0, 24).map(p => ({
      time: new Date(p.timestamp).getHours() + ':00',
      consumption: p.consumptionKwh,
    })).reverse();
  }, [history]);

  const forecastData = useMemo(() => {
    return forecast.map(f => ({
      time: new Date(f.timestamp).getHours() + ':00',
      price: f.predictedPrice,
      confidence: f.confidence
    }));
  }, [forecast]);

  // Find optimal window (cheapest price in forecast)
  const optimalTime = useMemo(() => {
    if (forecastData.length === 0) return { start: "23:00", end: "06:00", price: 0.08 };
    const cheapest = [...forecastData].sort((a, b) => a.price - b.price)[0];
    const hourNum = parseInt(cheapest.time.split(':')[0]);
    return {
      start: cheapest.time,
      end: ((hourNum + 4) % 24) + ":00",
      price: cheapest.price
    };
  }, [forecastData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="relative">
        <Zap className="w-16 h-16 text-indigo-600 animate-pulse" />
        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-indigo-600 font-black tracking-[0.2em] uppercase text-[10px] mb-2">Establishing Uplink</p>
        <div className="h-1 w-48 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full animate-loading-bar" style={{ width: '40%' }} />
        </div>
      </div>
    </div>
  );

  if (error || !house) return (
    <div className="p-12 text-center rounded-[3rem] bg-white border border-gray-100 shadow-xl max-w-2xl mx-auto my-12">
      <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
        <AlertTriangle size={48} />
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Node Unreachable</h2>
      <p className="text-gray-500 leading-relaxed mb-10">{error || "The specified meter node has been deselected or disconnected from the active registry. Contact your administrator if this persists."}</p>
      <Link to="/houses" className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg">
        Return to Registry Overview
      </Link>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Link to="/houses" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all">
            <ArrowLeft size={14} /> Back to Smart Fleet
          </Link>
          <h1 className="text-4xl font-black text-gray-901 tracking-tighter">{house.houseName}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-bold">
            <div className="flex items-center gap-1.5"><MapPin size={14} className="text-indigo-500" /> {house.city}</div>
            <div className="flex items-center gap-1.5 font-mono bg-gray-50 px-2 py-0.5 rounded text-[10px]">House ID: {house.id}</div>
            {isAdmin && <div className="flex items-center gap-1.5 font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px]">Owner ID: {house.userId}</div>}
            <div className="flex items-center gap-1.5"><TrendingUp size={14} className="text-green-500" /> Meter Active</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-right">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Grid UID</p>
            <p className="text-xs font-mono font-bold text-gray-900">{house.meterId}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Zap size={24} fill="white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Data */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-50 rounded-full opacity-50 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Property Vectors</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <Maximize size={20} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-black text-gray-900">{house.areaSqm}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">m² Area</p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <Users size={20} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-black text-gray-900">{house.members}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Residents</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Thermometer size={18} className="text-orange-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Heat Sys</span>
                  </div>
                  <span className="text-xs font-black text-gray-900 capitalize">{house.heatingType.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-blue-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vintage</span>
                  </div>
                  <span className="text-xs font-black text-gray-900">{house.yearBuilt} Built</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                  <Clock className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">Off-Peak Window</h3>
                  <p className="text-[10px] font-bold text-white/50">Dynamic Recalculation</p>
                </div>
              </div>
              <div className="space-y-2 mb-8">
                <p className="text-5xl font-black tracking-tighter tabular-nums">{optimalTime.start}</p>
                <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] pl-1">to {optimalTime.end}</p>
              </div>
              <p className="text-xs text-white/60 leading-relaxed font-medium">
                Prices are projected to bottom at <span className="text-indigo-400 font-bold">€{optimalTime.price.toFixed(4)}</span>. Shift thermal loads for maximum efficiency.
              </p>
            </div>
          </div>
        </div>

        {/* Forecast Visualizer */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-2xl shadow-indigo-500/5">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                  <h3 className="text-2xl font-black text-gray-901 tracking-tighter">AI Prediction Engine</h3>
                </div>
                <p className="text-sm text-gray-400 font-bold max-w-sm">Comparing local weather vectors against PUN market futures.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100/50 min-w-[200px]">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Info size={10} /> {hoverHour ? `${hoverHour} Forecast` : 'Live Forecast'}
                  </p>
                  <p className="text-3xl font-black text-indigo-600 tabular-nums tracking-tighter transition-all duration-300">
                    €{hoverPrice ? hoverPrice.toFixed(4) : (forecastData[0]?.price.toFixed(4) || '0.0000')}
                  </p>
                </div>
                <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 min-w-[140px] flex flex-col justify-center items-center">
                  <Cloud className="text-gray-400 mb-2" size={20} />
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Market Context</p>
                  <p className="text-sm font-black text-gray-900 uppercase">Winter Peak</p>
                </div>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={forecastData}
                  onMouseMove={(state) => {
                    if (state && typeof state.activeTooltipIndex !== 'undefined') {
                      const idx = state.activeTooltipIndex;
                      const dataPoint = forecastData[idx];
                      if (dataPoint) {
                        setHoverPrice(dataPoint.price);
                        setHoverHour(dataPoint.time);
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    setHoverPrice(null);
                    setHoverHour(null);
                  }}
                >
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                    interval={2}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `€${val.toFixed(2)}`}
                  />
                  <Tooltip
                    cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-50 flex flex-col gap-1 ring-1 ring-gray-100">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{payload[0].payload.time} Target</span>
                            <span className="text-2xl font-black text-indigo-600">€{Number(payload[0].value).toFixed(4)}</span>
                            <div className="flex items-center gap-2 mt-4">
                              <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${payload[0].payload.confidence}%` }}></div>
                              </div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">{payload[0].payload.confidence}% Confidence</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#6366f1"
                    strokeWidth={5}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    activeDot={{ r: 8, fill: '#6366f1', stroke: 'white', strokeWidth: 4, shadow: '0 0 10px rgba(0,0,0,0.2)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-indigo-500/5">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xs font-black text-gray-901 uppercase tracking-widest">History Log</h4>
                <Link to="/predictions" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-1">
                  Full Audit <ChevronRight size={12} />
                </Link>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consumptionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="time" hide />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', padding: '15px' }}
                    />
                    <Bar dataKey="consumption" radius={[8, 8, 0, 0]}>
                      {consumptionData.map((entry, index) => (
                        <Cell key={index} fill={entry.consumption > 2.0 ? '#fb7185' : '#6366f1'} opacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-indigo-900 p-10 rounded-[3rem] text-white shadow-2xl flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <ExternalLink size={100} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-6">Validation Node</h4>
                <p className="text-sm font-bold leading-relaxed mb-8">
                  This household is a verified participant in the P2P energy sharing protocol. All predictions are committed to the decentralized ledger.
                </p>
              </div>
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
                Verify Network Integrity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseDetails;
