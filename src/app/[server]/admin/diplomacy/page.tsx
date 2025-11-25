'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

interface AdminDiplomacyLetter {
  no: number | string;
  srcNationId: number;
  destNationId: number;
  brief: string;
  status: string;
  date: string;
}

export default function AdminDiplomacyPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [diplomacyList, setDiplomacyList] = useState<AdminDiplomacyLetter[]>([]);

  const loadDiplomacyList = useCallback(async () => {
    if (!serverID) return;

    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetDiplomacy({ session_id: serverID });
      if (result.result && Array.isArray(result.diplomacyList)) {
        setDiplomacyList(result.diplomacyList);
      } else {
        setDiplomacyList([]);
      }
    } catch (error) {
      console.error('[AdminDiplomacy] load error', error);
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  useEffect(() => {
    void loadDiplomacyList();
  }, [loadDiplomacyList]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="외 교 정 보" reloadable onReload={loadDiplomacyList} />
      
      <div className="max-w-6xl mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
            <div className="divide-y divide-white/5">
              {diplomacyList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                   <div className="text-4xl mb-2">🤝</div>
                   <p>표시할 외교 서신이 없습니다.</p>
                </div>
              ) : (
                diplomacyList.map((diplomacy) => (
                  <div key={diplomacy.no} className="p-4 hover:bg-white/5 transition-colors flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">#{diplomacy.no}</span>
                        <span className={cn(
                          "text-sm font-bold px-2 py-0.5 rounded",
                          diplomacy.status === '수락' ? "bg-green-900/50 text-green-400" :
                          diplomacy.status === '거절' ? "bg-red-900/50 text-red-400" :
                          "bg-blue-900/50 text-blue-400"
                        )}>
                          {diplomacy.status}
                        </span>
                        <span className="text-gray-300 text-sm">
                          {diplomacy.srcNationId} → {diplomacy.destNationId}
                        </span>
                      </div>
                      <div className="text-gray-300 font-medium pl-1">
                        {diplomacy.brief}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap flex items-center">
                      {new Date(diplomacy.date).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
