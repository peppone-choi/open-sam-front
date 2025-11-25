'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

export default function VotePage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [voteData, setVoteData] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    loadVoteData();
  }, [serverID]);

  async function loadVoteData() {
    try {
      setLoading(true);
      const result = await SammoAPI.VoteGetVoteList();
      if (result.result && result.votes.length > 0) {
        // 가장 최근 투표 가져오기
        const latestVote = result.votes[0];
        setVoteData(latestVote);
      } else {
        setVoteData(null);
      }
    } catch (err) {
      console.error(err);
      showToast('투표 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitVote() {
    if (selectedOption === null || !voteData) {
      showToast('옵션을 선택해주세요.', 'warning');
      return;
    }
    
    try {
      const result = await SammoAPI.VoteVote({
        voteID: voteData.id || voteData.no,
        option: selectedOption,
      });

      if (result.result) {
        showToast('투표가 완료되었습니다.', 'success');
        setSelectedOption(null);
        await loadVoteData();
      } else {
        showToast(result.reason || '투표에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('투표에 실패했습니다.', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <TopBackBar title="설문 조사" reloadable onReload={loadVoteData} />
        
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : voteData ? (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-8 shadow-lg">
            <h2 className="text-xl font-bold text-white text-center mb-6 border-b border-white/5 pb-4 leading-relaxed">
               {voteData.title || voteData.brief}
            </h2>
            
            <div className="space-y-3 mb-8">
              {voteData.options?.map((option: any, idx: number) => (
                <label 
                  key={idx} 
                  className={cn(
                     "flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 group",
                     selectedOption === idx 
                        ? "bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/30" 
                        : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/20"
                  )}
                >
                  <input
                    type="radio"
                    name="vote"
                    value={idx}
                    checked={selectedOption === idx}
                    onChange={() => setSelectedOption(idx)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-2 mr-3"
                  />
                  <span className={cn(
                     "text-sm font-medium group-hover:text-gray-200",
                     selectedOption === idx ? "text-blue-400" : "text-gray-400"
                  )}>
                     {typeof option === 'string' ? option : option.text || option}
                  </span>
                </label>
              )) || (
                <div className="text-center text-gray-500 py-4">투표 옵션을 불러올 수 없습니다.</div>
              )}
            </div>
            
            <button 
               type="button" 
               onClick={handleSubmitVote} 
               className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={selectedOption === null}
            >
              투표하기
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
             진행중인 설문이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}




