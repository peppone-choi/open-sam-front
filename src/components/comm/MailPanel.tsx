'use client';

import { useState, useEffect } from 'react';
import { Mail } from '@/types/comm';

interface MailPanelProps {
  sessionId: string;
  characterId: string;
  characterName: string;
  onNewMail?: (count: number) => void;
}

// Mock data for now - will integrate with actual API when mail endpoints are ready
const MOCK_MAILS: Mail[] = [
  {
    mailId: '1',
    sessionId: 'session1',
    fromCharacterId: 'char-001',
    fromName: '최고 사령부',
    fromAddress: 'supreme-hq@alliance.mil',
    toCharacterId: 'my-char',
    toName: '양 웬리',
    toAddress: 'yang@fleet13.alliance.mil',
    subject: '라그나로크 작전 명령',
    body: '즉시 A-1 구역으로 이동하라. 함대가 대기 중이다.\n\n이번 작전의 성공은 우리 동맹의 미래가 달려있습니다.',
    isRead: false,
    createdAt: new Date('2025-01-05').toISOString(),
  },
  {
    mailId: '2',
    sessionId: 'session1',
    fromCharacterId: 'char-002',
    fromName: '줄리안 민츠',
    fromAddress: 'julian@fleet13.alliance.mil',
    toCharacterId: 'my-char',
    toName: '양 웬리',
    toAddress: 'yang@fleet13.alliance.mil',
    subject: '보급 보고',
    body: '제독님,\n\n차 잎 재고가 바닥나고 있습니다. 다음 보급 시 반드시 확보해야 합니다.',
    isRead: true,
    createdAt: new Date('2025-01-03').toISOString(),
  },
];

