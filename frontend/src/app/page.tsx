'use client';

import React, { useState } from 'react';
import { GeminiSidebar, ChatThreadItem } from '../components/GeminiSidebar';
import { GeminiChatbot, ChatMessage } from '../components/GeminiChatbot';

export default function Home() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>(undefined);
  const [loadedThreadId, setLoadedThreadId] = useState<string | undefined>(undefined);
  const [loadedMessages, setLoadedMessages] = useState<ChatMessage[] | undefined>(undefined);
  const [chatKey, setChatKey] = useState<number>(0);

  const handleNewChat = () => {
    setSelectedPrompt(undefined);
    setLoadedThreadId(`thread_${Date.now()}`);
    setLoadedMessages([]);
    setChatKey(prev => prev + 1);
  };

  const handleSelectPreset = (promptText: string) => {
    setSelectedPrompt(promptText);
    setLoadedThreadId(`thread_${Date.now()}`);
    setLoadedMessages([]);
    setChatKey(prev => prev + 1);
  };

  const handleSelectThread = (thread: ChatThreadItem) => {
    setSelectedPrompt(undefined);
    setLoadedThreadId(thread.id);
    setLoadedMessages(thread.messages || []);
    setChatKey(prev => prev + 1);
  };

  return (
    <div className="flex h-screen w-screen bg-[#131314] overflow-hidden font-sans">
      {/* Left Sidebar matching Gemini Web UI */}
      <GeminiSidebar
        onNewChat={handleNewChat}
        onSelectPreset={handleSelectPreset}
        onSelectThread={handleSelectThread}
        activeThreadId={loadedThreadId}
      />

      {/* Main Gemini Canvas Area with Natural Vertical Scroll */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        <GeminiChatbot
          key={chatKey}
          initialPrompt={selectedPrompt}
          loadedThreadId={loadedThreadId}
          loadedMessages={loadedMessages}
        />
      </main>
    </div>
  );
}
