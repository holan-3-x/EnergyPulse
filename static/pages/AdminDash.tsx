
import React from 'react';
import {
  Users,
  Database,
  Cpu,
  Globe,
  Search,
  MoreHorizontal,
  ShieldAlert,
  Server
} from 'lucide-react';
import { adminService, AdminDashboardData } from '../services/admin';
import { User } from '../types';

const AdminDash: React.FC = () => {
  const [data, setData] = React.useState<AdminDashboardData | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-500">Global overview of EnergyPulse prediction network.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-bold text-green-700">All Systems Operational</span>
        </div>
      </div>

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
            <h3 className="font-bold text-gray-900">Recent User Signups</h3>
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
                          src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}`}
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
                    <td className="px-6 py-4 text-xs text-gray-600 capitalize">{user.role}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 hover:bg-gray-200 rounded text-gray-400">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Server size={18} className="text-blue-600" /> Infrastructure Status
            </h3>
            <div className="space-y-4">
              {[
                { name: 'MQTT Mosquitto Broker', status: 'Healthy', load: '12%' },
                { name: 'API Gateway (Go)', status: 'Healthy', load: '45%' },
                { name: 'Prediction Service', status: 'Warning', load: '88%' },
                { name: 'Blockchain RPC', status: 'Healthy', load: '2%' }
              ].map((service, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{service.name}</span>
                    <span className={service.status === 'Healthy' ? 'text-green-600' : 'text-orange-600'}>
                      {service.status}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${service.status === 'Healthy' ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: service.load }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-600 p-6 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={20} />
                <h3 className="font-bold">Security Alerts</h3>
              </div>
              <p className="text-xs opacity-90 mb-4">No unauthorized attempts detected in the last 24 hours.</p>
              <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all">
                Audit Logs
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
