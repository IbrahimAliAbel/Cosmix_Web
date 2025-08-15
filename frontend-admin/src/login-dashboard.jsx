import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

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
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success) {
        const { token, user } = data.data;

        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));

        setSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
          if (user.role === 'admin') {
            handleNavigate('/admin');
          } else {
            handleNavigate('/user');
          }
        }, 1500);
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    handleNavigate('/register');
  };

  const handleForgotPassword = () => {
    alert('In a real app, this would navigate to the forgot password page.');
  };

   return (
    <div className="h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-slate-800 flex items-center justify-center px-4 relative overflow-hidden fixed inset-0">
      {/* Elegant background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-white/5 to-gray-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-gray-400/10 to-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-gray-600/5 to-white/5 rounded-full blur-3xl animate-pulse"></div>
        
        {/* Elegant grid pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent"></div>
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

         {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

         <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-800 to-black border border-gray-700 rounded-2xl mb-4 shadow-2xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome To Fashion Design</h1>
          <p className="text-gray-400 text-lg font-light">Stand Out with Style</p>
        </div>

          {/* Main card */}
        <div className="bg-black/40 backdrop-blur-xl border border-gray-800/50 p-8 rounded-3xl shadow-2xl ring-1 ring-white/10">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-900/30 border border-red-800/40 flex items-center backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

        {/* Success message */}
          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 backdrop-blur-sm">
              <p className="text-emerald-300 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 to-gray-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <Mail className="absolute top-4 left-4 text-gray-400 z-10 group-focus-within:text-white transition-colors duration-300" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="relative z-10 w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-gray-600 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/50 hover:border-gray-600/50"
                placeholder="Email Address"
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 to-gray-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <Lock className="absolute top-4 left-4 text-gray-400 z-10 group-focus-within:text-white transition-colors duration-300" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="relative z-10 w-full pl-12 pr-12 py-4 bg-gray-900/50 border border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-gray-600 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/50 hover:border-gray-600/50"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-300 z-10"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-sm text-pink-300 hover:text-pink-200 font-medium transition-colors disabled:opacity-50"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-4 bg-white text-black rounded-2xl hover:bg-gray-100 transition-all duration-300 flex justify-center items-center font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-6 w-6 border-b-2 border-black mr-3 rounded-full" />
                  Signing In...
                </div>
              ) : (
                <>
                  Sign In ok
                  <ArrowRight className="ml-2" size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center text-gray-400">
            <Shield className="w-4 h-4 mr-2" />
            <span className="text-sm">Your data is secure with us</span>
          </div>

           {/* Register link */}
          <div className="mt-6 text-center">
            <span className="text-gray-400">Don't have an account? </span>
            <button 
              onClick={handleRegister} 
              className="text-white hover:text-gray-300 font-semibold hover:underline transition-colors duration-300"
            >
              Create account
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '🔐', text: 'Secure Login' },
            { icon: '⚡', text: 'Fast Access' },
            { icon: '✨', text: 'Modern UI' }
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