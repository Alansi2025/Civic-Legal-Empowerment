'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('supervisor');
  const [password, setPassword] = useState('supervisor123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.loginSupervisor(username, password);
      if (res.success) {
        localStorage.setItem('supervisor_token', res.token);
        localStorage.setItem('supervisor_user', res.username);
        router.push('/supervisor');
      } else {
        setError(res.message || 'Invalid supervisor credentials.');
      }
    } catch (err: any) {
      setError('Could not connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-civic-dark text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-civic-card/90 border border-civic-border rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Brand & Emblem */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20 mx-auto">
            <div className="w-full h-full bg-civic-dark rounded-[14px] flex items-center justify-center">
              <Scale className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">
            SUPERVISOR & ADMIN PORTAL
          </h1>
          <p className="text-xs text-slate-400">
            Autonomous Re-ACT Multi-Agent System Control Center
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Supervisor Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or supervisor"
              className="w-full bg-slate-900 border border-civic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Security Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-civic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Default Supervisor Credentials: <code className="text-blue-400 font-mono">supervisor / supervisor123</code></span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Authenticate Supervisor Session
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            ← Return to Citizen Intake Portal
          </button>
        </div>
      </div>
    </div>
  );
}
