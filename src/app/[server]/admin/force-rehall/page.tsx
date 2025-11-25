'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface AdminGeneralSummary {
  no: number;
  name: string;
}

export default function AdminForceRehallPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<AdminGeneralSummary[]>([]);
  const [selectedGeneral, setSelectedGeneral] = useState<number | ''>('');

  const loadGeneralList = useCallback(async () => {
    if (!serverID) {
      return;
    }

    try {
      setLoading(true);
      const result = await SammoAPI.GetGeneralList({ session_id: serverID });
      if (result.result) {
        const list = (result.generalList ?? result.generals ?? []) as AdminGeneralSummary[];
        setGeneralList(list);
      } else {
        setGeneralList([]);
      }
    } catch (error) {
      console.error('[AdminForceRehall] general list error', error);
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  useEffect(() => {
    void loadGeneralList();
  }, [loadGeneralList]);

  const handleForceRehall = useCallback(async () => {
    if (selectedGeneral === '') {
      showToast('장수를 선택해주세요.', 'warning');
      return;
    }
    if (!confirm('정말로 강제 재할당을 하시겠습니까?')) {
      return;
    }
    try {
      const result = await SammoAPI.AdminForceRehall({
        generalID: selectedGeneral,
      });
      
      if (result.result) {
        showToast('강제 재할당이 완료되었습니다.', 'success');
        setSelectedGeneral('');
        await loadGeneralList();
      } else {
        showToast(result.reason || '강제 재할당에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('[AdminForceRehall] force error', error);
      showToast('강제 재할당에 실패했습니다.', 'error');
    }
  }, [loadGeneralList, selectedGeneral, showToast]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="강제 재할당" reloadable onReload={loadGeneralList} />
      
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-8 shadow-lg">
            <div className="space-y-6">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm">
                <p className="font-bold mb-2">⚠️ 주의사항</p>
                <p>강제 재할당은 특정 장수를 명예의 전당 재계산 로직에 강제로 포함시킵니다. 서버 부하가 발생할 수 있으므로 신중하게 사용하세요.</p>
              </div>

              <div className="flex flex-col gap-4">
                <label className="font-bold text-white">장수 선택</label>
                <select
                  value={selectedGeneral}
                  onChange={(e) => setSelectedGeneral(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                >
                  <option value="" className="bg-gray-900">선택하세요</option>
                  {generalList.map((general) => (
                    <option key={general.no} value={general.no} className="bg-gray-900">
                      {general.name}
                    </option>
                  ))}
                </select>
                
                <button 
                  type="button" 
                  onClick={handleForceRehall} 
                  disabled={selectedGeneral === ''}
                  className={cn(
                    "w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg",
                    selectedGeneral !== '' 
                      ? "bg-red-600 hover:bg-red-500 hover:shadow-red-500/30 transform hover:-translate-y-0.5" 
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  )}
                >
                  강제 재할당 실행
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
