'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import GeneralBasicCard from '@/components/cards/GeneralBasicCard';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

export default function MyGenInfoPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [generalData, setGeneralData] = useState<any>(null);
  const [nationData, setNationData] = useState<any>(null);

  useEffect(() => {
    loadGeneralData();
  }, [serverID]);

  async function loadGeneralData() {
    try {
      setLoading(true);
      
      const [genResult, frontInfoResult] = await Promise.all([
        SammoAPI.GetMyGenInfo().catch(() => null),
        SammoAPI.GeneralGetFrontInfo({
          serverID: serverID || '',
          lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          lastGeneralRecordID: 0,
          lastGlobalHistoryID: 0,
        }).catch(() => null),
      ]);

      if (genResult?.result) {
        setGeneralData(genResult.general);
      } else if (frontInfoResult?.result && frontInfoResult.general) {
        setGeneralData(frontInfoResult.general);
      }

      if (frontInfoResult?.result && frontInfoResult.nation) {
        setNationData(frontInfoResult.nation);
      }
    } catch (err) {
      console.error(err);
      showToast('장수 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="내 장수 정보" reloadable onReload={loadGeneralData} />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : generalData && nationData ? (
        <div className="max-w-4xl mx-auto">
           <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg p-4">
              <GeneralBasicCard
                general={generalData}
                nation={nationData}
                troopInfo={generalData.troopInfo}
                turnTerm={0}
              />
           </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-gray-500">
          데이터를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}
