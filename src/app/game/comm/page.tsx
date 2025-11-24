'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { ChatPanel } from '@/components/comm/ChatPanel';
import { MessengerPanel } from '@/components/comm/MessengerPanel';
import { MailPanel } from '@/components/comm/MailPanel';

type CommTab = 'chat' | 'messenger' | 'mail';

export default function CommPage() {
  const [activeTab, setActiveTab] = useState<CommTab>('chat');
  const [badges, setBadges] = useState({
    chat: 0,
    messenger: 0,
    mail: 0,
  });

  // Get user session info (mock for now - should come from context/auth)
  const sessionId = 'session-logh-1';
  const characterId = 'char-yang-wenli';
  const characterName = '양 웬리';

  // Socket integration for real-time badges
  const { isConnected, onNewChatMessage, onNewHandshake, onNewMail } = useSocket({
    sessionId,
    autoConnect: true,
  });

  useEffect(() => {
    // Subscribe to new chat messages
    const unsubChat = onNewChatMessage((data) => {
      console.log('New chat message:', data);
      if (activeTab !== 'chat') {
        setBadges((prev) => ({ ...prev, chat: prev.chat + 1 }));
      }
    });

    // Subscribe to new handshake requests
    const unsubHandshake = onNewHandshake((data) => {
      console.log('New handshake request:', data);
      if (data.targetCharacterId === characterId && activeTab !== 'messenger') {
        setBadges((prev) => ({ ...prev, messenger: prev.messenger + 1 }));
      }
    });

    // Subscribe to new mail
    const unsubMail = onNewMail((data) => {
      console.log('New mail:', data);
      if (activeTab !== 'mail') {
        setBadges((prev) => ({ ...prev, mail: prev.mail + 1 }));
      }
    });

    return () => {
      unsubChat();
      unsubHandshake();
      unsubMail();
    };
  }, [activeTab, characterId]);

  const handleTabChange = (tab: CommTab) => {
    setActiveTab(tab);
    // Clear badge for the active tab
    setBadges((prev) => ({ ...prev, [tab]: 0 }));
  };

  const handleNewChatMessage = (count: number) => {
    if (activeTab === 'chat') {
      setBadges((prev) => ({ ...prev, chat: 0 }));
    }
  };

  const handleNewHandshake = (count: number) => {
    if (activeTab !== 'messenger') {
      setBadges((prev) => ({ ...prev, messenger: count }));
    } else {
      setBadges((prev) => ({ ...prev, messenger: 0 }));
    }
  };

  const handleNewMail = (count: number) => {
    if (activeTab !== 'mail') {
      setBadges((prev) => ({ ...prev, mail: count }));
    } else {
      setBadges((prev) => ({ ...prev, mail: 0 }));
    }
  };

  return (
    <div className="flex flex-col h-full p-4 font-mono text-sm bg-[#050510]">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-[#333]">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#FFD700]">📡 통신 시스템</h1>
          <div className="flex items-center gap-3">
            <div
              className={`text-xs ${
                isConnected ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}
            >
              {isConnected ? '🟢 실시간 연결됨' : '🔴 연결 끊김'}
            </div>
            <div className="text-xs text-[#9CA3AF]">{characterName}</div>
          </div>
        </div>
        <div className="text-xs text-[#666] mt-2">
          Manual P.15-P.17 | Chat (spot/fleet/global), Messenger (명함 교환), Mail (120개 제한)
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleTabChange('chat')}
          className={`flex-1 px-6 py-3 border transition-colors relative ${
            activeTab === 'chat'
              ? 'border-[#1E90FF] text-[#1E90FF] bg-[#1E90FF]/20 font-bold'
              : 'border-[#333] text-[#9CA3AF] hover:bg-[#1E90FF]/10'
          }`}
        >
          💬 채팅
          {badges.chat > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#EF4444] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {badges.chat}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('messenger')}
          className={`flex-1 px-6 py-3 border transition-colors relative ${
            activeTab === 'messenger'
              ? 'border-[#1E90FF] text-[#1E90FF] bg-[#1E90FF]/20 font-bold'
              : 'border-[#333] text-[#9CA3AF] hover:bg-[#1E90FF]/10'
          }`}
        >
          🤝 메신저
          {badges.messenger > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#FFD700] text-black text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {badges.messenger}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('mail')}
          className={`flex-1 px-6 py-3 border transition-colors relative ${
            activeTab === 'mail'
              ? 'border-[#1E90FF] text-[#1E90FF] bg-[#1E90FF]/20 font-bold'
              : 'border-[#333] text-[#9CA3AF] hover:bg-[#1E90FF]/10'
          }`}
        >
          ✉️ 메일
          {badges.mail > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#EF4444] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {badges.mail}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'chat' && (
          <ChatPanel
            sessionId={sessionId}
            characterId={characterId}
            characterName={characterName}
            onNewMessage={handleNewChatMessage}
          />
        )}
        {activeTab === 'messenger' && (
          <MessengerPanel
            sessionId={sessionId}
            characterId={characterId}
            characterName={characterName}
            onNewHandshake={handleNewHandshake}
          />
        )}
        {activeTab === 'mail' && (
          <MailPanel
            sessionId={sessionId}
            characterId={characterId}
            characterName={characterName}
            onNewMail={handleNewMail}
          />
        )}
      </div>
    </div>
  );
}
