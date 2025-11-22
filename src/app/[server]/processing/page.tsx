'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';

function ProcessingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serverID = params?.server as string;
  const commandType = searchParams?.get('command') || '';
  const turnList = searchParams?.get('turnList')?.split('_').map(Number) || [];
  const isChiefTurn = searchParams?.get('is_chief') === 'true';

  const [loading, setLoading] = useState(true);
  const [commandData, setCommandData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (commandType && turnList.length > 0) {
      loadCommandData();
    }
  }, [commandType, turnList, isChiefTurn]);

  async function loadCommandData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetCommandTable({
        command: commandType,
        turnList: turnList,
        isChief: isChiefTurn,
      } as any);

      if (result.result) {
        setCommandData(result.commandTable);
        // 폼 데이터 초기화
        setFormData({});
      } else {
        alert(result.reason || '명령 정보를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('명령 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      const result = await SammoAPI.CommandReserveCommand({ 
        command: commandType,
        args: formData,
        turnList: turnList,
      } as any);

      if (result.result) {
        router.push(`/${serverID}/game`);
      } else {
        alert(result.reason || '명령 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('명령 등록에 실패했습니다.');
    }
  }

  if (!commandType || turnList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
        <TopBackBar title="명령 처리" />
        <div className="min-h-[50vh] flex items-center justify-center text-gray-500 font-bold">
           잘못된 접근입니다.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <TopBackBar title="명령 처리" />
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-8 shadow-lg space-y-8">
            <h2 className="text-2xl font-bold text-white text-center border-b border-white/10 pb-4">
               {commandData?.name || commandType}
            </h2>
            
            {/* Placeholder for form generation logic */}
            <div className="p-4 bg-black/20 border border-white/5 rounded-lg text-gray-400 text-sm text-center italic">
               {/* Actual form generation should go here based on commandData */}
               추가 설정이 필요없는 명령입니다.
            </div>

            <button 
               type="button" 
               onClick={handleSubmit} 
               className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98]"
            >
              명령 등록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">로딩 중...</div>}>
      <ProcessingContent />
    </Suspense>
  );
}

