
import React, { useState, useEffect } from 'react';
import {
    Blocks,
    ShieldCheck,
    Hash,
    Clock,
    Fuel,
    ExternalLink,
    Search,
    CheckCircle2,
    XCircle,
    Loader2,
    Copy,
    Database,
    Cpu,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { blockchainService, BlockchainLog, BlockchainStats, VerificationResult } from '../services/blockchain';

const BlockchainLedger: React.FC = () => {
    const [logs, setLogs] = useState<BlockchainLog[]>([]);
    const [stats, setStats] = useState<BlockchainStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [verifyHash, setVerifyHash] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [logsData, statsData] = await Promise.all([
                blockchainService.getLogs(),
                blockchainService.getStats()
            ]);
            setLogs(logsData.logs || []);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch blockchain data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verifyHash.trim()) return;
        setVerifying(true);
        setVerificationResult(null);
        try {
            const result = await blockchainService.verifyTransaction(verifyHash.trim());
            setVerificationResult(result);
        } catch (err: any) {
            setVerificationResult({ verified: false, error: 'Transaction not found' });
        } finally {
            setVerifying(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedHash(text);
        setTimeout(() => setCopiedHash(null), 2000);
    };

    const truncateHash = (hash: string) => {
        if (!hash) return '';
        return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Blocks className="text-indigo-600" size={28} />
                        Blockchain Ledger
                    </h1>
                    <p className="text-gray-500">Immutable audit trail for your energy predictions</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-green-700">Network Active</span>
                </div>
            </div>

            {/* Network Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Current Block', value: stats?.currentBlock?.toLocaleString() || '0', icon: Blocks, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Your Transactions', value: stats?.userTransactions || 0, icon: Hash, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Confirmed', value: stats?.userConfirmed || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Total Gas Used', value: (stats?.userTotalGas || 0).toLocaleString(), icon: Fuel, color: 'text-amber-600', bg: 'bg-amber-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                            <stat.icon size={20} />
                        </div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Transaction Verifier */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl text-white relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck size={24} />
                        <h2 className="text-xl font-bold">Transaction Verifier</h2>
                    </div>
                    <p className="text-sm opacity-80 mb-6">
                        Enter any transaction hash to verify its authenticity on the blockchain
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={verifyHash}
                            onChange={(e) => setVerifyHash(e.target.value)}
                            placeholder="0x..."
                            className="flex-1 px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 outline-none focus:bg-white/20 transition-all font-mono text-sm"
                        />
                        <button
                            onClick={handleVerify}
                            disabled={verifying || !verifyHash.trim()}
                            className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {verifying ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                            Verify
                        </button>
                    </div>

                    {verificationResult && (
                        <div className={`mt-6 p-5 rounded-2xl ${verificationResult.verified ? 'bg-green-500/20 border border-green-400/30' : 'bg-red-500/20 border border-red-400/30'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                {verificationResult.verified ? (
                                    <CheckCircle2 size={24} className="text-green-300" />
                                ) : (
                                    <XCircle size={24} className="text-red-300" />
                                )}
                                <span className="font-bold text-lg">
                                    {verificationResult.verified ? 'Transaction Verified ✓' : 'Verification Failed'}
                                </span>
                            </div>
                            {verificationResult.verified && verificationResult.prediction && (
                                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                    <div>
                                        <span className="opacity-60">Block #</span>
                                        <p className="font-bold">{verificationResult.blockNumber?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="opacity-60">Gas Used</span>
                                        <p className="font-bold">{verificationResult.gasUsed?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="opacity-60">Predicted Price</span>
                                        <p className="font-bold">€{verificationResult.prediction.predictedPrice.toFixed(4)}</p>
                                    </div>
                                    <div>
                                        <span className="opacity-60">Actual Price</span>
                                        <p className="font-bold">€{verificationResult.prediction.actualPrice.toFixed(4)}</p>
                                    </div>
                                </div>
                            )}
                            {verificationResult.error && (
                                <p className="text-red-300 text-sm">{verificationResult.error}</p>
                            )}
                        </div>
                    )}
                </div>
                <Blocks size={200} className="absolute -right-10 -bottom-10 opacity-10" />
            </div>

            {/* Contract Info */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Database size={18} className="text-indigo-600" />
                    Smart Contract Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Contract Address</p>
                        <p className="font-mono text-sm font-bold text-gray-900 break-all">{stats?.contractAddress || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Network</p>
                        <p className="font-bold text-gray-900 capitalize">{stats?.network || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Transaction Log Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Hash size={18} className="text-purple-600" />
                        Your Transaction History
                    </h3>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                        {logs.length} transactions
                    </span>
                </div>

                {logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="font-bold text-gray-700 mb-2">No Transactions Yet</h3>
                        <p className="text-sm text-gray-500">Your blockchain transactions will appear here once predictions are logged.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Transaction Hash</th>
                                    <th className="px-6 py-4 text-left">Block</th>
                                    <th className="px-6 py-4 text-left">Meter ID</th>
                                    <th className="px-6 py-4 text-left">Price</th>
                                    <th className="px-6 py-4 text-left">Gas</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-left">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.slice(0, 50).map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-indigo-600 font-bold">
                                                    {truncateHash(log.transactionHash)}
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(log.transactionHash)}
                                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                    title="Copy full hash"
                                                >
                                                    {copiedHash === log.transactionHash ? (
                                                        <CheckCircle2 size={14} className="text-green-500" />
                                                    ) : (
                                                        <Copy size={14} className="text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-gray-700">
                                                #{log.blockNumber.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-600">{log.meterId}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs">
                                                <p className="font-bold text-gray-900">€{log.predictedPrice.toFixed(4)}</p>
                                                <p className="text-gray-400">Actual: €{log.actualPrice.toFixed(4)}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-600">{log.gasUsed.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${log.status === 'confirmed'
                                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                {log.status === 'confirmed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-500">
                                                {new Date(log.loggedAt).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockchainLedger;
