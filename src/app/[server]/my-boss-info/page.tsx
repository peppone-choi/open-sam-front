'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import GeneralBasicCard from '@/components/cards/GeneralBasicCard';
import { cn } from '@/lib/utils';

export default function MyBossInfoPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [bossData, setBossData] = useState<any>(null);
  const [nationData, setNationData] = useState<any>(null);

  useEffect(() => {
    loadBossData();
  }, [serverID]);

  async function loadBossData() {
    try {
      setLoading(true);
      
      const [bossResult, frontInfoResult] = await Promise.all([
        SammoAPI.GetMyBossInfo().catch(() => null),
        SammoAPI.GeneralGetFrontInfo({
          serverID: serverID || '',
          lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          lastGeneralRecordID: 0,
          lastGlobalHistoryID: 0,
        }).catch(() => null),
      ]);

      if (bossResult?.result) {
        setBossData(bossResult.bossInfo);
      }

      if (frontInfoResult?.result && frontInfoResult.nation) {
        setNationData(frontInfoResult.nation);
      }
    } catch (err) {
      console.error(err);
      alert('상관 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="내 상관 정보" reloadable onReload={loadBossData} />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : bossData && nationData ? (
        <div className="max-w-4xl mx-auto">
           <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg p-4">
              <GeneralBasicCard
                general={bossData}
                nation={nationData}
                troopInfo={bossData.troopInfo}
                turnTerm={0}
              />
           </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-gray-500">
          상관 정보를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}
