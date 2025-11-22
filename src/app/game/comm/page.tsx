'use client';

import { useState } from 'react';

interface Mail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
}

const MOCK_MAILS: Mail[] = [
  { id: '1', from: '최고 사령부', subject: '라그나로크 작전 명령', body: '즉시 A-1 구역으로 이동하라. 함대가 대기 중이다.', date: '796.01.05', isRead: false },
  { id: '2', from: '양 웬리', subject: '답장: 다과회 초대', body: '참석하고 싶지만 해야 할 일이 있어 아쉽습니다.', date: '796.01.04', isRead: true },
  { id: '3', from: '줄리안 민츠', subject: '보급 보고', body: '차 잎 재고가 바닥나고 있습니다.', date: '796.01.03', isRead: true },
];

export default function CommPage() {
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [tab, setTab] = useState<'inbox' | 'outbox' | 'address'>('inbox');

  return (
    <div className="flex h-full p-4 gap-4 font-mono text-sm">
       {/* 사이드바 */}
       <div className="w-1/3 flex flex-col bg-[#101520] border border-[#333]">
          {/* 탭 */}
          <div className="flex border-b border-[#333]">
             <button onClick={() => setTab('inbox')} className={`flex-1 p-2 hover:bg-[#1E90FF]/20 ${tab==='inbox' ? 'text-[#1E90FF] border-b-2 border-[#1E90FF]' : 'text-[#9CA3AF]'}`}>수신함 (2/120)</button>
             <button onClick={() => setTab('outbox')} className={`flex-1 p-2 hover:bg-[#1E90FF]/20 ${tab==='outbox' ? 'text-[#1E90FF] border-b-2 border-[#1E90FF]' : 'text-[#9CA3AF]'}`}>발신함</button>
             <button onClick={() => setTab('address')} className={`flex-1 p-2 hover:bg-[#1E90FF]/20 ${tab==='address' ? 'text-[#1E90FF] border-b-2 border-[#1E90FF]' : 'text-[#9CA3AF]'}`}>주소록</button>
          </div>
      
      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">

             {MOCK_MAILS.map(mail => (
               <div 
                 key={mail.id}
                 onClick={() => setSelectedMail(mail)}
                 className={`p-3 border-b border-[#333] cursor-pointer hover:bg-[#1E90FF]/10 ${selectedMail?.id === mail.id ? 'bg-[#1E90FF]/20' : ''}`}
               >
                 <div className="flex justify-between mb-1">
                    <span className={`${mail.isRead ? 'text-[#9CA3AF]' : 'text-[#FFD700] font-bold'}`}>{mail.from}</span>
                    <span className="text-xs text-[#666]">{mail.date}</span>
                 </div>
                 <div className="truncate text-[#E0E0E0]">{mail.subject}</div>
               </div>
             ))}
          </div>
       </div>

    {/* 열람 영역 */}
    <div className="flex-1 bg-[#050510] border border-[#333] flex flex-col relative">

          {selectedMail ? (
            <>
              <div className="p-4 border-b border-[#333] bg-[#101520]">
                 <div className="text-lg text-[#FFD700] mb-2">{selectedMail.subject}</div>
                 <div className="flex justify-between text-xs text-[#9CA3AF]">
                    <span>발신: {selectedMail.from}</span>
                    <span>일시: {selectedMail.date}</span>
                 </div>
              </div>
              <div className="p-6 leading-relaxed whitespace-pre-wrap">
                 {selectedMail.body}
              </div>
               <div className="mt-auto p-4 border-t border-[#333] flex gap-2 justify-end bg-[#101520]">
                  <button className="px-4 py-1 border border-[#1E90FF] text-[#1E90FF] hover:bg-[#1E90FF]/20">회신</button>
                  <button className="px-4 py-1 border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/20">삭제</button>
               </div>

            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#333]">
                 <div className="text-center">
                    <div className="text-4xl mb-4">📡</div>
                    <div>보안 통신 링크</div>
                 </div>

            </div>
          )}
       </div>
    </div>
  );
}
