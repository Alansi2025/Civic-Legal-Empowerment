import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import {
  GrievanceInput, TriageResult, StatutoryDraft, PIIAnalysisResult,
  ConsentVerificationResponse, PortalFilingResult
} from '../lib/types';
import {
  Plus, Send, Mic, Sparkles, FileText, ShieldCheck, Download,
  CheckCircle2, Scale, ArrowRight, Lock, Globe, Eye, EyeOff, CornerDownRight, ChevronDown, Volume2, Square,
  Camera, Image as ImageIcon, Video, Music, Paperclip, X, AlertTriangle, Compass, Megaphone, ShoppingBag
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

  // Media Attachment & Camera Capture States
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; type: 'image' | 'audio' | 'video' | 'doc'; url: string }>>([]);
  const [activeFileType, setActiveFileType] = useState<'image' | 'audio' | 'video' | 'doc'>('image');

  // Gemma 4 Model Selector State
  const [selectedModel, setSelectedModel] = useState<string>('gemma-4-31b-it');
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const handleSelectModel = async (modelId: string) => {
    setSelectedModel(modelId);
    setShowModelDropdown(false);
    try {
      await api.updateModelSetting(modelId);
    } catch (e) {
      console.log("Error switching model:", e);
    }
  };


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

  // Attachment & Camera Handlers
  const handleOpenFileInput = (type: 'image' | 'audio' | 'video' | 'doc') => {
    setActiveFileType(type);
    setShowAttachmentMenu(false);
    if (fileInputRef.current) {
      if (type === 'image') fileInputRef.current.accept = 'image/*';
      else if (type === 'audio') fileInputRef.current.accept = 'audio/*';
      else if (type === 'video') fileInputRef.current.accept = 'video/*';
      else fileInputRef.current.accept = '.pdf,.docx,.doc,.txt';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    const newAtt = {
      id: `att_${Date.now()}`,
      name: file.name,
      type: activeFileType,
      url
    };
    setAttachments(prev => [...prev, newAtt]);
    e.target.value = '';
  };

  const handleStartCamera = async () => {
    setShowAttachmentMenu(false);
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      alert("Could not access camera: " + err.message);
      setShowCameraModal(false);
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/jpeg');
      setAttachments(prev => [
        ...prev,
        {
          id: `cam_${Date.now()}`,
          name: `Camera_Snapshot_${Date.now().toString().slice(-4)}.jpg`,
          type: 'image',
          url
        }
      ]);
    }
    handleCloseCamera();
  };

  const handleCloseCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };


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
    let textToSend = promptText || inputPrompt;
    if (!textToSend.trim() && attachments.length === 0) return;
    if (loading) return;

    if (attachments.length > 0) {
      const attInfo = attachments.map(a => `[Attached Evidence ${a.type.toUpperCase()}: ${a.name}]`).join('\n');
      textToSend = textToSend ? `${textToSend}\n\nEvidence Files Attached:\n${attInfo}` : `Attached Evidence Files:\n${attInfo}`;
      setAttachments([]);
    }

    const userMsgId = `user_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', type: 'text', text: textToSend, timestamp }
    ]);

    if (!promptText) setInputPrompt('');
    setLoading(true);

    try {
      const historyItems = messages.map(m => ({
        sender: m.sender,
        text: m.text || (m.data?.summary ? m.data.summary : '')
      })).filter(h => h.text.trim().length > 0);

      const intake: GrievanceInput = {
        citizen_id: `citizen_${Math.random().toString(36).substring(7)}`,
        language: 'English',
        raw_text: textToSend,
        location_details: undefined,
        conversation_history: historyItems
      };


      setActiveIntake(intake);

      // Step 1: Execute Legal Triage & Conversational NLM Agent
      const triageRes = await api.postTriage(intake);
      setActiveTriage(triageRes);

      if (triageRes.is_conversational || triageRes.pathway === 'Unknown' || (triageRes.pathway as string) === 'UNKNOWN' || triageRes.pathway === 'General Civic Inquiry') {


        const botMsg: ChatMessage = {
          id: `bot_chat_${Date.now()}`,
          sender: 'bot',
          type: 'text',
          text: triageRes.conversational_reply || "Hello! How can I assist you with your civic rights or legal complaints today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => {
          const updated = [...prev, botMsg];
          // Persist session to MongoDB
          api.saveConversation(threadId, "guest", textToSend.slice(0, 30), updated).catch(e => console.log("MongoDB save err:", e));
          return updated;
        });
      } else {
        const botMsg: ChatMessage = {
          id: `bot_triage_${Date.now()}`,
          sender: 'bot',
          type: 'triage_card',
          text: triageRes.conversational_reply || triageRes.summary || "Here is plain-language legal and civic guidance for your issue:",
          data: triageRes,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => {
          const updated = [...prev, botMsg];
          // Persist session to MongoDB
          api.saveConversation(threadId, "guest", textToSend.slice(0, 30), updated).catch(e => console.log("MongoDB save err:", e));
          return updated;
        });
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

  // Trigger initialPrompt
  useEffect(() => {
    if (initialPrompt && !initialPrompt.endsWith('_TOOL')) {
      handleSendPrompt(initialPrompt);
    }
  }, [initialPrompt]);



  return (
    <div className="flex-1 bg-[#131314] text-slate-100 flex flex-col h-screen overflow-hidden relative font-sans">

      {/* Scrollable Messages Container */}
      <div className={`flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center ${messages.length === 0 ? 'justify-center' : 'justify-start'}`}>
        {messages.length === 0 ? (
          /* Gemini Blank Screen - Center Layout */
          <div className="max-w-2xl w-full mx-auto space-y-8 flex flex-col items-center justify-center my-auto text-center">
            {/* Center Headline */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
              Where should Legal Adviser AI begin?
            </h1>


            {/* Central Floating Prompt Capsule */}
            <div className="w-full relative">
              {/* Attachment Preview Badges */}
              {attachments.length > 0 && (
                <div className="flex items-center gap-2 pb-2 px-1 flex-wrap w-full">
                  {attachments.map((att) => (
                    <div key={att.id} className="bg-[#28292A] border border-[#37393B] px-3 py-1 rounded-full text-xs text-slate-200 flex items-center gap-2 shadow">
                      {att.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-blue-400" />}
                      {att.type === 'audio' && <Music className="w-3.5 h-3.5 text-amber-400" />}
                      {att.type === 'video' && <Video className="w-3.5 h-3.5 text-purple-400" />}
                      {att.type === 'doc' && <FileText className="w-3.5 h-3.5 text-rose-400" />}
                      <span className="truncate max-w-[140px] font-mono text-[11px]">{att.name}</span>
                      <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="text-slate-400 hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendPrompt();
                }}
                className="w-full bg-[#1E1F20] hover:bg-[#232426] border border-[#2A2B2D] focus-within:border-slate-600 rounded-full px-5 py-3.5 flex items-center gap-3 shadow-2xl transition-all relative"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className={`p-1.5 rounded-full transition-all ${
                      showAttachmentMenu ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Attach Image, Audio, Video, Document or Camera Photo"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {/* Media Attachment Popover Menu */}
                  {showAttachmentMenu && (
                    <div className="absolute bottom-12 left-0 bg-[#1E1F20] border border-[#2A2B2D] rounded-2xl p-2 shadow-2xl z-40 space-y-1 w-56 text-xs text-left">
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#28292A] text-slate-200 hover:text-white flex items-center gap-2.5 transition-all"
                      >
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span>Take Photo (Camera)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenFileInput('image')}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#28292A] text-slate-200 hover:text-white flex items-center gap-2.5 transition-all"
                      >
                        <ImageIcon className="w-4 h-4 text-blue-400" />
                        <span>Upload Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenFileInput('audio')}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#28292A] text-slate-200 hover:text-white flex items-center gap-2.5 transition-all"
                      >
                        <Music className="w-4 h-4 text-amber-400" />
                        <span>Upload Audio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenFileInput('video')}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#28292A] text-slate-200 hover:text-white flex items-center gap-2.5 transition-all"
                      >
                        <Video className="w-4 h-4 text-purple-400" />
                        <span>Upload Video</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenFileInput('doc')}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#28292A] text-slate-200 hover:text-white flex items-center gap-2.5 transition-all"
                      >
                        <FileText className="w-4 h-4 text-rose-400" />
                        <span>Upload Document (PDF/DOC)</span>
                      </button>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Ask Legal Adviser AI or assign a legal task..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                />

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      className="text-xs text-slate-300 font-medium px-2.5 py-1 rounded-full bg-[#28292A] hover:bg-[#37393B] border border-[#37393B] flex items-center gap-1.5 transition-all shadow"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{selectedModel === 'gemma-4-31b-it' ? 'Gemma 4 (31B)' : selectedModel === 'gemma-4-26b-a4b-it' ? 'Gemma 4 (26B MoE)' : selectedModel === 'gemini-3.7-flash' ? 'Gemini 3.7' : 'Gemini 3.5 Lite'}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showModelDropdown && (
                      <div className="absolute top-full mt-2 right-0 bg-[#1E1F20]/95 backdrop-blur-md border border-[#2A2B2D] rounded-2xl p-2.5 shadow-2xl z-[100] space-y-1 w-64 text-xs text-left max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1 text-[10px] font-mono font-bold text-slate-400 border-b border-[#2A2B2D] mb-1">
                          SELECT ACTIVE AI MODEL
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectModel('gemma-4-12e-it')}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                            selectedModel === 'gemma-4-12e-it' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-[#28292A] text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-emerald-400">Gemma 4 (12E Ultra Fast)</div>
                            <div className="text-[10px] text-slate-400 font-mono">gemma-4-12e-it</div>
                          </div>
                          {selectedModel === 'gemma-4-12e-it' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectModel('gemma-4-31b-it')}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                            selectedModel === 'gemma-4-31b-it' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-[#28292A] text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">Gemma 4 (31B Dense)</div>
                            <div className="text-[10px] text-slate-400 font-mono">gemma-4-31b-it</div>
                          </div>
                          {selectedModel === 'gemma-4-31b-it' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectModel('gemma-4-26b-a4b-it')}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                            selectedModel === 'gemma-4-26b-a4b-it' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-[#28292A] text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">Gemma 4 (26B MoE)</div>
                            <div className="text-[10px] text-slate-400 font-mono">gemma-4-26b-a4b-it</div>
                          </div>
                          {selectedModel === 'gemma-4-26b-a4b-it' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectModel('gemini-3.7-flash')}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                            selectedModel === 'gemini-3.7-flash' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-[#28292A] text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">Gemini 3.7 Flash</div>
                            <div className="text-[10px] text-slate-400 font-mono">gemini-3.7-flash</div>
                          </div>
                          {selectedModel === 'gemini-3.7-flash' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectModel('gemini-3.5-flash-lite')}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                            selectedModel === 'gemini-3.5-flash-lite' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-[#28292A] text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">Gemini 3.5 Flash Lite</div>
                            <div className="text-[10px] text-slate-400 font-mono">gemini-3.5-flash-lite</div>
                          </div>
                          {selectedModel === 'gemini-3.5-flash-lite' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>
                      </div>
                    )}

                  </div>


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

                  {(inputPrompt.trim() || attachments.length > 0) && (
                    <button
                      type="submit"
                      className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all shadow"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>


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

            {/* Google AI Studio Style Interactive Flash Cards Suggestions Grid */}
            <div className="w-full max-w-3xl pt-2 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Explore Legal Adviser AI Tasks
                </span>
                <span className="text-[10px] text-slate-500">Click a card to start</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-left">
                {[
                  {
                    id: 'road_damage',
                    title: 'Road Damage & Potholes',
                    subtitle: 'File road repair petitions for MCD / PWD / BBMP with geotagged photo proof.',
                    prompt: 'File a road damage and pothole complaint for Delhi MCD Ward 42 on cmjansunwai.delhi.gov.in with geotagged photo.',
                    icon: AlertTriangle,
                    badge: 'Civic Safety',
                    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400'
                  },
                  {
                    id: 'highway_hazard',
                    title: 'NHAI Highway Hazard (1033)',
                    subtitle: 'Report dangerous National Highway potholes & toll plaza grievances.',
                    prompt: 'File a National Highway hazard complaint to NHAI 1033 and CPGRAMS pgportal.gov.in for NH-48 potholes.',
                    icon: Compass,
                    badge: 'Highways',
                    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400'
                  },
                  {
                    id: 'rti_inspection',
                    title: 'RTI Budget & Tender Audit',
                    subtitle: 'Inspect public road work expenditure, budgets & certified contractor bills under RTI Act.',
                    prompt: 'File an RTI application to inspect public road works expenditure and certified tender copies in Ward 42.',
                    icon: FileText,
                    badge: 'RTI Act 2005',
                    color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400'
                  },
                  {
                    id: 'cpgrams_pension',
                    title: 'CPGRAMS Public Grievance',
                    subtitle: 'Submit grievance petitions for delayed central pension, Provident Fund, or welfare schemes.',
                    prompt: 'File a CPGRAMS public grievance petition for central pension payment delayed for over 8 months.',
                    icon: Megaphone,
                    badge: 'CPGRAMS',
                    color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400'
                  },
                  {
                    id: 'consumer_dispute',
                    title: 'Consumer Fraud & Refund',
                    subtitle: 'File claims for defective products, merchant refusal of refund, or unfair trade practices.',
                    prompt: 'File a Consumer Complaint for a defective television delivered broken where vendor refuses refund.',
                    icon: ShoppingBag,
                    badge: 'Consumer Act',
                    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400'
                  },
                  {
                    id: 'ipc_bns_rights',
                    title: 'BNS 2023 Code Converter',
                    subtitle: 'Convert IPC sections to new Bharatiya Nyaya Sanhita (BNS 2023) & get step-by-step legal aid.',
                    prompt: 'Look up BNS 2023 sections and rights for public nuisance and negligence by local authority.',
                    icon: Scale,
                    badge: 'BNS 2023',
                    color: 'from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400'
                  }
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleSendPrompt(card.prompt)}
                      className="group bg-[#1E1F20] hover:bg-[#28292A] border border-[#2A2B2D] hover:border-slate-500 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-2xl hover:-translate-y-0.5 text-left space-y-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} border shadow-inner`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#131314] text-slate-400 border border-[#2A2B2D] group-hover:border-slate-500 transition-all">
                          {card.badge}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-white group-hover:text-blue-300 transition-all">
                          {card.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 group-hover:text-slate-300 leading-relaxed line-clamp-2">
                          {card.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
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

                          {/* Grievance Detail Collector Box (Hear all user grievances before drafting) */}
                          {msg.data.follow_up_questions?.length > 0 && (
                            <div className="bg-amber-950/40 p-4 rounded-xl border border-amber-500/40 space-y-2 text-xs">
                              <span className="font-bold text-amber-400 flex items-center gap-1.5 font-mono text-[11px]">
                                ❓ Essential Details Needed Before Drafting Petition:
                              </span>
                              <ul className="space-y-1.5 pl-4 list-disc text-amber-200/90 text-xs">
                                {msg.data.follow_up_questions.map((q: string, qIdx: number) => (
                                  <li key={qIdx}>{q}</li>
                                ))}
                              </ul>
                              <p className="text-[11px] text-amber-300/70 pt-1 italic">
                                💡 Tip: You can reply in chat with these details or click the '+' icon to attach photo/video/audio evidence before drafting!
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
                                if (inputEl) inputEl.focus();
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-[#28292A] hover:bg-[#37393B] border border-[#37393B] text-slate-200 font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all"
                            >
                              💬 Provide Details in Chat
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenerateDraft(msg.data)}
                              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
                            >
                              <FileText className="w-4 h-4" />
                              Draft Statutory Legal Petition
                            </button>
                          </div>
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

            {/* Animated Chatbot Processing Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-3 animate-fade-in pt-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20">
                  <div className="w-full h-full bg-[#131314] rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                  </div>
                </div>

                <div className="bg-[#1E1F20] border border-[#2A2B2D] px-5 py-4 rounded-2xl rounded-tl-none space-y-2.5 max-w-lg shadow-2xl">
                  <div className="flex items-center justify-between gap-3 border-b border-[#2A2B2D] pb-2">
                    <span className="text-xs font-bold text-blue-400 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      Legal Adviser AI
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                      {selectedModel === 'gemma-4-12e-it' ? 'Gemma 4 (12E Fast)' : selectedModel === 'gemma-4-31b-it' ? 'Gemma 4 (31B Dense)' : selectedModel === 'gemma-4-26b-a4b-it' ? 'Gemma 4 (MoE)' : 'Gemini 3.5 Lite'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Analyzing grievance details, evidence files, and evaluating statutory provisions under BNS 2023 & RTI Act...
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-100"></span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200"></span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Formulating step-by-step legal guidance...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- AdhiKaar IPC ↔ BNS Converter Modal --- */}




      {/* Floating Bottom Prompt Capsule (When Messages Exist) */}
      {messages.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4 z-20 space-y-2">
          {/* Attachment Preview Badges */}
          {attachments.length > 0 && (
            <div className="flex items-center gap-2 px-1 flex-wrap w-full">
              {attachments.map((att) => (
                <div key={att.id} className="bg-[#28292A] border border-[#37393B] px-3 py-1 rounded-full text-xs text-slate-200 flex items-center gap-2 shadow">
                  {att.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-blue-400" />}
                  {att.type === 'audio' && <Music className="w-3.5 h-3.5 text-amber-400" />}
                  {att.type === 'video' && <Video className="w-3.5 h-3.5 text-purple-400" />}
                  {att.type === 'doc' && <FileText className="w-3.5 h-3.5 text-rose-400" />}
                  <span className="truncate max-w-[140px] font-mono text-[11px]">{att.name}</span>
                  <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="text-slate-400 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="w-full bg-[#1E1F20] hover:bg-[#232426] border border-[#2A2B2D] focus-within:border-slate-600 rounded-full px-5 py-3 flex items-center gap-3 shadow-2xl transition-all relative"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={`p-1.5 rounded-full transition-all ${
                  showAttachmentMenu ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Attach Image, Audio, Video, Document or Camera Photo"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Media Attachment Popover Menu */}
              {showAttachmentMenu && (
                <div className="absolute bottom-12 left-0 bg-[#1E1F20] border border-[#2A2B2D] rounded-2xl p-2 shadow-2xl z-40 space-y-1 w-56 text-xs text-left">
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#28292A] text-slate-200 hover:text-white flex items-center gap-2.5 transition-all"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Take Photo (Camera)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFileInput('image')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#28292A] text-slate-200 hover:text-white flex items-center gap-2.5 transition-all"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    <span>Upload Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFileInput('audio')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#28292A] text-slate-200 hover:text-white flex items-center gap-2.5 transition-all"
                  >
                    <Music className="w-4 h-4 text-amber-400" />
                    <span>Upload Audio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFileInput('video')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#28292A] text-slate-200 hover:text-white flex items-center gap-2.5 transition-all"
                  >
                    <Video className="w-4 h-4 text-purple-400" />
                    <span>Upload Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFileInput('doc')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#28292A] text-slate-200 hover:text-white flex items-center gap-2.5 transition-all"
                  >
                    <FileText className="w-4 h-4 text-rose-400" />
                    <span>Upload Document (PDF/DOC)</span>
                  </button>
                </div>
              )}
            </div>

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Legal Adviser AI or assign a legal task..."
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

            {(inputPrompt.trim() || attachments.length > 0) && (
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

      {/* Hidden File Input for Image, Audio, Video, Document */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Live Camera Snapshot Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1F20] border border-[#2A2B2D] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl flex flex-col items-center">
            <div className="flex items-center justify-between w-full border-b border-[#2A2B2D] pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Camera Evidence Capture</h3>
              </div>
              <button onClick={handleCloseCamera} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="w-full relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-[#2A2B2D]">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>

            <div className="flex items-center gap-3 w-full pt-1">
              <button
                type="button"
                onClick={handleCloseCamera}
                className="flex-1 py-2.5 rounded-xl bg-[#28292A] hover:bg-[#37393B] text-slate-300 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
              >
                <Camera className="w-4 h-4" />
                Snap Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

