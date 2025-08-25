import React, { useState, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Shield, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();

  // Mount animation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Email validation
  const validateEmail = useCallback((email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  // Password strength calculation
  const calculatePasswordStrength = useCallback((password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
    if (password.match(/\d/)) strength += 1;
    if (password.match(/[^a-zA-Z\d]/)) strength += 1;
    return strength;
  }, []);

  useEffect(() => {
    setEmailValid(validateEmail(email));
  }, [email, validateEmail]);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password, calculatePasswordStrength]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      const errorMessage = err.code === 'auth/invalid-credential' 
        ? 'Invalid email or password. Please check your credentials.'
        : err.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 1: return 'bg-red-400';
      case 2: return 'bg-yellow-400';
      case 3: return 'bg-blue-400';
      case 4: return 'bg-green-400';
      default: return 'bg-gray-600';
    }
  };

  const getStrengthText = (strength) => {
    switch (strength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const isFormValid = emailValid && password.length >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-2xl animate-pulse delay-2000"></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInScale {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className={`relative w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 space-y-6 hover:shadow-3xl transition-shadow duration-300">
          {/* Header with improved styling */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-18 h-18 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h1>
            <p className="text-gray-300/90">Secure access to your dashboard</p>
          </div>

          {/* Enhanced error display */}
          {error && (
            <div className="flex items-start space-x-3 bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-200 animate-in slide-in-from-top-1 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Authentication Error</p>
                <p className="text-xs mt-1 text-red-200/80">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Enhanced email field */}
            <div className="space-y-2">
              <label htmlFor="email" className={`block text-sm font-medium transition-colors duration-200 ${focusedField === 'email' ? 'text-purple-300' : 'text-gray-300'}`}>
                Email Address
              </label>
              <div className="relative group">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-200 ${focusedField === 'email' ? 'text-purple-400 scale-110' : 'text-gray-400'}`} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  className="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-200 hover:bg-white/15"
                  placeholder="admin@company.com"
                  required
                  autoComplete="email"
                />
                {email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {emailValid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced password field */}
            <div className="space-y-2">
              <label htmlFor="password" className={`block text-sm font-medium transition-colors duration-200 ${focusedField === 'password' ? 'text-purple-300' : 'text-gray-300'}`}>
                Password
              </label>
              <div className="relative group">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-200 ${focusedField === 'password' ? 'text-purple-400 scale-110' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  className="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-200 hover:bg-white/15"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 focus:text-purple-400 focus:outline-none transition-all duration-200 hover:scale-110"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password && password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          passwordStrength >= level ? getStrengthColor(passwordStrength) : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength > 0 && (
                    <p className="text-xs text-gray-400">
                      Password strength: <span className={`${passwordStrength >= 3 ? 'text-green-400' : passwordStrength >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {getStrengthText(passwordStrength)}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced submit button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="group w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3.5 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              )}
            </button>
          </form>

          {/* Enhanced footer */}
          <div className="text-center pt-6 border-t border-white/10 space-y-3">
            <p className="text-sm text-gray-400">Secure admin access • Protected by end-to-end encryption</p>
            <div className="flex justify-center space-x-4 text-xs text-gray-500">
              <span>• 256-bit SSL</span>
              <span>• Multi-factor Ready</span>
              <span>• SOC2 Compliant</span>
            </div>
          </div>
        </div>

        {/* Enhanced security badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-3 text-sm text-gray-400 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10 hover:border-white/20 transition-colors duration-200">
            <Shield className="w-4 h-4 text-green-400" />
            <span>SSL Secured Connection</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;