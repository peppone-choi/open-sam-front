'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { cn } from '@/lib/utils';

interface Letter {
  no: number;
  fromNation: string;
  toNation: string;
  brief: string;
  detail: string;
  date: string;
  status: string;
}

export default function DiplomacyPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [letters, setLetters] = useState<Letter[]>([]);
  const [nations, setNations] = useState<Array<[number, string, string, number]>>([]);
  const [loading, setLoading] = useState(true);
  const [showNewLetter, setShowNewLetter] = useState(false);
  const [newLetter, setNewLetter] = useState({
    prevNo: '',
    destNation: '',
    brief: '',
    detail: '',
  });

  useEffect(() => {
    loadLetters();
    loadNations();
  }, [serverID]);

  async function loadNations() {
    try {
      const result = await SammoAPI.GlobalGetNationList({ session_id: serverID });

      if (!result.result) {
        setNations([]);
        return;
      }

      if (Array.isArray(result.nationList)) {
        setNations(result.nationList);
      } else if (Array.isArray(result.nations)) {
        const list = result.nations.map((n: any): [number, string, string, number] => [
          n.nation ?? n.id,
          n.name,
          n.color ?? '#000000',
          0,
        ]);
        setNations(list);
      } else {
        setNations([]);
      }
    } catch (err) {
      console.error(err);
      setNations([]);
    }
  }

  async function loadLetters() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetDiplomacyLetter({ session_id: serverID });
      if (result.success && result.letters) {
        setLetters(result.letters);
        // 문서가 없으면 작성 폼을 기본으로 보여주기
        if (result.letters.length === 0) {
          setShowNewLetter(true);
        }
      } else {
        setLetters([]);
        setShowNewLetter(true);
      }
    } catch (err) {
      console.error(err);
      alert('외교문서를 불러오는데 실패했습니다.');
      setLetters([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendLetter() {
    if (!newLetter.destNation || !newLetter.brief) {
      alert('대상 국가와 내용을 입력해주세요.');
      return;
    }

    try {
      const result = await SammoAPI.SendDiplomacyLetter({
        serverID,
        session_id: serverID,
        prevNo: newLetter.prevNo ? Number(newLetter.prevNo) : undefined,
        destNationID: Number(newLetter.destNation),
        brief: newLetter.brief,
        detail: newLetter.detail,
      });

      if (result.success && result.result) {
        setNewLetter({ prevNo: '', destNation: '', brief: '', detail: '' });
        setShowNewLetter(false);
        await loadLetters();
      } else {
        alert(result.reason || result.message || '외교문서 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('외교문서 전송에 실패했습니다.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <TopBackBar title="외 교 부" reloadable onReload={loadLetters} />

        <div className="flex justify-between items-center">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              외교 문서함
           </h2>
           <button 
              onClick={() => setShowNewLetter(!showNewLetter)}
              className={cn(
                 "px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg",
                 showNewLetter 
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20"
              )}
           >
              {showNewLetter ? '작성 취소' : '새 문서 작성'}
           </button>
        </div>

        {showNewLetter && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">외교문서 작성</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">대상 국가</label>
                <select
                  value={newLetter.destNation}
                  onChange={(e) => setNewLetter({ ...newLetter, destNation: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                >
                  <option value="">국가를 선택하세요</option>
                  {nations.map(([nationNo, nationName, color]) => (
                    <option key={nationNo} value={nationNo} style={{ color }}>
                      {nationName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">내용 (국가 내 공개)</label>
                <textarea
                  value={newLetter.brief}
                  onChange={(e) => setNewLetter({ ...newLetter, brief: e.target.value })}
                  className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors resize-y placeholder-gray-600"
                  placeholder="국가 구성원 모두가 볼 수 있는 공개 내용을 입력하세요"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">상세 내용 (외교권자 전용)</label>
                <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden min-h-[200px]">
                  <TipTapEditor
                    content={newLetter.detail}
                    onChange={(content) => setNewLetter({ ...newLetter, detail: content })}
                    placeholder="외교권자만 볼 수 있는 상세 내용을 입력하세요 (선택사항)"
                    serverID={serverID}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="button" 
                  onClick={sendLetter} 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20"
                >
                  전송하기
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="min-h-[200px] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
            주고받은 외교문서가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {letters.map((letter) => (
              <div key={letter.no} className="group bg-gray-900/40 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-xl overflow-hidden transition-all duration-200 shadow-md hover:shadow-lg">
                {/* Header */}
                <div className="bg-white/[0.02] px-5 py-3 border-b border-white/5 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">{letter.fromNation}</span>
                    <span className="text-gray-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">{letter.toNation}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                     <span className="text-gray-500">{letter.date}</span>
                     <span className={cn(
                        "px-2 py-0.5 rounded font-bold uppercase border",
                        letter.status === 'pending' ? "bg-yellow-900/30 text-yellow-500 border-yellow-500/30" :
                        letter.status === 'accepted' ? "bg-green-900/30 text-green-500 border-green-500/30" :
                        letter.status === 'rejected' ? "bg-red-900/30 text-red-500 border-red-500/30" :
                        "bg-gray-800 text-gray-400 border-gray-700"
                     )}>
                        {letter.status}
                     </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  <div>
                     <div className="text-xs text-gray-500 uppercase font-bold mb-1">요약</div>
                     <div className="text-gray-200 text-sm leading-relaxed bg-black/20 p-3 rounded border border-white/5">
                        {letter.brief}
                     </div>
                  </div>
                  
                  {letter.detail && (
                    <div>
                       <div className="text-xs text-gray-500 uppercase font-bold mb-1">상세 내용</div>
                       <div className="text-gray-400 text-sm leading-relaxed prose prose-invert max-w-none prose-sm bg-black/20 p-3 rounded border border-white/5" dangerouslySetInnerHTML={{ __html: letter.detail }} />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="bg-black/20 px-5 py-3 border-t border-white/5 flex justify-between items-center">
                   <div className="flex gap-2">
                      {letter.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              if(!confirm('정말 수락하시겠습니까?')) return;
                              try {
                                const result = await SammoAPI.RespondDiplomacyLetter({
                                  serverID,
                                  letterNo: letter.no,
                                  action: 'accept',
                                });
                                if (result.result) {
                                  await loadLetters();
                                } else {
                                  alert(result.reason || '처리에 실패했습니다.');
                                }
                              } catch (err) {
                                console.error(err);
                                alert('처리에 실패했습니다.');
                              }
                            }}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-green-900/20"
                          >
                            수락
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if(!confirm('정말 거절하시겠습니까?')) return;
                              try {
                                const result = await SammoAPI.RespondDiplomacyLetter({
                                  serverID,
                                  letterNo: letter.no,
                                  action: 'reject',
                                });
                                if (result.result) {
                                  await loadLetters();
                                } else {
                                  alert(result.reason || '처리에 실패했습니다.');
                                }
                              } catch (err) {
                                console.error(err);
                                alert('처리에 실패했습니다.');
                              }
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-red-900/20"
                          >
                            거절
                          </button>
                        </>
                      )}
                   </div>
                   
                   <button
                     type="button"
                     onClick={() => {
                       setShowNewLetter(true);
                       setNewLetter({
                         prevNo: String(letter.no),
                         destNation: '',
                         brief: '',
                         detail: '',
                       });
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                     }}
                     className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded border border-white/10 transition-colors"
                   >
                     추가 문서 작성
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
 
 
 
 