export function MailPanel({ sessionId, characterId, characterName, onNewMail }: MailPanelProps) {
  const [mails, setMails] = useState<Mail[]>(MOCK_MAILS);
  const [tab, setTab] = useState<'inbox' | 'outbox'>('inbox');
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });

  const MAIL_LIMIT = 120;
  const inboxMails = mails.filter((m) => m.toCharacterId === characterId);
  const outboxMails = mails.filter((m) => m.fromCharacterId === characterId);
  const currentMails = tab === 'inbox' ? inboxMails : outboxMails;

  const unreadCount = inboxMails.filter((m) => !m.isRead).length;
  const isNearLimit = inboxMails.length >= MAIL_LIMIT * 0.8;
  const isAtLimit = inboxMails.length >= MAIL_LIMIT;

  useEffect(() => {
    onNewMail?.(unreadCount);
  }, [unreadCount]);

  const handleSelectMail = (mail: Mail) => {
    setSelectedMail(mail);
    if (!mail.isRead && mail.toCharacterId === characterId) {
      // Mark as read
      setMails((prev) =>
        prev.map((m) => (m.mailId === mail.mailId ? { ...m, isRead: true } : m))
      );
    }
  };

  const handleReply = () => {
    if (!selectedMail) return;
    setComposeData({
      to: selectedMail.fromName,
      subject: `Re: ${selectedMail.subject}`,
      body: `\n\n---\n${selectedMail.fromName} 님이 작성:\n${selectedMail.body}`,
    });
    setShowCompose(true);
    setSelectedMail(null);
  };

  const handleDelete = () => {
    if (!selectedMail || !confirm('정말로 이 메일을 삭제하시겠습니까?')) return;
    setMails((prev) => prev.filter((m) => m.mailId !== selectedMail.mailId));
    setSelectedMail(null);
  };

  const handleSendMail = () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      alert('받는 사람, 제목, 본문을 모두 입력해주세요.');
      return;
    }

    const newMail: Mail = {
      mailId: `mail-${Date.now()}`,
      sessionId,
      fromCharacterId: characterId,
      fromName: characterName,
      fromAddress: `${characterId}@personal.address`,
      toCharacterId: 'target-char', // Would be resolved from address book
      toName: composeData.to,
      toAddress: `${composeData.to}@address`,
      subject: composeData.subject,
      body: composeData.body,
      isRead: true,
      createdAt: new Date().toISOString(),
    };

    setMails((prev) => [newMail, ...prev]);
    setShowCompose(false);
    setComposeData({ to: '', subject: '', body: '' });
    setTab('outbox');
    alert('메일이 전송되었습니다.');
  };

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar */}
      <div className="w-1/3 flex flex-col bg-[#101520] border border-[#333]">
        {/* Tabs */}
        <div className="flex border-b border-[#333]">
          <button
            onClick={() => setTab('inbox')}
            className={`flex-1 p-3 hover:bg-[#1E90FF]/20 ${
              tab === 'inbox'
                ? 'text-[#1E90FF] border-b-2 border-[#1E90FF]'
                : 'text-[#9CA3AF]'
            }`}
          >
            수신함 ({unreadCount}/{inboxMails.length}/{MAIL_LIMIT})
          </button>
          <button
            onClick={() => setTab('outbox')}
            className={`flex-1 p-3 hover:bg-[#1E90FF]/20 ${
              tab === 'outbox'
                ? 'text-[#1E90FF] border-b-2 border-[#1E90FF]'
                : 'text-[#9CA3AF]'
            }`}
          >
            발신함 ({outboxMails.length})
          </button>
        </div>

        {/* Warnings */}
        {tab === 'inbox' && isNearLimit && (
          <div
            className={`p-2 text-xs ${
              isAtLimit
                ? 'bg-[#EF4444]/20 text-[#EF4444] border-b border-[#EF4444]'
                : 'bg-[#FFD700]/20 text-[#FFD700] border-b border-[#FFD700]'
            }`}
          >
            {isAtLimit
              ? '⚠️ 메일함이 가득 찼습니다! (120/120) 새 메일을 받을 수 없습니다.'
              : `⚠️ 메일함이 거의 가득 찼습니다. (${inboxMails.length}/${MAIL_LIMIT})`}
          </div>
        )}

        {/* Compose Button */}
        {tab === 'inbox' && (
          <div className="p-2 border-b border-[#333]">
            <button
              onClick={() => setShowCompose(true)}
              className="w-full px-3 py-2 border border-[#1E90FF] text-[#1E90FF] hover:bg-[#1E90FF]/20 text-sm"
            >
              ✉️ 새 메일 작성
            </button>
          </div>
        )}

        {/* Mail List */}
        <div className="flex-1 overflow-y-auto">
          {currentMails.length === 0 ? (
            <div className="text-center text-[#666] py-8 text-sm">
              {tab === 'inbox' ? '받은 메일이 없습니다.' : '보낸 메일이 없습니다.'}
            </div>
          ) : (
            currentMails.map((mail) => (
              <div
                key={mail.mailId}
                onClick={() => handleSelectMail(mail)}
                className={`p-3 border-b border-[#333] cursor-pointer hover:bg-[#1E90FF]/10 ${
                  selectedMail?.mailId === mail.mailId ? 'bg-[#1E90FF]/20' : ''
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span
                    className={`text-sm ${
                      !mail.isRead && mail.toCharacterId === characterId
                        ? 'text-[#FFD700] font-bold'
                        : 'text-[#9CA3AF]'
                    }`}
                  >
                    {tab === 'inbox' ? mail.fromName : mail.toName}
                  </span>
                  <span className="text-xs text-[#666]">
                    {new Date(mail.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="truncate text-[#E0E0E0] text-sm">{mail.subject}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mail Viewer */}
      <div className="flex-1 bg-[#050510] border border-[#333] flex flex-col">
        {showCompose ? (
          <>
            <div className="p-4 border-b border-[#333] bg-[#101520]">
              <h3 className="text-lg text-[#1E90FF] font-bold">새 메일 작성</h3>
            </div>
            <div className="flex-1 p-4 space-y-3">
              <div>
                <label className="block text-[#9CA3AF] text-sm mb-1">받는 사람</label>
                <input
                  type="text"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101520] border border-[#333] text-[#E0E0E0] focus:outline-none focus:border-[#1E90FF]"
                />
              </div>
              <div>
                <label className="block text-[#9CA3AF] text-sm mb-1">제목</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101520] border border-[#333] text-[#E0E0E0] focus:outline-none focus:border-[#1E90FF]"
                />
              </div>
              <div>
                <label className="block text-[#9CA3AF] text-sm mb-1">본문</label>
                <textarea
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 bg-[#101520] border border-[#333] text-[#E0E0E0] focus:outline-none focus:border-[#1E90FF] resize-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-[#333] flex gap-2 justify-end bg-[#101520]">
              <button
                onClick={() => {
                  setShowCompose(false);
                  setComposeData({ to: '', subject: '', body: '' });
                }}
                className="px-4 py-2 border border-[#666] text-[#9CA3AF] hover:bg-[#666]/20"
              >
                취소
              </button>
              <button
                onClick={handleSendMail}
                className="px-4 py-2 border border-[#1E90FF] text-[#1E90FF] hover:bg-[#1E90FF]/20"
              >
                전송
              </button>
            </div>
          </>
        ) : selectedMail ? (
          <>
            <div className="p-4 border-b border-[#333] bg-[#101520]">
              <div className="text-lg text-[#FFD700] mb-2">{selectedMail.subject}</div>
              <div className="flex justify-between text-xs text-[#9CA3AF]">
                <span>
                  {tab === 'inbox' ? '발신' : '수신'}: {tab === 'inbox' ? selectedMail.fromName : selectedMail.toName}
                </span>
                <span>일시: {new Date(selectedMail.createdAt).toLocaleString('ko-KR')}</span>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto leading-relaxed whitespace-pre-wrap text-[#E0E0E0]">
              {selectedMail.body}
            </div>
            <div className="p-4 border-t border-[#333] flex gap-2 justify-end bg-[#101520]">
              {tab === 'inbox' && (
                <button
                  onClick={handleReply}
                  className="px-4 py-2 border border-[#1E90FF] text-[#1E90FF] hover:bg-[#1E90FF]/20"
                >
                  회신
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/20"
              >
                삭제
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#333]">
            <div className="text-center">
              <div className="text-4xl mb-4">📡</div>
              <div>보안 통신 링크</div>
              <div className="text-sm mt-2">메일을 선택하세요</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
