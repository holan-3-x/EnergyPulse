
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Filter,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Info,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { predictionsService } from '../services/predictions';
import { Prediction } from '../types';

const Predictions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 15;

  const fetchPredictions = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await predictionsService.getPredictions({
        page,
        limit
      });
      setPredictions(response.predictions);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
      setCurrentPage(response.page);
    } catch (err) {
      console.error("Failed to fetch predictions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions(1);
  }, [fetchPredictions]);

  const handleNextBatch = () => {
    if (currentPage < totalPages) {
      fetchPredictions(currentPage + 1);
    }
  };

  const handlePrevBatch = () => {
    if (currentPage > 1) {
      fetchPredictions(currentPage - 1);
    }
  };

  const handleExport = () => {
    setExporting(true);
    try {
      predictionsService.exportToCSV(predictions);
    } finally {
      setExporting(false);
    }
  };

  const filteredPredictions = useMemo(() => {
    return predictions.filter(p => {
      const matchesSearch = (p.blockchainTx?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        p.meterId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterType === 'all' ||
        (filterType === 'high' && p.predictedPrice > 0.14) ||
        (filterType === 'low' && p.predictedPrice <= 0.14);

      return matchesSearch && matchesFilter;
    });
  }, [predictions, searchTerm, filterType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-901 tracking-tight">Predictions & Neural Audits</h1>
          <p className="text-sm text-gray-400 font-medium">Validating ML forecasts against real-time market settlement.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting || predictions.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export Audit Proofs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-500/5 overflow-hidden">
        {/* Statistics Bar */}
        <div className="bg-indigo-600 p-8 text-white grid grid-cols-1 md:grid-cols-3 gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={120} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Zap className="text-white" size={28} fill="white" />
            </div>
            <div>
              <p className="text-indigo-100/70 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Model Avg Accuracy</p>
              <h3 className="text-3xl font-black tracking-tight">96.8%</h3>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <TrendingUp className="text-white" size={28} />
            </div>
            <div>
              <p className="text-indigo-100/70 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Market Volatility</p>
              <h3 className="text-3xl font-black tracking-tight">LOW</h3>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <div>
              <p className="text-indigo-100/70 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Total Verified Blocks</p>
              <h3 className="text-3xl font-black tracking-tight">{totalItems}</h3>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search Hash or Meter Node..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Market Price Segments</option>
                <option value="high">Premium (&gt; €0.14)</option>
                <option value="low">Standard (&lt;= €0.14)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-green-50 text-green-700 px-5 py-3 rounded-2xl border border-green-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Real-Time Oracle Active</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
              <tr>
                <th className="px-8 py-5">Node Context</th>
                <th className="px-8 py-5">Settlement Time</th>
                <th className="px-8 py-5">Ambient</th>
                <th className="px-8 py-5">ML Prediction</th>
                <th className="px-8 py-5">Actual Market</th>
                <th className="px-8 py-5">Accuracy Delta</th>
                <th className="px-8 py-5 text-right">Ledger Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin text-indigo-600 mx-auto mb-3" size={32} />
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Querying Distributed Ledger...</p>
                  </td>
                </tr>
              ) : filteredPredictions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs italic">No matching records synchronization found</td>
                </tr>
              ) : filteredPredictions.map((p) => (
                <tr key={p.id} className="hover:bg-indigo-50/20 transition-all duration-300 group">
                  <td className="px-8 py-5">
                    <div className="text-xs font-black text-gray-900 mb-0.5">#{p.id}</div>
                    <div className="text-[10px] text-gray-400 font-mono tracking-tighter">{p.meterId}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs font-bold text-gray-700">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase">{new Date(p.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-5 text-xs font-black text-gray-600 tabular-nums">
                    {p.temperature.toFixed(1)}°C
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs font-black text-indigo-600 tabular-nums">€{p.predictedPrice.toFixed(4)}</div>
                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Conf: {p.confidence}%</div>
                  </td>
                  <td className="px-8 py-5 text-xs font-black text-gray-910 tabular-nums">
                    {p.actualPrice > 0 ? `€${p.actualPrice.toFixed(4)}` : '---'}
                  </td>
                  <td className="px-8 py-5">
                    {p.actualPrice > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className={`text-xs font-black tabular-nums ${p.accuracy > 95 ? 'text-green-600' : p.accuracy > 90 ? 'text-indigo-600' : 'text-orange-600'}`}>
                          {p.accuracy.toFixed(1)}%
                        </div>
                        {p.accuracy > 95 ? <CheckCircle2 size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-orange-500" />}
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-gray-300 uppercase animate-pulse">Pending...</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {p.blockchainConfirmed ? (
                      <div className="flex items-center justify-end gap-2 group-hover:scale-105 transition-transform">
                        <div className="text-right mr-1">
                          <p className="text-[9px] font-black text-green-600 uppercase leading-none">Verified</p>
                          <p className="text-[8px] font-mono text-gray-300 truncate w-16 ml-auto">0x{p.blockchainTx?.slice(2, 6)}...</p>
                        </div>
                        <ShieldCheck className="text-indigo-500" size={16} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 text-gray-300 font-black italic text-[10px]">
                        Mining <Loader2 size={12} className="animate-spin" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Showing page {currentPage} of {totalPages} | {totalItems} Unified Records</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevBatch}
              disabled={currentPage <= 1 || loading}
              className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={14} /> Prev Batch
            </button>
            <div className="flex items-center gap-1.5 px-4 h-10 bg-white border border-gray-200 rounded-2xl">
              {[...Array(Math.min(3, totalPages))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchPredictions(i + 1)}
                  className={`w-6 h-6 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-400'}`}
                >
                  {i + 1}
                </button>
              ))}
              {totalPages > 3 && <span className="text-gray-300 text-[10px] px-1 font-black">...</span>}
            </div>
            <button
              onClick={handleNextBatch}
              disabled={currentPage >= totalPages || loading}
              className="flex items-center gap-2 px-5 py-3 border border-indigo-100 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white disabled:opacity-30 transition-all shadow-indigo-100/50 shadow-lg"
            >
              Next Batch <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="text-indigo-300" size={24} />
              <h3 className="text-xl font-black tracking-tight">Autonomous Calibrator</h3>
            </div>
            <p className="text-xs text-indigo-100/70 leading-relaxed mb-6 font-medium">
              If prediction drift exceeds 5%, the weight of house characteristics (Area, Vintage, Heat Type) are automatically
              re-balanced via stochastic gradient descent within your local energy node.
            </p>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-400 border-t border-white/10 pt-6">
              <span>Next training window</span>
              <span className="text-white">04h 12m</span>
            </div>
          </div>
        </div>
        <div className="bg-emerald-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-emerald-300" size={24} />
              <h3 className="text-xl font-black tracking-tight">Immutable Cryptography</h3>
            </div>
            <p className="text-xs text-emerald-100/70 leading-relaxed mb-6 font-medium">
              Every prediction is cryptographically hashed and signed against the blockchain block header.
              This ensures that your utility billing is perfectly synced with the original ML forecast.
            </p>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-400 border-t border-white/10 pt-6">
              <span>Sync Height</span>
              <span className="text-white">15,420,103</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
