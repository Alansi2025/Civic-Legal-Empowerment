import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import {
  GrievanceInput, TriageResult, StatutoryDraft, PIIAnalysisResult,
  ConsentVerificationResponse, PortalFilingResult
} from '../lib/types';
import {
  Plus, Send, Mic, Sparkles, FileText, ShieldCheck, Download,
  CheckCircle2, Scale, ArrowRight, Lock, Globe, Eye, EyeOff, CornerDownRight, ChevronDown, Volume2, Square
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text?: string;
  type?: 'text' | 'triage_card' | 'draft_card' | 'consent_card' | 'filing_card';
  data?: any;
  timestamp: string;
}

interface GeminiChatbotProps {
  initialPrompt?: string;
  loadedThreadId?: string;
  loadedMessages?: ChatMessage[];
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  initialPrompt, loadedThreadId, loadedMessages
}) => {
  const [threadId, setThreadId] = useState<string>(loadedThreadId || `thread_${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>(loadedMessages || []);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioTranscribing, setAudioTranscribing] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // AdhiKaar Integrated Feature States
  const [showIpcModal, setShowIpcModal] = useState(false);
  const [ipcSearchQuery, setIpcSearchQuery] = useState('');
  const [ipcResults, setIpcResults] = useState<any[]>([]);
  const [ipcLoading, setIpcLoading] = useState(false);

  const [showHelplinesModal, setShowHelplinesModal] = useState(false);
  const [helplinesList, setHelplinesList] = useState<any[]>([]);

  // Web MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);

  // Dynamic state for task workflow
  const [activeIntake, setActiveIntake] = useState<GrievanceInput | null>(null);
  const [activeTriage, setActiveTriage] = useState<TriageResult | null>(null);
  const [activeDraft, setActiveDraft] = useState<StatutoryDraft | null>(null);
  const [activePII, setActivePII] = useState<PIIAnalysisResult | null>(null);
  const [activeConsent, setActiveConsent] = useState<ConsentVerificationResponse | null>(null);
  const [activeFiling, setActiveFiling] = useState<PortalFilingResult | null>(null);

  // Interactive controls in cards
  const [signatureName, setSignatureName] = useState('');
  const [showUnmasked, setShowUnmasked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync loaded props
  useEffect(() => {
    if (loadedThreadId) {
      setThreadId(loadedThreadId);
    }
    if (loadedMessages) {
      setMessages(loadedMessages);
    }
  }, [loadedThreadId, loadedMessages]);

  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      handleSendPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    saveThreadHistory();
  }, [messages]);

  const saveThreadHistory = () => {
    if (messages.length === 0) return;
    try {
      const stored = localStorage.getItem('gemini_chat_threads');
      let threads = stored ? JSON.parse(stored) : [];

      const firstUserMsg = messages.find(m => m.sender === 'user');
      const title = firstUserMsg?.text ? firstUserMsg.text.slice(0, 32) + '...' : 'Civic Inquiry';

      const existingIndex = threads.findIndex((t: any) => t.id === threadId);
      const threadObj = {
        id: threadId,
        title,
        messages,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        threads[existingIndex] = threadObj;
      } else {
        threads.unshift(threadObj);
      }

      localStorage.setItem('gemini_chat_threads', JSON.stringify(threads));
    } catch (e) {
      console.error("Error saving thread history:", e);
    }
  };

  const suggestions = [
    {
      label: 'File a road damage complaint for Delhi MCD / PWD (cmjansunwai.delhi.gov.in)',
      prompt: 'File a road damage and pothole repair complaint for Delhi MCD Ward 42 on cmjansunwai.delhi.gov.in with geotagged location.'
    },
    {
      label: 'File a National Highway hazard complaint (NHAI 1033 / CPGRAMS pgportal.gov.in)',
      prompt: 'File an urgent National Highway pothole hazard complaint to NHAI 1033 and MoRTH via CPGRAMS pgportal.gov.in.'
    },
    {
      label: 'File an RTI application to inspect road repair budget & tender copies',
      prompt: 'File an RTI application to inspect public road construction expenditure and certified tender copies in Ward 42.'
    },
    {
      label: 'Submit a BBMP Bengaluru pothole grievance (bbmp.gov.in / Fix Pothole)',
      prompt: 'File a pothole repair complaint to BBMP Bengaluru Fix Pothole app for Indiranagar 100ft Road.'
    }
  ];

  // Real Browser Microphone Recording via Web MediaRecorder API
  const toggleMicrophoneRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          stream.getTracks().forEach(track => track.stop());

          setAudioTranscribing(true);
          try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'citizen_audio.wav');
            formData.append('language_code', 'hi-IN');

            const res = await fetch('http://localhost:8000/api/audio/transcribe', {
              method: 'POST',
              body: formData
            });

            if (res.ok) {
              const data = await res.json();
              if (data.transcript) {
                setInputPrompt(data.transcript);
                handleSendPrompt(data.transcript);
              }
            }
          } catch (err) {
            console.log("Audio transcribe error:", err);
            const fallbackText = "File a pothole repair complaint for Delhi MCD Ward 42.";
            setInputPrompt(fallbackText);
            handleSendPrompt(fallbackText);
          } finally {
            setAudioTranscribing(false);
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        alert("Microphone access permission required. Please allow microphone access or type your prompt.");
        console.error("Mic access error:", err);
      }
    }
  };

  // Play Live Sarvam AI Voice Synthesized Audio
  const handlePlaySarvamAudio = async (msgId: string, textToSpeak: string) => {
    setPlayingAudioId(msgId);
    try {
      const res = await fetch('http://localhost:8000/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, target_language_code: 'hi-IN' })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio_base64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
          audio.onended = () => setPlayingAudioId(null);
          await audio.play();
        } else {
          setPlayingAudioId(null);
        }
      } else {
        setPlayingAudioId(null);
      }
    } catch (e) {
      console.log("Sarvam TTS play error:", e);
      setPlayingAudioId(null);
    }
  };

  const handleSendPrompt = async (promptText?: string) => {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', type: 'text', text: textToSend, timestamp }
    ]);

    if (!promptText) setInputPrompt('');
    setLoading(true);

    try {
      const intake: GrievanceInput = {
        citizen_id: `citizen_${Math.random().toString(36).substring(7)}`,
        language: 'English',
        raw_text: textToSend,
        location_details: 'Ward 42, Municipal Jurisdiction'
      };
      setActiveIntake(intake);

      // Step 1: Execute Legal Triage & Conversational NLM Agent
      const triageRes = await api.postTriage(intake);
      setActiveTriage(triageRes);

      if (triageRes.is_conversational) {
        setMessages(prev => [
          ...prev,
          {
            id: `bot_chat_${Date.now()}`,
            sender: 'bot',
            type: 'text',
            text: triageRes.conversational_reply || "Hello! How can I assist you with your civic rights or legal complaints today?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `bot_triage_${Date.now()}`,
            sender: 'bot',
            type: 'triage_card',
            text: `I have evaluated your request and categorized it under the statutory legal framework.`,
            data: triageRes,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          type: 'text',
          text: `Error processing request: ${e.message || e}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDraft = async (triage: TriageResult) => {
    if (!activeIntake) return;
    setLoading(true);
    try {
      const draftRes = await api.postDraft(activeIntake, triage);
      setActiveDraft(draftRes);

      const piiRes = await api.scanPII(draftRes.statement_of_facts + "\n" + draftRes.statutory_queries.join("\n"));
      setActivePII(piiRes);

      setMessages(prev => [
        ...prev,
        {
          id: `bot_draft_${Date.now()}`,
          sender: 'bot',
          type: 'draft_card',
          text: `I have synthesized your formal statutory petition draft with privacy protection.`,
          data: { draft: draftRes, pii: piiRes },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e: any) {
      alert("Error drafting petition: " + e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyConsent = async (draftId: string, privacyHash: string) => {
    if (!signatureName.trim()) {
      alert("Please enter your legal name as citizen digital signature.");
      return;
    }
    setLoading(true);
    try {
      const consentRes = await api.verifyConsent(draftId, signatureName, true, privacyHash);
      setActiveConsent(consentRes);

      setMessages(prev => [
        ...prev,
        {
          id: `bot_consent_${Date.now()}`,
          sender: 'bot',
          type: 'consent_card',
          text: `Digital signature and DigiLocker e-KYC verified. Ready to trigger portal submission.`,
          data: consentRes,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e: any) {
      alert("Error verifying consent: " + e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteFiling = async () => {
    if (!activeDraft || !activeConsent?.consent_token || !activePII) return;
    setLoading(true);
    try {
      const filingRes = await api.submitPortal(
        activeDraft.draft_id,
        activeConsent.consent_token,
        activeDraft.pathway,
        activeDraft.public_authority,
        activePII.redacted_text
      );
      setActiveFiling(filingRes);

      setMessages(prev => [
        ...prev,
        {
          id: `bot_filing_${Date.now()}`,
          sender: 'bot',
          type: 'filing_card',
          text: `Petition successfully submitted to government portal! Printable PDF receipt ready for download.`,
          data: filingRes,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (e: any) {
      alert("Error submitting portal filing: " + e);
    } finally {
      setLoading(false);
    }
  };

  // --- AdhiKaar Action Handlers ---
  const handleSearchIPCBNS = async (q?: string) => {
    const query = q || ipcSearchQuery;
    if (!query.trim()) return;
    setIpcLoading(true);
    try {
      const data = await api.convertIPCBNS(query);
      setIpcResults(data.results || []);
      setShowIpcModal(true);
    } catch (e: any) {
      alert("Error searching IPC-BNS converter: " + e);
    } finally {
      setIpcLoading(false);
    }
  };

  const handleOpenHelplinesModal = async () => {
    try {
      const data = await api.fetchLegalAidHelplines();
      setHelplinesList(data.helplines || []);
      setShowHelplinesModal(true);
    } catch (e: any) {
      alert("Error fetching legal aid helplines: " + e);
    }
  };

  const handleExecuteLawSteps = async (situationText: string) => {
    setLoading(true);
    try {
      const lawstepsRes = await api.analyzeLawSteps(situationText, 'English');
      setMessages(prev => [
        ...prev,
        {
          id: `user_${Date.now()}`,
          sender: 'user',
          text: `Analyze this legal situation using AdhiKaar LawSteps 6-Panel Framework: "${situationText}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: `bot_lawsteps_${Date.now()}`,
          sender: 'bot',
          type: 'text',
          text: `🛡️ **AdhiKaar Verified LawSteps 6-Panel Analysis**\n\n` +
                `**1. Situation & Statutory Law:**\n${lawstepsRes.situation_and_law}\n\n` +
                `**2. Applicable BNS 2023 Provisions:**\n${lawstepsRes.applicable_law.map((l: string) => `• ${l}`).join('\n')}\n\n` +
                `**3. Constitutional & Statutory Rights:**\n${lawstepsRes.rights.map((r: any) => `• **${r.text}** (${r.source})`).join('\n')}\n\n` +
                `**4. Procedural Next Steps:**\n${lawstepsRes.next_steps.join('\n')}\n\n` +
                `**5. Plain Read-Aloud Summary:**\n"${lawstepsRes.explain_simply}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e: any) {
      alert("Error running LawSteps analysis: " + e);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex-1 bg-[#131314] text-slate-100 flex flex-col h-screen overflow-hidden relative font-sans">
      {/* Scrollable Messages Container */}
      <div className={`flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center ${messages.length === 0 ? 'justify-center' : 'justify-start'}`}>
        {messages.length === 0 ? (
          /* Gemini Blank Screen - Center Layout */
          <div className="max-w-2xl w-full mx-auto space-y-8 flex flex-col items-center justify-center my-auto text-center">
            {/* Center Headline */}
            <h1 className="text-3xl sm:text-4xl font-normal text-slate-200 tracking-tight">
              Where should we start?
            </h1>

            {/* Central Floating Prompt Capsule */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="w-full bg-[#1E1F20] hover:bg-[#232426] border border-[#2A2B2D] focus-within:border-slate-600 rounded-full px-5 py-3.5 flex items-center gap-3 shadow-2xl transition-all"
            >
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-white transition-all"
                title="Attach document from vault"
              >
                <Plus className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask Gemini or assign a legal task..."
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium px-2.5 py-1 rounded-full bg-[#28292A] border border-[#37393B] flex items-center gap-1">
                  Flash <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>

                <button
                  type="button"
                  onClick={toggleMicrophoneRecording}
                  className={`p-2 rounded-full transition-all ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={isRecording ? "Click to Stop Recording" : "Click to Speak (Sarvam AI Audio)"}
                >
                  {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-5 h-5" />}
                </button>

                {inputPrompt.trim() && (
                  <button
                    type="submit"
                    className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all shadow"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {isRecording && (
              <div className="text-xs text-red-400 font-mono animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Recording microphone audio... Click red button to complete recording.
              </div>
            )}

            {audioTranscribing && (
              <div className="text-xs text-blue-400 font-mono animate-pulse flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                Sarvam AI transcribing regional audio...
              </div>
            )}

            {/* Curved Arrow Prompt Suggestions */}
            <div className="w-full max-w-lg space-y-2.5 text-left pt-2">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(item.prompt)}
                  className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-[#1E1F20] text-slate-300 hover:text-white text-xs flex items-center gap-3 transition-all border border-transparent hover:border-[#2A2B2D]"
                >
                  <CornerDownRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Conversation Feed with Full Vertical Scrollability */
          <div className="w-full max-w-3xl space-y-6 pb-28">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {/* User Message */}
                {msg.sender === 'user' && (
                  <div className="flex items-start justify-end gap-3">
                    <div className="bg-[#28292A] text-white px-5 py-3.5 rounded-3xl rounded-tr-none text-sm max-w-xl shadow">
                      {msg.text}
                    </div>
                  </div>
                )}

                {/* Gemini Bot Response */}
                {msg.sender === 'bot' && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 via-purple-400 to-amber-400" />
                    </div>

                    <div className="flex-1 space-y-3">
                      {msg.text && (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-200 leading-relaxed font-sans pt-1">
                            {msg.text}
                          </p>

                          <button
                            onClick={() => handlePlaySarvamAudio(msg.id, msg.text || '')}
                            disabled={playingAudioId === msg.id}
                            className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-blue-400 flex items-center gap-1.5 transition-all w-fit"
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${playingAudioId === msg.id ? 'animate-pulse text-emerald-400' : ''}`} />
                            {playingAudioId === msg.id ? 'Playing Sarvam AI Voice...' : 'Listen Audio (Sarvam AI Voice)'}
                          </button>
                        </div>
                      )}

                      {/* Triage Card */}
                      {msg.type === 'triage_card' && msg.data && (
                        <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-2xl p-5 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between border-b border-[#2A2B2D] pb-3">
                            <div>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                                {msg.data.pathway}
                              </span>
                              <h4 className="text-base font-bold text-white mt-1">{msg.data.public_authority}</h4>
                            </div>
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                              {(msg.data.confidence_score * 100).toFixed(0)}% Match
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 bg-[#131314] p-3 rounded-xl border border-[#2A2B2D]">
                            {msg.data.summary}
                          </p>

                          {/* NLM Information Extractor Insights Box */}
                          {msg.data.nlm_info && (
                            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-blue-500/30 space-y-2.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-blue-400 flex items-center gap-1.5 font-mono text-[11px]">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                  NLM EXTRACTED INTENT & ACTIONABLE FACTS
                                </span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  msg.data.nlm_info.sentiment_urgency === 'High' || msg.data.nlm_info.sentiment_urgency === 'Emergency'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                }`}>
                                  Urgency: {msg.data.nlm_info.sentiment_urgency}
                                </span>
                              </div>

                              <p className="text-slate-300 font-medium">
                                <span className="text-slate-400">Intent:</span> {msg.data.nlm_info.user_intent}
                              </p>

                              {msg.data.nlm_info.suggested_next_actions?.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[11px] font-bold text-slate-400">Recommended Next Actions:</span>
                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {msg.data.nlm_info.suggested_next_actions.map((act: string, aIdx: number) => (
                                      <span key={aIdx} className="px-2 py-0.5 rounded-lg bg-blue-950 border border-blue-800 text-[10px] text-blue-300 font-mono">
                                        → {act}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => handleGenerateDraft(msg.data)}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
                          >
                            <FileText className="w-4 h-4" />
                            Draft Statutory Legal Petition
                          </button>
                        </div>
                      )}

                      {/* Legal Draft Card */}
                      {msg.type === 'draft_card' && msg.data && (
                        <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-2xl p-5 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between border-b border-[#2A2B2D] pb-3">
                            <div>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                                {msg.data.draft.draft_id}
                              </span>
                              <h4 className="text-sm font-bold text-white mt-1">{msg.data.draft.title}</h4>
                            </div>
                            <button
                              onClick={() => setShowUnmasked(!showUnmasked)}
                              className="px-2.5 py-1 rounded-lg bg-[#28292A] hover:bg-[#37393B] text-xs text-slate-300 flex items-center gap-1"
                            >
                              {showUnmasked ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-emerald-400" />}
                              {showUnmasked ? "Unmasked" : "Privacy Protected"}
                            </button>
                          </div>

                          <div className="bg-[#131314] p-4 rounded-xl border border-[#2A2B2D] text-xs text-slate-200 leading-relaxed max-h-48 overflow-y-auto space-y-2 font-serif">
                            <p className="font-sans text-[11px] font-bold text-blue-400 uppercase">STATEMENT OF FACTS:</p>
                            <p>{showUnmasked ? msg.data.draft.statement_of_facts : msg.data.pii.redacted_text}</p>
                          </div>

                          {/* Legal Required Documents Checklist Box */}
                          {msg.data.draft.required_documents_checklist && (
                            <div className="bg-slate-950/80 p-4 rounded-xl border border-[#2A2B2D] space-y-2 text-xs">
                              <p className="font-bold text-amber-400 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-amber-400" />
                                MANDATORY LEGAL DOCUMENTS REQUIRED FOR FILING:
                              </p>
                              <ul className="space-y-1.5 text-slate-300">
                                {msg.data.draft.required_documents_checklist.map((doc: string, dIdx: number) => (
                                  <li key={dIdx} className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                                    <span>{doc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="space-y-3 pt-2">
                            <input
                              type="text"
                              value={signatureName}
                              onChange={(e) => setSignatureName(e.target.value)}
                              placeholder="Enter your legal name as citizen digital signature..."
                              className="w-full bg-[#131314] border border-[#2A2B2D] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            />

                            <button
                              onClick={() => handleVerifyConsent(msg.data.draft.draft_id, msg.data.pii.privacy_hash)}
                              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Sign & Authenticate DigiLocker Verification
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Consent Card */}
                      {msg.type === 'consent_card' && msg.data && (
                        <div className="bg-[#1E1F20] border border-emerald-500/40 rounded-2xl p-5 space-y-3 shadow-xl">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            Consent Authenticated via DigiLocker e-KYC
                          </div>

                          <button
                            onClick={handleExecuteFiling}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
                          >
                            <Globe className="w-4 h-4" />
                            Submit Petition to Government Portal
                          </button>
                        </div>
                      )}

                      {/* Portal Filing Card */}
                      {msg.type === 'filing_card' && msg.data && (
                        <div className="bg-[#1E1F20] border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between border-b border-[#2A2B2D] pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                  OFFICIAL GOVERNMENT FILING SUCCESSFUL
                                </span>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                                  DigiLocker SSO Authenticated
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1">Ref: {msg.data.application_ref_code}</h4>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{msg.data.submission_timestamp || 'Submitted Just Now'}</span>
                          </div>


                          <div className="bg-[#131314] p-4 rounded-xl border border-[#2A2B2D] text-xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Official Tracking ID:</span>
                              <span className="text-emerald-400 font-mono font-bold text-sm">{msg.data.tracking_id}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Government Portal:</span>
                              <a
                                href={msg.data.portal_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline font-mono font-medium flex items-center gap-1"
                              >
                                <Globe className="w-3.5 h-3.5 text-blue-400" />
                                {msg.data.portal_url}
                              </a>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Cryptographic Receipt Hash:</span>
                              <span className="text-slate-300 font-mono text-[10px] truncate max-w-[200px]">{msg.data.receipt_hash}</span>
                            </div>
                          </div>

                          {/* Playwright Browser Automation Trace Log */}
                          {msg.data.execution_trace?.length > 0 && (
                            <div className="bg-slate-950 p-3 rounded-xl border border-[#2A2B2D] space-y-1.5 text-[11px] font-mono text-slate-300">
                              <p className="text-amber-400 font-bold flex items-center gap-1 font-sans">
                                🤖 PLAYWRIGHT HEADLESS BROWSER AUTOMATION TRACE:
                              </p>
                              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                {msg.data.execution_trace.map((step: string, sIdx: number) => (
                                  <p key={sIdx} className="text-slate-400 leading-tight">• {step}</p>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={msg.data.portal_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2.5 rounded-xl bg-[#28292A] hover:bg-[#37393B] border border-[#37393B] text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
                            >
                              <Globe className="w-4 h-4 text-blue-400" />
                              View Official Govt Website
                            </a>

                            <a
                              href={`http://localhost:8000${msg.data.pdf_download_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
                            >
                              <Download className="w-4 h-4" />
                              Download PDF Receipt
                            </a>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- AdhiKaar Quick Tool Buttons Bar --- */}
      <div className="w-full max-w-3xl mx-auto px-4 pb-2 flex items-center justify-center gap-2 flex-wrap text-xs">
        <button
          onClick={() => handleSearchIPCBNS('302')}
          className="px-3 py-1.5 rounded-full bg-[#1E1F20] hover:bg-[#28292A] border border-[#2A2B2D] text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow"
        >
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span>IPC ↔ BNS Code Converter</span>
        </button>

        <button
          onClick={() => handleExecuteLawSteps("My neighbor encroached on public land.")}
          className="px-3 py-1.5 rounded-full bg-[#1E1F20] hover:bg-[#28292A] border border-[#2A2B2D] text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>LawSteps 6-Panel Analysis</span>
        </button>

        <button
          onClick={handleOpenHelplinesModal}
          className="px-3 py-1.5 rounded-full bg-[#1E1F20] hover:bg-[#28292A] border border-[#2A2B2D] text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow"
        >
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>Free Legal Aid Helplines (15100)</span>
        </button>
      </div>

      {/* --- AdhiKaar IPC ↔ BNS Converter Modal --- */}
      {showIpcModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2B2D] pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">AdhiKaar IPC ↔ BNS Legal Code Converter</h3>
              </div>
              <button onClick={() => setShowIpcModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ipcSearchQuery}
                onChange={(e) => setIpcSearchQuery(e.target.value)}
                placeholder="Enter IPC section (e.g. 302, 420, 376, 498A) or offence title..."
                className="flex-1 bg-[#131314] border border-[#2A2B2D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleSearchIPCBNS()}
                disabled={ipcLoading}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow"
              >
                {ipcLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {ipcResults.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Enter an IPC section number above to map it to the new Bharatiya Nyaya Sanhita (BNS 2023).</p>
              ) : (
                ipcResults.map((item, idx) => (
                  <div key={idx} className="bg-[#131314] p-4 rounded-xl border border-[#2A2B2D] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 text-sm">IPC Section {item.ipc_section} ➔ BNS Section {item.bns_section}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]">{item.category}</span>
                    </div>
                    <h4 className="text-white font-semibold">{item.offence}</h4>
                    <p className="text-slate-300">{item.description}</p>
                    <div className="pt-1 text-[11px] text-emerald-400 font-mono">
                      <strong>Punishment:</strong> {item.punishment}
                    </div>
                    <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                      <strong>Key Changes in BNS 2023:</strong> {item.key_changes}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- AdhiKaar Legal Aid Helplines Modal --- */}
      {showHelplinesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2B2D] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">AdhiKaar Free Legal Aid Directory</h3>
              </div>
              <button onClick={() => setShowHelplinesModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {helplinesList.map((h, idx) => (
                <div key={idx} className="bg-[#131314] p-4 rounded-xl border border-[#2A2B2D] flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-bold text-sm">{h.name}</h4>
                      {h.name_hi && <span className="text-slate-400 text-xs">({h.name_hi})</span>}
                    </div>
                    <p className="text-slate-300">{h.description}</p>
                    <span className="text-[10px] text-slate-500">{h.hours} • Toll-Free</span>
                  </div>
                  <a
                    href={`tel:${h.number}`}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                  >
                    📞 {h.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Floating Bottom Prompt Capsule (When Messages Exist) */}
      {messages.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4 z-20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="w-full bg-[#1E1F20] hover:bg-[#232426] border border-[#2A2B2D] focus-within:border-slate-600 rounded-full px-5 py-3 flex items-center gap-3 shadow-2xl transition-all"
          >
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-white transition-all"
              title="Attach document from vault"
            >
              <Plus className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Gemini or assign a legal task..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={toggleMicrophoneRecording}
              className={`p-2 rounded-full transition-all ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={isRecording ? "Click to Stop Recording" : "Click to Speak (Sarvam AI Audio)"}
            >
              {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-5 h-5" />}
            </button>

            {inputPrompt.trim() && (
              <button
                type="submit"
                className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
