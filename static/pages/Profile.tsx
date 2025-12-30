
import React from 'react';
import { useAuth } from '../App';
import { User, Mail, Phone, Shield, Bell, Lock, Globe } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="relative inline-block mb-4">
              <img 
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg mx-auto"
                alt="Avatar"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-gray-100 shadow-md text-blue-600 hover:text-blue-700 transition-colors">
                <Shield size={16} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{user?.firstName} {user?.lastName}</h3>
            <p className="text-sm text-gray-500">@{user?.username}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold capitalize">
              {user?.role} Account
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <nav className="flex flex-col">
              {[
                { label: 'Public Profile', icon: User, active: true },
                { label: 'Security', icon: Lock },
                { label: 'Notifications', icon: Bell },
                { label: 'Region & Language', icon: Globe },
              ].map((item, i) => (
                <button 
                  key={i} 
                  className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold border-l-2 transition-all
                    ${item.active ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">First Name</label>
                <input 
                  type="text" 
                  defaultValue={user?.firstName}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Name</label>
                <input 
                  type="text" 
                  defaultValue={user?.lastName}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="email" 
                    defaultValue={user?.email}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="tel" 
                    defaultValue={user?.phone}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-red-600 mb-6">Danger Zone</h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
              <div>
                <h4 className="text-sm font-bold text-red-800">Delete Account</h4>
                <p className="text-xs text-red-600">Permanently remove your account and all household data.</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
