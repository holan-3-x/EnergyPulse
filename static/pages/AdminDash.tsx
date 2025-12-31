
import React, { useState, useEffect } from 'react';
import {
  Users,
  Database,
  Cpu,
  Globe,
  Search,
  MoreHorizontal,
  ShieldAlert,
  Server,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { adminService, AdminDashboardData } from '../services/admin';
import { User, UserRole } from '../types';

const AdminDash: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [dash, u] = await Promise.all([
        adminService.getDashboardData(),
        adminService.getUsers()
      ]);
      setData(dash);
      setUsers(u);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
      setMessage({ type: 'error', text: 'Failed to load administrative data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: number, currentRole: string) => {
    const roleToSet = String(currentRole).toLowerCase() === 'admin' ? UserRole.USER : UserRole.ADMIN;

    console.log(`Changing role for user ${userId} from ${currentRole} to ${roleToSet}`);

    setUpdatingUserId(userId);
    setMessage(null);
    try {
      await adminService.changeUserRole(userId, roleToSet);
      console.log("Role change successful");
      setMessage({ type: 'success', text: `User role successfully updated to ${roleToSet}!` });
      // Immediately update local state for instant feedback
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: roleToSet } : u));
    } catch (err: any) {
      console.error("Failed to update role:", err);
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      setMessage({ type: 'error', text: `Failed to update user role: ${errorMsg}` });
    } finally {
      setUpdatingUserId(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-500">Global overview of EnergyPulse prediction network.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data?.systemHealth === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${data?.systemHealth === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span>
          <span className={`text-sm font-bold ${data?.systemHealth === 'healthy' ? 'text-green-700' : 'text-red-700'}`}>
            {data?.systemHealth === 'healthy' ? 'All Systems Operational' : 'System Issues Detected'}
          </span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Active Users', value: data?.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Registered Houses', value: data?.totalHouseholds || 0, icon: Globe, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Predictions (Total)', value: data?.totalPredictions || 0, icon: Cpu, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Active Sessions', value: data?.activeSessions || 0, icon: Database, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">User Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}`}
                          className="w-8 h-8 rounded-full"
                          alt="User"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex px-2 py-1 rounded text-[10px] font-bold border capitalize ${user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                        }`}>
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRoleChange(user.id, user.role)}
                        disabled={updatingUserId === user.id}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {updatingUserId === user.id ? 'Updating...' : `Make ${user.role === UserRole.ADMIN ? 'User' : 'Admin'}`}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health & Recent Predictions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Server size={18} className="text-blue-600" /> Infrastructure Status
            </h3>
            <div className="space-y-4">
              {[
                { name: 'API Gateway (Go)', status: data?.serviceStatus?.['api_gateway'] === 'healthy' ? 'Healthy' : 'Error', load: '45%' },
                { name: 'Database (SQLite)', status: data?.serviceStatus?.['database'] === 'healthy' ? 'Healthy' : 'Error', load: '12%' },
                { name: 'MQTT Mosquitto', status: data?.serviceStatus?.['mqtt'] === 'healthy' ? 'Healthy' : 'Error', load: '8%' },
                { name: 'Blockchain RPC', status: data?.serviceStatus?.['blockchain'] === 'healthy' ? 'Healthy' : 'Error', load: '2%' }
              ].map((service, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{service.name}</span>
                    <span className={service.status === 'Healthy' ? 'text-green-600' : 'text-red-600'}>
                      {service.status}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${service.status === 'Healthy' ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: service.load }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-600" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {data?.recentPredictions.slice(0, 5).map((pred) => (
                <div key={pred.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded flex items-center justify-center">
                      <Cpu size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Prediction #{String(pred.id)}</p>
                      <p className="text-[10px] text-gray-500">{new Date(pred.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-blue-600">{pred.consumptionKwh.toFixed(1)} kWh</p>
                    <p className="text-[10px] text-gray-500">€{pred.predictedPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {(!data?.recentPredictions || data.recentPredictions.length === 0) && (
                <p className="text-xs text-gray-500 text-center py-4">No recent predictions found.</p>
              )}
            </div>
          </div>

          <div className="bg-red-600 p-6 rounded-2xl text-white relative overflow-hidden shadow-lg shadow-red-100">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={20} />
                <h3 className="font-bold">Security Alerts</h3>
              </div>
              <p className="text-xs opacity-90 mb-4">No unauthorized attempts detected in the last 24 hours.</p>
              <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all backdrop-blur-sm">
                View Audit Logs
              </button>
            </div>
            <ShieldAlert size={100} className="absolute -right-4 -bottom-4 opacity-10" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDash;
