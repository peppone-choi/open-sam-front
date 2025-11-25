'use client';

import React, { useState, useEffect } from 'react';
import { SammoAPI } from '@/lib/api/sammo';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatOfficerLevelText } from '@/utils/formatOfficerLevelText';

function getCrewTypeName(crewtype: number): string {
  const crewTypes: Record<number, string> = {
    0: '없음',
    1: '창병',
    2: '극병',
    3: '노병',
    4: '기병',
    5: '충차',
    6: '투석',
    7: '정예병',
  };
  return crewTypes[crewtype] || '없음';
}

interface ChiefPersonnelPanelProps {
  serverID: string;
  chiefData: any;
  onUpdate: () => void;
}

export default function ChiefPersonnelPanel({ serverID, chiefData, onUpdate }: ChiefPersonnelPanelProps) {
  const router = useRouter();
  const [generals, setGenerals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGenerals();
  }, [serverID]);

  async function loadGenerals() {
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetGenerals({ serverID });
      if (result.result) {
        setGenerals(result.generals ?? result.list ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCommand = (command: string, generalID?: number) => {
    let url = `/${serverID}/processing/${command}?is_chief=true`;
    if (generalID) {
      url += `&targetGeneralID=${generalID}`;
    }
    router.push(url);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">인사 관리</h3>
      
      <div className="flex flex-wrap gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
        <button 
          onClick={() => handleCommand('발령')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded transition-colors shadow-lg shadow-blue-900/20"
        >
          일괄 발령
        </button>
        <button 
          onClick={() => handleCommand('포상')}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded transition-colors shadow-lg shadow-yellow-900/20"
        >
          일괄 포상
        </button>
        <button 
          onClick={() => handleCommand('몰수')}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded transition-colors shadow-lg shadow-red-900/20"
        >
          일괄 몰수
        </button>
      </div>

      <div className="bg-gray-900/50 border border-white/5 rounded-lg overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/40 text-gray-400 text-xs uppercase font-bold border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">이름</th>
                  <th className="px-4 py-3 whitespace-nowrap">직위</th>
                  <th className="px-4 py-3 whitespace-nowrap">도시</th>
                  <th className="px-4 py-3 whitespace-nowrap">병과</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">병력</th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {generals.map((gen) => (
                   <tr key={gen.no} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{gen.name}</td>
                    <td className={cn("px-4 py-3 font-medium", (gen.officerLevelText ?? formatOfficerLevelText(gen.officer_level ?? gen.officerLevel ?? 0)) !== '일반' ? "text-yellow-500" : "text-gray-400")}>
                      {gen.officerLevelText ?? formatOfficerLevelText(gen.officer_level ?? gen.officerLevel ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {(gen.cityName || gen.city)
                        ? `${gen.cityName || `도시 ${gen.city}`}${typeof gen.cityLevel === 'number' && gen.cityLevel > 0 ? ` (+ Lv.${gen.cityLevel})` : ''}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{getCrewTypeName(gen.crewtype || 0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">{gen.crew?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => handleCommand('발령', gen.no)}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded border border-white/10 transition-colors"
                      >
                        발령
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

