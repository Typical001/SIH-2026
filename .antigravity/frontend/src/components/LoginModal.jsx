import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Ship, 
  ShieldCheck, 
  Compass, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

export default function LoginModal({ isOpen, onClose, isMandatory = false }) {
  const { login, quickLogin } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [iceClass, setIceClass] = useState('Polar Class 3 (PC3)');
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Simulate network latency for authentic look
      await new Promise(r => setTimeout(r, 600));
      await login(email, password);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (roleKey) => {
    quickLogin(roleKey);
    if (onClose) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fadeIn"
      onClick={(e) => {
        if (!isMandatory && e.target === e.currentTarget && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-login-title"
    >
      <div className="relative w-full max-w-md bg-[#091327]/95 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden text-slate-100 backdrop-blur-xl">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Close Button (Hidden when mandatory auth is enforced) */}
        {!isMandatory && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close login modal"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Content */}
        <div className="px-6 pt-7 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mb-3 shadow-lg shadow-cyan-950/60">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <h2 id="modal-login-title" className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            PolarNav AI Command
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Southern Ocean Bridge Navigation & Decision Support System
          </p>
        </div>

        {/* Quick Demo Access Chips */}
        <div className="px-6 py-3 bg-cyan-950/30 border-y border-cyan-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Quick Demo Sign-In
            </span>
            <span className="text-[10px] text-slate-500">1-Click Access</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSelect('captain')}
              className="flex flex-col items-center p-2 rounded-lg bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700/60 hover:border-cyan-500/50 transition group"
            >
              <Ship className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-[10px] font-semibold text-slate-200">Capt. Vance</span>
              <span className="text-[8px] text-slate-400">PC3 Master</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('navigator')}
              className="flex flex-col items-center p-2 rounded-lg bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700/60 hover:border-cyan-500/50 transition group"
            >
              <ShieldCheck className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-[10px] font-semibold text-slate-200">Dr. Sharma</span>
              <span className="text-[8px] text-slate-400">Hydrographer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('admin')}
              className="flex flex-col items-center p-2 rounded-lg bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700/60 hover:border-cyan-500/50 transition group"
            >
              <UserIcon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-[10px] font-semibold text-slate-200">Cmdr. Lind</span>
              <span className="text-[8px] text-slate-400">Fleet HQ</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-6 pt-3">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition ${
              tab === 'login' 
                ? 'border-cyan-400 text-cyan-300' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition ${
              tab === 'signup' 
                ? 'border-cyan-400 text-cyan-300' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Officer Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs font-medium animate-fadeIn">
              {error}
            </div>
          )}

          {tab === 'signup' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Full Name & Title
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lt. Commander John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-lg text-xs text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Assigned Vessel Name
                </label>
                <div className="relative">
                  <Ship className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. INS Oceanus II"
                    value={vesselName}
                    onChange={(e) => setVesselName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-lg text-xs text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Officer Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="captain@polarnav.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-lg text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Security Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-lg text-xs text-white placeholder-slate-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tab === 'login' ? (
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                Remember Bridge Officer
              </label>
              <span className="text-cyan-400 hover:underline cursor-pointer">
                Reset Credentials
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Ice Class Qualification
              </label>
              <select
                value={iceClass}
                onChange={(e) => setIceClass(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-lg text-xs text-white outline-none transition"
              >
                <option value="Polar Class 1 (PC1)">Polar Class 1 (PC1) - Year-round all polar waters</option>
                <option value="Polar Class 2 (PC2)">Polar Class 2 (PC2) - Year-round moderate ice</option>
                <option value="Polar Class 3 (PC3)">Polar Class 3 (PC3) - Year-round second-year ice</option>
                <option value="Polar Class 4 (PC4)">Polar Class 4 (PC4) - Summer/autumn thick ice</option>
                <option value="Polar Class 5 (PC5)">Polar Class 5 (PC5) - Summer/autumn medium ice</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {tab === 'login' ? 'Authenticate Bridge Command' : 'Create Officer Profile'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            Polar Code Compliant (IMO SOLAS XVII) Security Standard
          </p>
        </div>
      </div>
    </div>
  );
}
