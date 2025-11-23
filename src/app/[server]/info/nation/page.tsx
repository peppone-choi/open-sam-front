'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import NationBasicCard from '@/components/cards/NationBasicCard';
import { cn } from '@/lib/utils';

export default function NationInfoPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [nationData, setNationData] = useState<any>(null);
  const [globalData, setGlobalData] = useState<any>(null);

  useEffect(() => {
    loadNationData();
  }, [serverID]);

  async function loadNationData() {
    try {
      setLoading(true);
      
      const frontInfoResult = await SammoAPI.GeneralGetFrontInfo({
        serverID: serverID || '',
        lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        lastGeneralRecordID: 0,
        lastGlobalHistoryID: 0,
      }).catch(() => null);

      const nationResult = await SammoAPI.NationGetNationInfo({
        serverID,
        generalID: frontInfoResult?.general?.no,
      }).catch(() => null);

      if (nationResult?.result) {
        setNationData(nationResult.nation);
      } else if (frontInfoResult?.result && frontInfoResult.nation) {
        setNationData(frontInfoResult.nation);
      }

      if (frontInfoResult?.result) {
        setGlobalData(frontInfoResult.global);
      }
    } catch (err) {
      console.error(err);
      alert('세력 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="세 력 정 보" reloadable onReload={loadNationData} />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : nationData && globalData ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
            <NationBasicCard nation={nationData} global={globalData} />
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-gray-500">
          세력 정보를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}
