
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User, Home, Thermometer, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../App';
import { authService } from '../services/auth';

const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const { login } = useAuth();
  const navigate = useNavigate();

  // State for form fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    houseName: '',
    address: '',
    city: '',
    country: '',
    area: '',
    yearBuilt: '',
    heatingType: 'Heat Pump',
    members: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.type === 'number' ? 'value' : 'name']: e.target.value });
    // Better handler needed for specific inputs, keeping it simple for now or manual binding
  };

  const handleComplete = async () => {
    try {
      // Register
      // Register
      await authService.register({
        username: formData.email.split('@')[0], // derived username
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        // House details flattened as per backend RegisterRequest
        houseName: formData.houseName,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        areaSqm: parseInt(formData.area) || 0,
        heatingType: formData.heatingType,
        yearBuilt: parseInt(formData.yearBuilt) || 2000,
        members: parseInt(formData.members) || 1
      });

      // Auto login
      const { user, token } = await authService.login({
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      login(user); // context update
      navigate('/dashboard');

    } catch (err) {
      console.error("Registration failed", err);
      alert("Registration failed. Please check your details.");
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-12 relative px-4">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`
          w-10 h-10 rounded-full flex items-center justify-center relative z-10 text-sm font-bold transition-all
          ${step === i ? 'bg-blue-600 text-white ring-4 ring-blue-100' : step > i ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-400'}
        `}>
          {step > i ? <Check size={18} /> : i}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white mb-4">
            <Zap size={20} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-500">Step {step} of 4: {
            step === 1 ? 'Personal Information' :
              step === 2 ? 'House Location' :
                step === 3 ? 'Building Details' : 'Smart Meter Pairing'
          }</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <StepIndicator />

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Name</label>
                <input
                  type="text"
                  value={formData.houseName}
                  onChange={(e) => setFormData({ ...formData, houseName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. My Home"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Via Dante 10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Milan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Italy"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqm)</label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Built</label>
                  <input
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="2020"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heating Type</label>
                <select
                  value={formData.heatingType}
                  onChange={(e) => setFormData({ ...formData, heatingType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option>Heat Pump</option>
                  <option>Electric</option>
                  <option>Natural Gas</option>
                  <option>Biomass</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Household Members</label>
                <input
                  type="number"
                  value={formData.members}
                  onChange={(e) => setFormData({ ...formData, members: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="3"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
                <CloudLightning size={40} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Finding Your Smart Meter</h3>
                <p className="text-gray-500 px-10">We are automatically detecting smart meters in your area. Please wait while we pair your household with our IoT gateway.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                  <Check size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Meter Found: EP-FL-102</p>
                  <p className="text-xs text-gray-500">Location verified: Via Dante, Milan</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-gray-600 font-semibold hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} /> Back
              </button>
            ) : <div />}

            <button
              onClick={() => step < 4 ? setStep(step + 1) : handleComplete()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
            >
              {step === 4 ? 'Complete Setup' : 'Continue'} <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal icon for step 4
const CloudLightning = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
    <path d="m13 12-3 5h4l-3 5" />
  </svg>
);

export default Register;
