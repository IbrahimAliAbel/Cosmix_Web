import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Sparkles, Shield } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        // Navigate to login page
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-slate-800 flex items-center justify-center px-4 relative overflow-hidden fixed inset-0">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-gray-600 to-slate-700 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-zinc-600 to-gray-700 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-slate-600 to-gray-700 rounded-full opacity-5 blur-3xl animate-pulse"></div>
      </div>

    {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gray-400 rounded-full opacity-20 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>
     {/* Elegant grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Header section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-800 to-gray-900 border border-gray-700 rounded-2xl mb-4 shadow-2xl">
            <Sparkles className="w-8 h-8 text-gray-300" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Join Us Today</h1>
          <p className="text-gray-400 text-lg">Create your account and unlock amazing features</p>
        </div>

        {/* Main form card */}
        <div className="bg-black/40 backdrop-blur-xl border border-gray-800 p-8 rounded-3xl shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-900/30 border border-red-700/50 flex items-center backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-green-900/30 border border-green-700/50 backdrop-blur-sm">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

        <div className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-slate-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <User className="absolute top-4 left-4 text-gray-500 z-10 group-focus-within:text-gray-300 transition-colors" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
               className="relative z-10 w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600 backdrop-blur-sm transition-all duration-300 hover:bg-gray-900/70 hover:border-gray-600"
                placeholder="Full Name"
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-slate-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <Mail className="absolute top-4 left-4 text-gray-500 z-10 group-focus-within:text-gray-300 transition-colors" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="relative z-10 w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600 backdrop-blur-sm transition-all duration-300 hover:bg-gray-900/70 hover:border-gray-600"
                placeholder="Email Address"
                required
              />
            </div>

             <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-slate-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <Lock className="absolute top-4 left-4 text-gray-500 z-10 group-focus-within:text-gray-300 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="relative z-10 w-full pl-12 pr-12 py-4 bg-gray-900/50 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600 backdrop-blur-sm transition-all duration-300 hover:bg-gray-900/70 hover:border-gray-600"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors z-10"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-gray-800 to-slate-800 hover:from-gray-700 hover:to-slate-700 text-white rounded-2xl transition-all duration-300 flex justify-center items-center font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none border border-gray-700"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-6 w-6 border-b-2 border-white mr-3 rounded-full" />
                  Creating Account...
                </div>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2" size={20} />
                </>
              )}
            </button>
          </div>

          {/* Security badge */}
          <div className="mt-6 flex items-center justify-center text-gray-400">
            <Shield className="w-4 h-4 mr-2" />
            <span className="text-sm">Your data is secure with us</span>
          </div>

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <span className="text-indigo-200">Already have an account? </span>
            <button 
              onClick={handleLoginRedirect} 
              className="text-gray-300 hover:text-white font-semibold hover:underline transition-colors"
            >
              Sign in here
            </button>
          </div>
        </div>

        {/* Bottom features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '🚀', text: 'Fast Setup' },
            { icon: '🔒', text: 'Secure' },
            { icon: '✨', text: 'Modern' }
          ].map((feature, index) => (
            <div key={index} className="text-white/80">
              <div className="text-2xl mb-1">{feature.icon}</div>
              <div className="text-sm">{feature.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}