'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';

function DiplomacyProcessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const action = searchParams?.get('action') || '';
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [diplomacyData, setDiplomacyData] = useState<any>(null);

  useEffect(() => {
    loadDiplomacyData();
  }, [serverID, action]);

  const router = useRouter();
  const letterNo = searchParams?.get('letterNo') ? Number(searchParams.get('letterNo')) : 0;

  async function loadDiplomacyData() {
    if (!letterNo) {
      return;
    }

    try {
      setLoading(true);
      // 외교 데이터는 GetDiplomacyLetter에서 가져올 수 있음
      const result = await SammoAPI.GetDiplomacyLetter({ session_id: serverID });
      if (result.result && result.letters) {
        const letter = result.letters.find((l: any) => l.no === letterNo);
        setDiplomacyData(letter || null);
      }
    } catch (err) {
      console.error(err);
      showToast('외교 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: any) {
    if (!letterNo || !action) {
      showToast('필수 정보가 없습니다.', 'warning');
      return;
    }

    try {
      const result = await SammoAPI.DiplomacyProcess({
        serverID,
        session_id: serverID,
        letterNo,
        action,
        data: formData,
      });

      if (result.result) {
        showToast('처리되었습니다.', 'success');
        router.push(`/${serverID}/diplomacy`);
      } else {
        showToast(result.reason || '처리에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('처리에 실패했습니다.', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <TopBackBar title="외교 처리" />
        
        {loading ? (
          <div className="min-h-[200px] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            {diplomacyData ? (
              <div className="space-y-6">
                <div className="space-y-2">
                   <h3 className="text-lg font-bold text-white">외교 문서 #{diplomacyData.no}</h3>
                   <div className="flex gap-4 text-sm text-gray-400">
                      <span>보낸 국가: {diplomacyData.fromNation}</span>
                      <span>받는 국가: {diplomacyData.toNation}</span>
                   </div>
                </div>
                
                <div className="bg-black/20 p-4 rounded-lg border border-white/5 text-sm text-gray-300 leading-relaxed">
                   {diplomacyData.brief}
                </div>
                
                {/* TODO: Implement specific forms based on 'action' type if needed */}
                <div className="flex justify-end gap-2">
                   <button 
                     onClick={() => handleSubmit({})} 
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20"
                   >
                     확인
                   </button>
                   <button 
                     onClick={() => router.back()} 
                     className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg text-sm transition-colors"
                   >
                     취소
                   </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                해당 외교 문서를 찾을 수 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiplomacyProcessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">로딩 중...</div>}>
      <DiplomacyProcessContent />
    </Suspense>
  );
}





