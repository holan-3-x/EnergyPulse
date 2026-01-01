
import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, BarChart3, CloudLightning, ArrowRight } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-bold text-gray-900">EnergyPulse</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-blue-600">Log in</Link>
          <Link to="/register" className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Now Powered by Machine Learning
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
            Predict the Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Your Energy Costs.</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mb-12">
            EnergyPulse combines IoT smart meter data with advanced AI algorithms and blockchain transparency to help you manage and predict household electricity costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="bg-gray-900 text-white px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all group">
              Start Free Trial <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="px-8 py-4 rounded-full text-lg font-bold text-gray-900 border border-gray-200 hover:bg-gray-50 transition-all">
              Learn More
            </a>
          </div>

          <div className="mt-20 relative w-full max-w-4xl">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[2rem] blur-2xl opacity-50"></div>
            <img
              src="https://picsum.photos/seed/dashboard-preview/1200/800"
              alt="Dashboard Preview"
              className="relative rounded-2xl shadow-2xl border border-gray-100"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to master your energy</h2>
            <p className="text-gray-600">Built for the modern household with a focus on transparency and intelligence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <CloudLightning className="text-blue-600" />,
                title: "Real-time IoT Monitoring",
                desc: "Connect your smart meters effortlessly and watch your consumption live with millisecond precision."
              },
              {
                icon: <BarChart3 className="text-indigo-600" />,
                title: "AI Price Forecasting",
                desc: "Our decision tree models predict hourly electricity prices based on historical trends and external factors."
              },
              {
                icon: <Shield className="text-green-600" />,
                title: "Blockchain Verification",
                desc: "Every prediction is logged on the Ethereum blockchain, providing an immutable record of your cost forecasts."
              }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2026 EnergyPulse Prediction Systems by Holan. Created for Project and Test Case.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
