'use client';
 
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { formatOfficerLevelText } from '@/utils/formatOfficerLevelText';
import { useToast } from '@/contexts/ToastContext';

export default function NationGeneralsPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generals, setGenerals] = useState<any[]>([]);

  useEffect(() => {
    loadGenerals();
  }, [serverID]);

  async function loadGenerals() {
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetGenerals({ serverID });
      if (result.result) {
        const rawGenerals = result.generals ?? result.list ?? [];
        const mappedGenerals = rawGenerals.map((gen: any) => ({
          ...gen,
          officerLevelText: gen.officerLevelText ?? formatOfficerLevelText(gen.officer_level ?? gen.officerLevel ?? 0),
        }));
        setGenerals(mappedGenerals);
      }
 
    } catch (err) {
      console.error(err);
      showToast('세력 장수 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <TopBackBar title="세력 장수" reloadable onReload={loadGenerals} />
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {generals.map((general) => (
              <div key={general.no} className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 hover:border-white/20 hover:bg-white/[0.02] transition-all group shadow-sm">
                <div className="flex items-center justify-between mb-2">
                   <div className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {general.name}
                   </div>
                    <div className="text-[10px] text-gray-500 border border-white/10 rounded px-1.5 py-0.5">
                       장수 번호 숨김
                    </div>

                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-500">소속 도시</span>
                       <span className="text-gray-300">
                         {(general.cityName || general.city)
                           ? `${general.cityName || `도시 ${general.city}`}${typeof general.cityLevel === 'number' && general.cityLevel > 0 ? ` (+ Lv.${general.cityLevel})` : ''}`
                           : '-'}
                       </span>
                    </div>

                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">직위</span>
                      <span className={cn(
                        "font-medium",
                        general.officerLevelText !== '일반' ? "text-yellow-500" : "text-gray-400"
                      )}>
                        {general.officerLevelText}
                      </span>
                   </div>
                   {/* Future expansion: Add more stats here if API provides them */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




