'use client';

import { useState, useEffect, useRef } from 'react';
import { loghApi } from '@/lib/api/logh';
import { ChatMessage, ChannelType } from '@/types/comm';

interface ChatPanelProps {
  sessionId: string;
  characterId: string;
  characterName: string;
  onNewMessage?: (count: number) => void;
}

export function ChatPanel({ sessionId, characterId, characterName, onNewMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channelType, setChannelType] = useState<ChannelType>('global');
  const [scopeId, setScopeId] = useState<string>('');
  const [filterText, setFilterText] = useState('');

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await loghApi.getChatMessages(
        sessionId,
        channelType,
        channelType === 'global' ? undefined : scopeId,
        100
      );
      setMessages(data);
      onNewMessage?.(data.length);
      scrollToBottom();
    } catch (error: any) {
      console.error('Failed to load chat messages:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadMessages();
  }, [sessionId, channelType, scopeId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      const newMessage = await loghApi.sendChatMessage(
        sessionId,
        channelType,
        characterId,
        inputMessage,
        channelType === 'global' ? undefined : scopeId
      );
      setMessages((prev) => {
        const next = [...prev, newMessage];
        onNewMessage?.(next.length);
        return next;
      });
      setInputMessage('');
      scrollToBottom();
    } catch (error: any) {

      console.error('Failed to send message:', error);
      alert(`메시지 전송 실패: ${error.message}`);
    }
  };

  const handleChannelChange = (newChannel: ChannelType) => {
    setChannelType(newChannel);
    if (newChannel === 'global') {
      setScopeId('');
    }
  };
 
  const visibleMessages = filterText
    ? messages.filter((msg) => {
        const text = (msg.message || '').toLowerCase();
        const sender = (msg.senderName || '').toLowerCase();
        const q = filterText.toLowerCase();
        return text.includes(q) || sender.includes(q);
      })
    : messages;
 
  return (
    <div className="flex flex-col h-full bg-[#050510] border border-[#333]">

      {/* Channel Selector */}
      <div className="p-3 border-b border-[#333] bg-[#101520]">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handleChannelChange('global')}
            className={`px-3 py-1 text-sm border ${
              channelType === 'global'
                ? 'border-[#1E90FF] text-[#1E90FF] bg-[#1E90FF]/20'
                : 'border-[#333] text-[#9CA3AF] hover:bg-[#1E90FF]/10'
            }`}
          >
            전역 채팅
          </button>
          <button
            onClick={() => handleChannelChange('fleet')}
            className={`px-3 py-1 text-sm border ${
              channelType === 'fleet'
                ? 'border-[#1E90FF] text-[#1E90FF] bg-[#1E90FF]/20'
                : 'border-[#333] text-[#9CA3AF] hover:bg-[#1E90FF]/10'
            }`}
          >
            함대 채팅
          </button>
          <button
            onClick={() => handleChannelChange('spot')}
            className={`px-3 py-1 text-sm border ${
              channelType === 'spot'
                ? 'border-[#1E90FF] text-[#1E90FF] bg-[#1E90FF]/20'
                : 'border-[#333] text-[#9CA3AF] hover:bg-[#1E90FF]/10'
            }`}
          >
            지점 채팅
          </button>
          <button
            onClick={() => handleChannelChange('whisper')}
            className={`px-3 py-1 text-sm border ${
              channelType === 'whisper'
                ? 'border-[#FFD700] text-[#FFD700] bg-[#FFD700]/20'
                : 'border-[#333] text-[#9CA3AF] hover:bg-[#FFD700]/10'
            }`}
          >
            귓속말
          </button>
        </div>

        {channelType !== 'global' && (
          <div className="mt-1 flex gap-2">
            <div className="flex-1">
              <label htmlFor="scopeId" className="sr-only">
                {channelType === 'fleet'
                  ? '함대 ID'
                  : channelType === 'whisper'
                  ? '대상 캐릭터 ID'
                  : '지점 ID'}
              </label>
              <input
                id="scopeId"
                type="text"
                placeholder={
                  channelType === 'fleet'
                    ? '함대 ID 입력'
                    : channelType === 'whisper'
                    ? '대상 캐릭터 ID 입력'
                    : '지점 ID 입력'
                }
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-[#050510] border border-[#333] text-[#E0E0E0] focus:outline-none focus:border-[#1E90FF]"
                aria-label={
                  channelType === 'fleet'
                    ? '함대 ID 입력'
                    : channelType === 'whisper'
                    ? '대상 캐릭터 ID 입력'
                    : '지점 ID 입력'
                }
              />
            </div>
            <div className="w-40">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="메시지 검색"
                className="w-full px-2 py-1 text-xs bg-[#050510] border border-[#333] text-[#E0E0E0] focus:outline-none focus:border-[#1E90FF]"
                aria-label="채팅 검색"
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">

        {loading ? (
          <div className="text-center text-[#666] py-8">메시지 로딩 중...</div>
        ) : visibleMessages.length === 0 ? (

          <div className="text-center text-[#666] py-8">
            메시지가 없습니다.
            <br />
            <span className="text-xs">
              {channelType === 'global'
                ? '전역 채널에서 모든 플레이어와 대화할 수 있습니다.'
                : `${channelType === 'fleet' ? '함대' : '지점'} 채널은 특정 범위 내 플레이어만 볼 수 있습니다.`}
            </span>
          </div>
        ) : (
          visibleMessages.map((msg) => (

            <div
              key={msg.messageId}
              className={`p-2 rounded ${
                msg.senderCharacterId === characterId
                  ? 'bg-[#1E90FF]/20 ml-8'
                  : 'bg-[#101520] mr-8'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-xs font-bold ${
                    msg.senderCharacterId === characterId ? 'text-[#1E90FF]' : 'text-[#FFD700]'
                  }`}
                >
                  {msg.senderName}
                </span>
                <span className="text-xs text-[#666]">
                  {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="text-sm text-[#E0E0E0] whitespace-pre-wrap">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#333] bg-[#101520]">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
          <label htmlFor="chatInput" className="sr-only">
            채팅 메시지 입력
          </label>
          <input
            id="chatInput"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="메시지 입력... (Enter로 전송)"
            className="flex-1 px-3 py-2 bg-[#050510] border border-[#333] text-[#E0E0E0] text-sm focus:outline-none focus:border-[#1E90FF]"
            aria-label="채팅 메시지 입력"
          />
          <button
            type="submit"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="px-4 py-2 border border-[#1E90FF] text-[#1E90FF] hover:bg-[#1E90FF]/20 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            aria-label="메시지 전송"
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
}
