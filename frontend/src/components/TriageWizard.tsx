import React, { useState } from 'react';
import { GrievanceInput, TriageResult } from '../lib/types';
import { Sparkles, Send, MapPin, Languages, ArrowRight, CheckCircle, HelpCircle, Mic } from 'lucide-react';


interface TriageWizardProps {
  onRunTriage: (input: GrievanceInput) => Promise<TriageResult | null>;
  loading: boolean;
  triageResult: TriageResult | null;
  onProceedToDrafting: () => void;
}

export const TriageWizard: React.FC<TriageWizardProps> = ({
  onRunTriage,
  loading,
  triageResult,
  onProceedToDrafting,
}) => {
  const [rawText, setRawText] = useState('');
  const [language, setLanguage] = useState('English');
  const [location, setLocation] = useState('Ward 42, Municipal Zone');
  const [isRecording, setIsRecording] = useState(false);
  const [audioTranscribing, setAudioTranscribing] = useState(false);

  const handleSimulateVoiceInput = async () => {
    setIsRecording(true);
    setAudioTranscribing(true);
    setTimeout(() => {
      setIsRecording(false);
      setAudioTranscribing(false);
      setRawText("I want to file an RTI to inspect public road works expenditure and tender copies in Ward 42.");
      setLanguage("Hindi");
    }, 1500);
  };


  const presets = [
    {
      title: 'RTI Road Construction Inspection',
      text: 'I want to file an RTI to inspect the expenditure budget, certified tender copies, and Measurement Book entries for road repair work in Ward 42.',
      location: 'Ward 42, PWD Division',
      lang: 'English'
    },
    {
      title: 'Defective Appliance Consumer Refund',
      text: 'I purchased a refrigerator with 2-year warranty for Rs. 35,000. It broke down after 2 weeks and the vendor refuses to repair or refund money.',
      location: 'District Consumer Forum',
      lang: 'English'
    },
    {
      title: 'Municipal Overflowing Sewage Complaint',
      text: 'Open drainage and overflowing sewage on Main Market Road Ward 14 causing extreme health hazard and traffic blockage for 3 weeks.',
      location: 'Ward 14, Municipal Corporation',
      lang: 'English'
    },
    {
      title: 'Delayed Pension CPGRAMS Petition',
      text: 'Central government pension payment delayed for over 8 months despite submitting all life certificates and verification documents.',
      location: 'Department of Pensions & Public Grievances',
      lang: 'English'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    onRunTriage({
      citizen_id: `citizen_${Math.random().toString(36).substring(7)}`,
      language,
      raw_text: rawText,
      location_details: location
    });
  };

  return (
    <div className="space-y-6">
      {/* Preset Quick-Fill Cards */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Quick-Fill Civic Scenario Presets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setRawText(p.text);
                setLocation(p.location);
                setLanguage(p.lang);
              }}
              className="text-left bg-civic-card/80 hover:bg-slate-800/80 border border-civic-border hover:border-blue-500/50 rounded-xl p-3.5 transition-all duration-200 group"
            >
              <h4 className="text-xs font-bold text-white group-hover:text-blue-400 flex items-center justify-between">
                {p.title}
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                "{p.text}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Intake Form */}
      <div className="bg-civic-card/90 border border-civic-border rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white">
            1. Multilingual Citizen Intake & Statutory AI Classifier
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-blue-400" />
                Input Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-900 border border-civic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Location / Municipal Zone
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ward 42, District Administrative Office"
                className="w-full bg-slate-900 border border-civic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Describe Your Civic Grievance or Information Requirement (Plain Language or Voice)
              </label>
              <button
                type="button"
                onClick={handleSimulateVoiceInput}
                disabled={audioTranscribing}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                {audioTranscribing ? "Sarvam AI Transcribing Voice..." : "Record Voice Intake (Sarvam AI Speech)"}
              </button>
            </div>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="State what occurred, who responsible, or what official records/action you require (or use Sarvam AI voice recording)..."
              className="w-full bg-slate-900 border border-civic-border rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>


          <button
            type="submit"
            disabled={loading || !rawText.trim()}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Agent Evaluating Indian Statutory Framework...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Trigger Legal Triage Agent Evaluation
              </>
            )}
          </button>
        </form>
      </div>

      {/* Structured Triage Output Display */}
      {triageResult && (
        <div className="bg-civic-card/90 border border-blue-500/50 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-civic-border pb-4">
            <div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                Statutory Pathway Identified
              </span>
              <h3 className="text-lg font-extrabold text-white mt-1">
                {triageResult.pathway}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Classification Confidence</span>
              <p className="text-sm font-bold text-emerald-400">
                {(triageResult.confidence_score * 100).toFixed(0)}% Match
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-1">Target Public Authority</span>
              <span className="text-white font-bold">{triageResult.public_authority}</span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-1">Invoked Statutory Provisions</span>
              <ul className="list-disc list-inside text-slate-200 space-y-0.5">
                {triageResult.statutory_sections.map((sec, i) => (
                  <li key={i}>{sec}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 block font-semibold mb-1">Structured Case Summary</span>
            <p className="text-slate-200">{triageResult.summary}</p>
          </div>

          {triageResult.follow_up_questions.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200">
              <span className="font-bold flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Guided Clarifying Questions
              </span>
              <ul className="list-disc list-inside space-y-1 text-amber-100">
                {triageResult.follow_up_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onProceedToDrafting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Proceed to Statutory Drafting Agent
          </button>
        </div>
      )}
    </div>
  );
};
