
import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Info,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { mockPredictions } from '../services/mockData';

const Predictions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredPredictions = useMemo(() => {
    return mockPredictions.filter(p => {
      const matchesSearch = p.blockchainTx.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || 
        (filterType === 'high' && p.predictedPrice > 0.28) ||
        (filterType === 'low' && p.predictedPrice <= 0.28);
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prediction Logs</h1>
          <p className="text-gray-500">View and verify machine learning price forecasts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Filters */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search Tx Hash..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option value="all">All Prices</option>
                <option value="high">High (&gt; €0.28)</option>
                <option value="low">Low (&lt;= €0.28)</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100">
            <TrendingUp size={18} />
            <span className="text-sm font-bold">Decision Tree Model: v2.4</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Prediction ID</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Temp</th>
                <th className="px-6 py-4">Est. Consumption</th>
                <th className="px-6 py-4">Predicted Price</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPredictions.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">#{p.id.split('_').pop()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(p.timestamp).toLocaleDateString()} {new Date(p.timestamp).getHours()}:00
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                      <ThermometerIcon size={14} className="text-orange-500" /> {p.temperature.toFixed(1)}°C
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">{p.consumptionKwh.toFixed(2)} kWh</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${p.predictedPrice > 0.28 ? 'text-red-600' : 'text-green-600'}`}>
                      €{p.predictedPrice.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 w-24">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${p.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">{(p.confidence * 100).toFixed(1)}% Sure</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={`https://etherscan.io/tx/${p.blockchainTx}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <ShieldCheck size={18} />
                      <span className="text-xs font-bold underline decoration-blue-200">Verify</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing <span className="font-bold text-gray-900">{filteredPredictions.length}</span> predictions</p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors" disabled>
              <ChevronLeft size={18} />
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
        <Info className="text-yellow-600 shrink-0" size={20} />
        <div>
          <p className="text-sm font-bold text-yellow-800">Note on Confidence Scores</p>
          <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
            Scores below 85% indicate potential volatility in the energy market. During these periods, we recommend monitoring the real-time consumption more closely as market fluctuations may lead to higher price variance.
          </p>
        </div>
      </div>
    </div>
  );
};

const ThermometerIcon = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
  </svg>
);

export default Predictions;
