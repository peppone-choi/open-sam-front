'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

interface BettingListResponse {
  result: boolean;
  bettingList?: any[];
}

export default function BettingInfoPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [bettingList, setBettingList] = useState<any[]>([]);

  useEffect(() => {
    loadBettingList();
  }, [serverID]);

  async function loadBettingList() {
    try {
      setLoading(true);
      const result = (await SammoAPI['request']('/api/info/betting', {
          method: 'POST',
          body: JSON.stringify({ session_id: serverID })
      })) as BettingListResponse;

      if (result.result) {
        setBettingList(result.bettingList || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="베팅 정보" reloadable onReload={loadBettingList} />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {bettingList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bettingList.map((betting) => (
                <div 
                  key={betting.id} 
                  className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg hover:border-yellow-500/30 transition-colors"
                >
                  <div className="text-lg font-bold text-yellow-400 mb-2">{betting.title}</div>
                  <div className="text-gray-300 text-sm leading-relaxed">
                    {betting.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
               <div className="text-4xl mb-4">💰</div>
               <p>현재 진행 중인 베팅이 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
