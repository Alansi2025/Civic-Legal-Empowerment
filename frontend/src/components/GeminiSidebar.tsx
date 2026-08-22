import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, FileText, Megaphone, ShoppingBag, Landmark,
  Sparkles, History, Settings, UserCheck, ShieldCheck, Gem, BookOpen, Layers,
  Compass, AlertTriangle, MessageSquare
} from 'lucide-react';
import { api } from '../lib/api';


export interface ChatThreadItem {
  id: string;
  title: string;
  messages: any[];
  updatedAt: string;
}

interface GeminiSidebarProps {
  onNewChat: () => void;
  onSelectPreset: (promptText: string) => void;
  onSelectThread: (thread: ChatThreadItem) => void;
  activeThreadId?: string;
}

export const GeminiSidebar: React.FC<GeminiSidebarProps> = ({
  onNewChat, onSelectPreset, onSelectThread, activeThreadId
}) => {
  const router = useRouter();
  const [threads, setThreads] = useState<ChatThreadItem[]>([]);

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const res = await api.listConversations("guest");
        if (res && res.threads && res.threads.length > 0) {
          const formatted = res.threads.map((t: any) => ({
            id: t.thread_id,
            title: t.title || "Civic Legal Conversation",
            messages: t.messages || [],
            updatedAt: t.updated_at || new Date().toISOString()
          }));
          setThreads(formatted);
          localStorage.setItem('gemini_chat_threads', JSON.stringify(formatted));
          return;
        }
      } catch (err) {
        console.log("MongoDB fetch threads error, fallback to local:", err);
      }

      try {
        const stored = localStorage.getItem('gemini_chat_threads');
        if (stored) {
          setThreads(JSON.parse(stored));
        } else {
          const defaultRecents: ChatThreadItem[] = [
            {
              id: 'thread_1',
              title: 'Delhi MCD Pothole Grievance',
              messages: [{ id: 'm1', sender: 'user', text: 'File a road damage complaint for Delhi MCD Ward 42 on cmjansunwai.delhi.gov.in with geotagged photo.' }],
              updatedAt: new Date().toISOString()
            },
            {
              id: 'thread_2',
              title: 'NHAI National Highway Pothole',
              messages: [{ id: 'm2', sender: 'user', text: 'File an urgent hazard grievance to National Highways Authority of India (NHAI 1033 / MoRTH) for NH-48.' }],
              updatedAt: new Date().toISOString()
            }
          ];
          setThreads(defaultRecents);
        }
      } catch (e) {
        console.error("Error loading chat threads:", e);
      }
    };

    loadThreads();
    const interval = setInterval(loadThreads, 3000);
    return () => {
      clearInterval(interval);
    };
  }, []);


  return (
    <aside className="w-64 h-screen bg-[#1E1F20] text-slate-300 flex flex-col border-r border-[#2A2B2D] select-none flex-shrink-0">
      {/* Top Header & Brand */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Gemini 4-Star Colorful Sparkle */}
          <div className="relative w-6 h-6 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 via-purple-400 to-amber-400 animate-pulse" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">Legal Adviser AI</span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
            PRO
          </span>

        </div>
      </div>

      {/* Sub-Pills: Chat vs Supervisor */}
      <div className="px-4 mb-4">
        <div className="bg-[#131314] p-1 rounded-xl flex items-center text-xs font-medium">
          <button className="flex-1 py-1.5 rounded-lg bg-[#28292A] text-white text-center shadow">
            Chat
          </button>
          <button
            onClick={() => router.push('/supervisor')}
            className="flex-1 py-1.5 rounded-lg text-slate-400 hover:text-white text-center transition-all flex items-center justify-center gap-1"
          >
            Supervisor
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-full bg-[#131314] hover:bg-[#28292A] text-white text-xs font-semibold flex items-center gap-3 transition-all border border-[#2A2B2D]"
        >
          <Plus className="w-4 h-4 text-slate-300" />
          New chat
        </button>
      </div>

      {/* Navigation & Saved Recents List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 text-xs">
        <div className="pt-2 pb-1.5 px-3 text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
          <span>Recents</span>
          <span className="text-[10px] text-slate-500 font-normal">MongoDB Saved</span>
        </div>

        {threads.length === 0 ? (
          <p className="text-[11px] text-slate-500 px-3 py-2 italic">No past conversations saved yet.</p>
        ) : (
          threads.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectThread(item)}
              className={`w-full py-2.5 px-3 rounded-xl text-left flex items-center gap-2.5 transition-all ${
                activeThreadId === item.id ? 'bg-[#28292A] text-white font-medium shadow' : 'text-slate-400 hover:text-white hover:bg-[#28292A]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="truncate text-xs font-sans">{item.title}</span>
            </button>
          ))
        )}
      </div>


      {/* User Profile Bar at Bottom */}
      <div className="p-3 border-t border-[#2A2B2D] flex items-center justify-between">
        <div
          onClick={() => router.push('/settings')}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow">
            AS
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-tight">Aditya singh</p>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">Civic Prototype</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/settings')}
          className="p-1.5 rounded-lg hover:bg-[#28292A] text-slate-400 hover:text-white transition-all"
          title="User Profile & Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
