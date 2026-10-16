import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, Building2, Cpu, User, UserPlus, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign up form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState('admin');
  const [signupDepartment, setSignupDepartment] = useState('Administration');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.login(email.trim(), password);
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setError('Login failed: Token not received.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!signupName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.signup({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        role: signupRole,
        department: signupDepartment.trim() || 'Administration'
      });

      if (res.token) {
        setSuccessMsg('Account created successfully! Redirecting to dashboard...');
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(res.user);
          }
        }, 600);
      } else {
        setSuccessMsg('Account registered successfully! You can now sign in.');
        setEmail(signupEmail.trim());
        setPassword(signupPassword);
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoAdmin = () => {
    setEmail('admin@salaryenroll.com');
    setPassword('Admin@12345');
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Emblem */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-black text-2xl shadow-md border-2 border-white">
            ₹
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Salary Enroll Pay System
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 font-medium">
          Enterprise Payroll, PF & ESIC Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-7 px-6 shadow-sm rounded-xl border border-slate-200 sm:px-9">
          
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-center text-xs font-semibold border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-center text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account / Sign Up
            </button>
          </div>

          {/* Header Info */}
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
            {mode === 'login' ? (
              <>
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Administrator Sign In</h3>
                  <p className="text-[11px] text-slate-400">Authorized personnel only</p>
                </div>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Register New Account</h3>
                  <p className="text-[11px] text-slate-400">Create an authorized manager/admin profile</p>
                </div>
              </>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'login' && (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@salaryenroll.com"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                  {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  Need a new account? Click here to Sign Up
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP / REGISTER FORM */}
          {mode === 'signup' && (
            <form className="space-y-3.5" onSubmit={handleSignupSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Lasya Nekkanti"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value)}
                    className="block w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800 bg-white"
                  >
                    <option value="admin">Administrator</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="compliance_officer">Compliance Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value)}
                    placeholder="Administration"
                    className="block w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account & Sign In'}
                  {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  Already have an account? Sign In here
                </button>
              </div>
            </form>
          )}

          {/* Quick Access Card (Only shown on login mode) */}
          {mode === 'login' && (
            <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50/80 -mx-6 -mb-7 px-6 py-3.5 rounded-b-xl">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-medium text-slate-500">Initial System Admin:</span>
                <button
                  type="button"
                  onClick={handleUseDemoAdmin}
                  className="font-semibold text-sky-600 hover:text-sky-700 underline text-[11px]"
                >
                  Auto-fill Admin Credentials
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                admin@salaryenroll.com / Admin@12345
              </p>
            </div>
          )}
        </div>

        {/* System Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            MongoDB Atlas Connected
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            C++17 Engine Integrated
          </span>
        </div>
      </div>
    </div>
  );
}
