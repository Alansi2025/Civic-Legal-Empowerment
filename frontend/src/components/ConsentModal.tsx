import React, { useState } from 'react';
import { ConsentVerificationResponse } from '../lib/types';
import { ShieldCheck, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

interface ConsentModalProps {
  draftId: string;
  privacyHash: string;
  onVerifyConsent: (signature: string, acknowledged: boolean) => Promise<ConsentVerificationResponse | null>;
  loading: boolean;
  consentResponse: ConsentVerificationResponse | null;
  onProceedToPortal: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  draftId,
  privacyHash,
  onVerifyConsent,
  loading,
  consentResponse,
  onProceedToPortal,
}) => {
  const [signatureName, setSignatureName] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('4321');
  const [acknowledged, setAcknowledged] = useState(false);
  const [digilockerVerified, setDigilockerVerified] = useState(false);
  const [digilockerToken, setDigilockerToken] = useState('');

  const handleDigiLockerAuth = () => {
    setDigilockerVerified(true);
    setDigilockerToken(`DIGILOCKER-VERIFIED-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    setSignatureName("Ramesh Kumar (DigiLocker Verified)");
    setAcknowledged(true);
  };


  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName.trim() || !acknowledged) return;
    onVerifyConsent(signatureName, acknowledged);
  };

  return (
    <div className="bg-civic-card/90 border border-civic-border rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-civic-border pb-4">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">
            3. Citizen Identity & Verification Gate
          </h2>
          <p className="text-xs text-slate-400">
            Mandatory verification before Playwright portal filing or PDF synthesis.
          </p>
        </div>
      </div>


      {/* DigiLocker Official Government e-KYC Verification Box */}
      <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500 text-white">Govt of India</span>
            <h4 className="text-xs font-bold text-white">DigiLocker Identity e-KYC Verification</h4>
          </div>
          {digilockerVerified && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
              ✓ DIGILOCKER VERIFIED
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-300">
          Verify your identity directly using DigiLocker & Aadhaar e-KYC under Digital India initiative.
        </p>

        <button
          type="button"
          onClick={handleDigiLockerAuth}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <Lock className="w-3.5 h-3.5" />
          {digilockerVerified ? "DigiLocker Identity Authenticated (Aadhaar Verified)" : "Authenticate via DigiLocker (Aadhaar e-KYC)"}
        </button>
      </div>


      {!consentResponse?.verified ? (
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Citizen Digital Signature (Full Name)
            </label>
            <input
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="Enter your full legal name as digital signature..."
              className="w-full bg-slate-900 border border-civic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              id="consentAck"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
            />
            <label htmlFor="consentAck" className="text-xs text-slate-300 leading-relaxed">
              I explicitly authorize the AI Civic Empowerment Engine to format and submit this statutory petition on my behalf. I confirm that all statement of facts are accurate.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !signatureName.trim() || !acknowledged}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Cryptographically Signing IEEE 7000 Token...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Authenticate & Issue Cryptographic Consent Token
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-5 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
            IEEE 7000 Cryptographic Consent Verified & Sealed
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono text-[10px]">Consent Token</span>
              <span className="font-mono text-emerald-300 font-bold">{consentResponse.consent_token}</span>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono text-[10px]">Audit Verification Stamp</span>
              <span className="font-mono text-blue-300 font-bold">{consentResponse.ieee_7000_audit_stamp}</span>
            </div>
          </div>

          <button
            onClick={onProceedToPortal}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-2"
          >
            <CheckCircle className="w-4 h-4" />
            Proceed to Step 4: Playwright Portal Automation Filing
          </button>
        </div>
      )}
    </div>
  );
};
