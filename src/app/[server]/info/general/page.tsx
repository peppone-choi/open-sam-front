'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import GeneralBasicCard from '@/components/cards/GeneralBasicCard';
import { cn } from '@/lib/utils';

function GeneralInfoContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const generalID = searchParams?.get('generalID') ? Number(searchParams.get('generalID')) : undefined;

  const [loading, setLoading] = useState(true);
  const [generalData, setGeneralData] = useState<any>(null);

  useEffect(() => {
    loadGeneralData();
  }, [serverID, generalID]);

  async function loadGeneralData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetGeneralInfo({ generalID, serverID });
      if (result.result) {
        setGeneralData(result.general);
      }
    } catch (err) {
      console.error(err);
      alert('장수 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="장수 정보" reloadable onReload={loadGeneralData} />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : generalData ? (
        <div className="max-w-4xl mx-auto">
           <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg p-4">
              <GeneralBasicCard general={generalData} />
           </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-gray-500">
           장수 정보를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}

export default function GeneralInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <GeneralInfoContent />
    </Suspense>
  );
}
