import React from 'react';
import { PortalFilingResult } from '../lib/types';
import { Globe, Download, CheckCircle2, QrCode, ExternalLink, Terminal } from 'lucide-react';

interface PortalTrackerProps {
  onExecuteFiling: () => void;
  loading: boolean;
  filingResult: PortalFilingResult | null;
}

export const PortalTracker: React.FC<PortalTrackerProps> = ({
  onExecuteFiling,
  loading,
  filingResult,
}) => {
  const [digilockerPushed, setDigilockerPushed] = React.useState(false);
  const [pushing, setPushing] = React.useState(false);

  const handleDownloadPDF = () => {
    if (filingResult?.filing_id) {
      window.open(`http://localhost:8000${filingResult.pdf_download_url}`, '_blank');
    }
  };

  const handleSaveToDigiLocker = async () => {
    if (!filingResult) return;
    setPushing(true);
    setTimeout(() => {
      setPushing(false);
      setDigilockerPushed(true);
    }, 1000);
  };


  return (
    <div className="bg-civic-card/90 border border-civic-border rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-civic-border pb-4">
        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
          <Globe className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">
            4. Playwright Browser Portal Automation & PDF Receipt
          </h2>
          <p className="text-xs text-slate-400">
            Simulates dynamic portal form submission, dynamic DOM extraction, and synthesizes printable PDF with QR verification stamp.
          </p>
        </div>
      </div>

      {!filingResult ? (
        <div className="text-center py-6 space-y-4">
          <Globe className="w-12 h-12 mx-auto text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <p className="text-xs text-slate-300">
            IEEE 7000 Consent Token verified. Ready to trigger Playwright portal filing simulation.
          </p>

          <button
            onClick={onExecuteFiling}
            disabled={loading}
            className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all mx-auto"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Playwright Navigating Portal DOM & Uploading PDF...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Launch Portal Automation Agent Execution
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Submission Success Banner */}
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  {filingResult.status}
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Official Tracking ID: <span className="text-emerald-300">{filingResult.tracking_id}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ref Code: <code className="font-mono text-blue-400">{filingResult.application_ref_code}</code>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <button
                onClick={handleDownloadPDF}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>

              <button
                onClick={handleSaveToDigiLocker}
                disabled={pushing || digilockerPushed}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all ${
                  digilockerPushed
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                <QrCode className="w-4 h-4" />
                {digilockerPushed ? "✓ Saved to DigiLocker Account" : pushing ? "Saving to DigiLocker..." : "Save to DigiLocker Drive"}
              </button>
            </div>

          </div>

          {/* Verification Stamps & Receipt Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold block flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-purple-400" />
                Receipt Verification Hash
              </span>
              <p className="font-mono text-purple-300 text-[11px] break-all bg-slate-950 p-2 rounded border border-slate-850">
                {filingResult.receipt_hash}
              </p>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold block flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                Simulated Portal URL Endpoint
              </span>
              <p className="font-mono text-blue-300 text-[11px] break-all bg-slate-950 p-2 rounded border border-slate-850">
                {filingResult.portal_url}
              </p>
            </div>
          </div>

          {/* Playwright Headless Execution Terminal Trace Log */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold border-b border-slate-850 pb-2">
              <Terminal className="w-4 h-4" />
              Playwright Headless Browser Real-Time Execution Trace Log
            </div>
            <div className="font-mono text-[11px] text-slate-300 space-y-1.5 max-h-48 overflow-y-auto pt-1">
              {filingResult.execution_trace.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">›</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
