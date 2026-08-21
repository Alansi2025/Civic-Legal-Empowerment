import React, { useState } from 'react';
import { StatutoryDraft, PIIAnalysisResult } from '../lib/types';
import { FileText, Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react';

interface LegalCanvasProps {
  draft: StatutoryDraft | null;
  piiResult: PIIAnalysisResult | null;
  onProceedToConsent: () => void;
}

export const LegalCanvas: React.FC<LegalCanvasProps> = ({ draft, piiResult, onProceedToConsent }) => {
  const [showMasked, setShowMasked] = useState(true);

  if (!draft) {
    return (
      <div className="bg-civic-card/80 border border-civic-border rounded-2xl p-8 text-center text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
        <p className="text-sm font-semibold">No statutory draft generated yet.</p>
        <p className="text-xs mt-1">Complete Step 1 (Intake & Triage) to populate the legal drafting canvas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-civic-card/90 border border-civic-border rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {draft.draft_id}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {draft.word_count} Words | {draft.character_count} Chars
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">{draft.title}</h2>
          </div>

          {/* Masked vs Unmasked Toggle */}
          <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setShowMasked(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showMasked ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              Privacy Protected (PII Redacted)
            </button>
            <button
              onClick={() => setShowMasked(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                !showMasked ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Unmasked (Citizen View)
            </button>
          </div>
        </div>

        {/* PII Detection Warning Banner */}
        {piiResult?.has_pii && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-300">
            <ShieldAlert className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold">Privacy Shield Active: Sensitive Information Protected</p>
              <p className="text-[11px] text-emerald-200 mt-0.5">
                Detected and masked {piiResult.detected_items.length} sensitive identity items (Aadhaar, Phone, Email).
                Privacy Hash: <code className="font-mono">{piiResult.privacy_hash.slice(0, 16)}...</code>
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Main Document Preview Canvas */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl font-serif text-slate-200 leading-relaxed space-y-6">
        <div className="text-center border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white tracking-wide uppercase">{draft.title}</h3>
          <p className="text-xs text-slate-400 font-sans mt-1">
            TO THE {(draft.pio_designation || 'Public Information Officer').toUpperCase()}, {draft.public_authority.toUpperCase()}
          </p>

        </div>

        <div>
          <h4 className="text-xs font-sans font-bold text-blue-400 uppercase tracking-wider mb-2">
            STATEMENT OF FACTS
          </h4>
          <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-900/50 p-4 rounded-xl border border-slate-850">
            {showMasked && piiResult ? piiResult.redacted_text : draft.statement_of_facts}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-sans font-bold text-blue-400 uppercase tracking-wider mb-2">
            SPECIFIC NUMBERED INQUIRY / RELIEF POINTS
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-200">
            {draft.statutory_queries.map((q, idx) => (
              <li key={idx} className="bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                {q}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider font-sans mb-2">
            STATUTORY CITATIONS & LEGAL GROUNDS:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
            {(draft.legal_grounds || draft.citations || []).map((g, idx) => (
              <li key={idx}>{g}</li>
            ))}
          </ul>

        </div>
      </div>

      {/* Next Step Action Button */}
      <button
        onClick={onProceedToConsent}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
      >
        <ArrowRight className="w-4 h-4" />
        Proceed to Step 3: Citizen Verification & DigiLocker Gate
      </button>

    </div>
  );
};
