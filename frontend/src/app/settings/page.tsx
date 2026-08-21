'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, ShieldCheck, Globe, Lock, Volume2, ArrowLeft, Save,
  CheckCircle2, Scale, Key, Smartphone, Mail, Database, UserCheck,
  FileText, Upload, Check, AlertCircle, Trash2, Plus
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  // User Profile State
  const [fullName, setFullName] = useState('Aditya Singh');
  const [email, setEmail] = useState('aditya.singh@civic.gov.in');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
  const [voiceSpeed, setVoiceSpeed] = useState('1.0x');
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [digilockerAutoSync, setDigilockerAutoSync] = useState(true);
  const [piiMaskingDefault, setPiiMaskingDefault] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Stored Legal Document Vault State
  const [documents, setDocuments] = useState([
    {
      id: 'doc_1',
      category: 'Identity Proof',
      title: 'Aadhaar Card (UIDAI Verified)',
      refNo: 'XXXX-XXXX-4321',
      status: 'VERIFIED',
      type: 'IDENTITY'
    },
    {
      id: 'doc_2',
      category: 'RTI Fee Exemption',
      title: 'Below Poverty Line (BPL) Certificate',
      refNo: 'BPL-2025-98741',
      status: 'ATTACHED',
      type: 'RTI'
    },
    {
      id: 'doc_3',
      category: 'PIL Affidavit',
      title: 'Sworn Affidavit of Non-Personal Interest',
      refNo: 'AFF-NOTARY-8842',
      status: 'VERIFIED',
      type: 'PIL'
    },
    {
      id: 'doc_4',
      category: 'Municipal Locus Standi',
      title: 'Property Tax Receipt / Residency Proof',
      refNo: 'MCD-TAX-2025-6610',
      status: 'ATTACHED',
      type: 'MUNICIPAL'
    },
    {
      id: 'doc_5',
      category: 'Prior Evidence',
      title: 'Prior Administrative Complaint Receipt',
      refNo: 'CPGRAMS-REF-330192',
      status: 'ATTACHED',
      type: 'EVIDENCE'
    }
  ]);

  const [newDocCategory, setNewDocCategory] = useState('Identity Proof');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocRef, setNewDocRef] = useState('');

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocRef.trim()) return;

    setDocuments(prev => [
      ...prev,
      {
        id: `doc_${Date.now()}`,
        category: newDocCategory,
        title: newDocTitle,
        refNo: newDocRef,
        status: 'ATTACHED',
        type: newDocCategory.toUpperCase()
      }
    ]);

    setNewDocTitle('');
    setNewDocRef('');
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_documents_vault', JSON.stringify(documents));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#131314] text-slate-100 flex flex-col font-sans">
      {/* Settings Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#1E1F20]/90 border-b border-[#2A2B2D] px-6 py-4 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-xl bg-[#28292A] hover:bg-[#37393B] text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </button>
            <div className="h-5 w-px bg-slate-700"></div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              User Profile & Platform Settings
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                Civic Prototype
              </span>
            </h1>
          </div>

          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" />
            Save Profile & Vault
          </button>
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {savedSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-300 shadow-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Profile details and Legal Document Vault successfully saved for AI Chatbot auto-fetch!</span>
          </div>
        )}

        {/* User Identity Profile Card */}
        <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#2A2B2D] pb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                AS
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{fullName}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Citizen ID: <code className="text-blue-400 font-mono">CTZ-894201</code></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono">Verified Account</span>
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              Account Status: Civic Prototype
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Full Legal Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#131314] border border-[#2A2B2D] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#131314] border border-[#2A2B2D] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Mobile Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#131314] border border-[#2A2B2D] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Legal Document Vault & Annexure Repository */}
        <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#2A2B2D] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Legal Document Vault & Statutory Annexure Repository
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Store your PIL affidavits, RTI fee tokens, BPL certificates, and Municipal residency proofs for automated AI complaint filing.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
              {documents.length} Docs Stored
            </span>
          </div>

          {/* Document Add Form */}
          <form onSubmit={handleAddDocument} className="bg-[#131314] p-4 rounded-2xl border border-[#2A2B2D] space-y-3">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-400" />
              Add Statutory Annexure / Proof Document
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Document Category</label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full bg-[#1E1F20] border border-[#2A2B2D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Identity Proof">Identity Proof (Aadhaar / Voter ID / Passport)</option>
                  <option value="PIL Affidavit">PIL Affidavit of Non-Personal Interest</option>
                  <option value="RTI Fee Exemption">RTI Fee / BPL Certificate / IPO Receipt</option>
                  <option value="Municipal Locus Standi">Municipal Residency / Property Tax Receipt</option>
                  <option value="Prior Evidence">Prior Representation / Complaint Ack</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Document Title</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Sworn Notarized Affidavit Copy"
                  className="w-full bg-[#1E1F20] border border-[#2A2B2D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Reference / Certificate Number</label>
                <input
                  type="text"
                  value={newDocRef}
                  onChange={(e) => setNewDocRef(e.target.value)}
                  placeholder="e.g. AFF-NOTARY-2025-998"
                  className="w-full bg-[#1E1F20] border border-[#2A2B2D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload & Attach Document to Vault
            </button>
          </form>

          {/* Stored Documents Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-[#2A2B2D] bg-[#131314] text-slate-400 font-mono">
                  <th className="p-3">Category</th>
                  <th className="p-3">Document Title</th>
                  <th className="p-3">Reference / Cert Number</th>
                  <th className="p-3">Verification Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2B2D]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#131314]/50">
                    <td className="p-3 font-semibold text-blue-400">{doc.category}</td>
                    <td className="p-3 text-white font-medium">{doc.title}</td>
                    <td className="p-3 font-mono text-slate-300">{doc.refNo}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <Check className="w-3 h-3" />
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-all"
                        title="Remove Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Language & Sarvam AI Voice Engine */}
        <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Regional Indian Speech & Language Preferences (Sarvam AI)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Preferred Regional Dialect
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-[#131314] border border-[#2A2B2D] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                <option value="Malayalam">Malayalam (മലയാളം)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                <option value="English">English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Voice Playback Speed
              </label>
              <select
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(e.target.value)}
                className="w-full bg-[#131314] border border-[#2A2B2D] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="0.8x">0.8x (Slower)</option>
                <option value="1.0x">1.0x (Normal)</option>
                <option value="1.2x">1.2x (Faster)</option>
              </select>
            </div>

            <div className="flex items-center justify-between bg-[#131314] p-3 rounded-xl border border-[#2A2B2D] mt-5">
              <div>
                <p className="text-xs font-semibold text-white">Auto-play Voice Synthesis</p>
                <p className="text-[10px] text-slate-400">Play spoken responses automatically</p>
              </div>
              <input
                type="checkbox"
                checked={autoPlayAudio}
                onChange={(e) => setAutoPlayAudio(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* DigiLocker & Privacy Encryption Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DigiLocker e-KYC Vault */}
          <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              DigiLocker Government e-KYC Vault
            </h3>

            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Aadhaar Connected via UIDAI DigiLocker
              </p>
              <p className="text-[11px] text-emerald-200">
                Verified Document Drive Token: <code className="font-mono text-white">DL-AADHAAR-2CBAC96D</code>
              </p>
            </div>

            <div className="flex items-center justify-between bg-[#131314] p-3.5 rounded-xl border border-[#2A2B2D]">
              <div>
                <p className="text-xs font-semibold text-white">Auto-Push Receipts to DigiLocker</p>
                <p className="text-[11px] text-slate-400">Save filed petitions directly to personal drive</p>
              </div>
              <input
                type="checkbox"
                checked={digilockerAutoSync}
                onChange={(e) => setDigilockerAutoSync(e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
            </div>
          </div>

          {/* Data Encryption Vault */}
          <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              AES-256 Data Encryption Vault
            </h3>

            <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                AES-256 Encryption at Rest Enabled
              </p>
              <p className="text-[11px] text-purple-200">
                Unredacted grievance text stored in SQLite database is protected with PBKDF2 derived keys.
              </p>
            </div>

            <div className="flex items-center justify-between bg-[#131314] p-3.5 rounded-xl border border-[#2A2B2D]">
              <div>
                <p className="text-xs font-semibold text-white">Default PII Redaction Masking</p>
                <p className="text-[11px] text-slate-400">Hide Aadhaar and phone numbers on screen</p>
              </div>
              <input
                type="checkbox"
                checked={piiMaskingDefault}
                onChange={(e) => setPiiMaskingDefault(e.target.checked)}
                className="w-4 h-4 accent-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Supervisor Access Entry */}
        <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-3xl p-6 shadow-2xl flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              Supervisor & Nodal Officer Portal
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Access system telemetry, IEEE quality audit logs, and persistent SQLite database inspect console.
            </p>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2.5 rounded-xl bg-[#28292A] hover:bg-[#37393B] border border-[#37393B] text-slate-200 hover:text-white font-bold text-xs transition-all"
          >
            Authenticate Supervisor Login
          </button>
        </div>
      </main>
    </div>
  );
}
