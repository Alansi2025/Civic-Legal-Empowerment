import React from 'react';
import { SupervisorSummary } from '../lib/types';
import { Bot, Shield, FileText, Globe, CheckCircle2, Cpu, Activity, Clock } from 'lucide-react';

interface AgentGraphVisualizerProps {
  supervisorSummary: SupervisorSummary | null;
  currentAgent: string;
}

export const AgentGraphVisualizer: React.FC<AgentGraphVisualizerProps> = ({ supervisorSummary, currentAgent }) => {
  const agentsList = [
    {
      id: 'TriageAgent',
      name: '1. Legal Triage & Routing Agent',
      role: 'Statutory Pathway Classifier (RTI / CPGRAMS / Consumer / Municipal)',
      icon: Bot,
      color: 'from-blue-500 to-cyan-400',
      badge: 'Gemini 3.7 Flash'
    },
    {
      id: 'DraftingAgent',
      name: '2. Statutory RTI & Grievance Drafting Agent',
      role: 'Section 6(1) Query Generator & Legal Section Citations',
      icon: FileText,
      color: 'from-indigo-500 to-purple-400',
      badge: 'Gemini 3.7 Flash'
    },
    {
      id: 'ConsentAgent',
      name: '3. PII & IEEE 7000 Consent Guardrail Agent',
      role: 'RegEx + LLM Aadhaar/PAN Redactor & Human Signature Gate',
      icon: Shield,
      color: 'from-emerald-500 to-teal-400',
      badge: 'IEEE 7000 Standard'
    },
    {
      id: 'PortalAgent',
      name: '4. Browser & Portal Automation Agent',
      role: 'Playwright Headless Navigation & Verifiable PDF Engine',
      icon: Globe,
      color: 'from-amber-500 to-orange-400',
      badge: 'Playwright Engine'
    },
    {
      id: 'QAAuditAgent',
      name: '5. IEEE QA & Code Evaluation Agent',
      role: 'Static AST Complexity Auditor & IEEE 829/730 V&V Verifier',
      icon: CheckCircle2,
      color: 'from-pink-500 to-rose-400',
      badge: 'IEEE 829/730 Standard'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Telemetry Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-civic-card/90 border border-civic-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Supervisor Status</p>
            <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {supervisorSummary?.supervisor_status || 'ACTIVE_SUPERVISION'}
            </p>
          </div>
        </div>

        <div className="bg-civic-card/90 border border-civic-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Telemetry Events</p>
            <p className="text-xl font-extrabold text-white">
              {supervisorSummary?.total_events_logged || 0}
            </p>
          </div>
        </div>

        <div className="bg-civic-card/90 border border-civic-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Multi-Agent Verification</p>
            <p className="text-sm font-bold text-white">5 Agents Connected</p>
          </div>
        </div>
      </div>

      {/* 5-Agent Interactive Topology Card Grid */}
      <div className="bg-civic-card/90 border border-civic-border rounded-2xl p-6 shadow-2xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-blue-400" />
          IEEE Multi-Agent System (MAS) Topology & Work Logs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {agentsList.map((ag) => {
            const IconComponent = ag.icon;
            const count = supervisorSummary?.agent_activity_counts?.[ag.name] || 0;
            const isActive = currentAgent === ag.id;

            return (
              <div
                key={ag.id}
                className={`relative rounded-xl p-4 transition-all duration-300 border ${
                  isActive
                    ? 'bg-blue-950/40 border-blue-500 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/50'
                    : 'bg-slate-900/60 border-civic-border hover:border-slate-600'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${ag.color} p-0.5 mb-3`}>
                  <div className="w-full h-full bg-civic-dark rounded-[7px] flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {ag.badge}
                  </span>
                  <span className="text-xs font-semibold text-blue-400">
                    {count} events
                  </span>
                </div>

                <h3 className="font-bold text-xs text-white line-clamp-2 mt-2 leading-tight">
                  {ag.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-3">
                  {ag.role}
                </p>

                {isActive && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-bold animate-bounce shadow-md">
                    EXECUTING
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Supervisor Event Feed */}
      <div className="bg-civic-card/90 border border-civic-border rounded-2xl p-6 shadow-2xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-400" />
          Supervisor Real-Time Event Log & Telemetry Feed
        </h3>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs max-h-64 overflow-y-auto space-y-2">
          {supervisorSummary?.recent_events && supervisorSummary.recent_events.length > 0 ? (
            supervisorSummary.recent_events.map((ev, idx) => (
              <div key={ev.event_id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-1.5 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">[{ev.timestamp.split('T')[1]?.slice(0, 8)}]</span>
                  <span className="text-emerald-400 font-bold">{ev.agent_name}:</span>
                  <span className="text-slate-200">{ev.action}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className={`px-1.5 py-0.5 rounded ${ev.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                    {ev.status}
                  </span>
                  <span>{ev.execution_time_ms.toFixed(1)}ms</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 italic">No supervisor events recorded yet. Run a citizen intake to trigger telemetry.</p>
          )}
        </div>
      </div>
    </div>
  );
};
