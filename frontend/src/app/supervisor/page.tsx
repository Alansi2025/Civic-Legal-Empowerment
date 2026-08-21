'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgentGraphVisualizer } from '../../components/AgentGraphVisualizer';
import { QAAuditPanel } from '../../components/QAAuditPanel';
import { api } from '../../lib/api';
import { SupervisorSummary, QAAuditReport } from '../../lib/types';
import { Scale, LogOut, ShieldCheck, Activity, Database, CheckCircle } from 'lucide-react';

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'supervisor' | 'qa' | 'database'>('supervisor');
  const [supervisorSummary, setSupervisorSummary] = useState<SupervisorSummary | null>(null);
  const [qaReport, setQAReport] = useState<QAAuditReport | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingQA, setLoadingQA] = useState(false);
  const [username, setUsername] = useState('supervisor');

  useEffect(() => {
    // Auth Check
    const token = localStorage.getItem('supervisor_token');
    const user = localStorage.getItem('supervisor_user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (user) setUsername(user);

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const summary = await api.getSupervisorLogs();
      setSupervisorSummary(summary);

      const hist = await api.getHistory();
      setHistory(hist);
    } catch (e) {
      console.log("Supervisor fetch note:", e);
    }
  };

  const fetchQAAudit = async () => {
    setLoadingQA(true);
    try {
      const rep = await api.getQAAudit();
      setQAReport(rep);
    } catch (e) {
      console.log("QA audit fetch note:", e);
    } finally {
      setLoadingQA(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('supervisor_token');
    localStorage.removeItem('supervisor_user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-civic-dark text-slate-100 flex flex-col">
      {/* Supervisor Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-civic-dark/85 border-b border-civic-border/60 px-6 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-civic-dark rounded-[10px] flex items-center justify-center">
                <Scale className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-white tracking-wide">
                  SUPERVISOR CONTROL CENTER
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  SECURE SESSION ({username.toUpperCase()})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous Re-ACT Telemetry & IEEE Audit Console
              </p>
            </div>
          </div>

          <nav className="flex items-center bg-civic-card/80 p-1.5 rounded-xl border border-civic-border/80">
            <button
              onClick={() => setActiveTab('supervisor')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'supervisor'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Multi-Agent Telemetry
            </button>

            <button
              onClick={() => {
                setActiveTab('qa');
                if (!qaReport) fetchQAAudit();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'qa'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              IEEE Audit Panel
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'database'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              SQLite Audit Store ({history.length})
            </button>
          </nav>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Supervisor Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {activeTab === 'supervisor' && (
          <AgentGraphVisualizer
            supervisorSummary={supervisorSummary}
            currentAgent="QAAuditAgent"
          />
        )}

        {activeTab === 'qa' && (
          <QAAuditPanel
            auditReport={qaReport}
            onRefreshAudit={fetchQAAudit}
            loading={loadingQA}
          />
        )}

        {activeTab === 'database' && (
          <div className="bg-civic-card/90 border border-civic-border rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Persistent Filing History & Cryptographic Receipts
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-civic-border bg-slate-900/80 text-slate-400 font-mono">
                    <th className="p-3">Filing ID</th>
                    <th className="p-3">Tracking ID</th>
                    <th className="p-3">Ref Code</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Receipt Hash</th>
                    <th className="p-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-mono">
                  {history.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-3 font-bold text-blue-400">{row.filing_id}</td>
                      <td className="p-3 text-emerald-400">{row.tracking_id}</td>
                      <td className="p-3 text-slate-300">{row.application_ref_code}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-purple-300">{row.receipt_hash.slice(0, 16)}...</td>
                      <td className="p-3 text-slate-400">{row.created_at}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                        No persistent filings logged in SQLite database yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
