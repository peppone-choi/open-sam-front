'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

// Helper to determine text color based on background brightness
function getContrastColor(hexColor: string) {
  // Default to black if invalid
  if (!hexColor || !hexColor.startsWith('#')) return '#000000';
  
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  return (yiq >= 128) ? '#000000' : '#ffffff';
}

export default function KingdomListPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [kingdomList, setKingdomList] = useState<any[]>([]);

  useEffect(() => {
    loadKingdomList();
  }, [serverID]);

  async function loadKingdomList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetKingdomList();
      if (result.result) {
        setKingdomList(result.kingdomList);
      }
    } catch (err) {
      console.error(err);
      alert('세력 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="세 력 일 람" />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {kingdomList.map((kingdom) => {
            const textColor = getContrastColor(kingdom.color);
            
            return (
              <div 
                key={kingdom.nation} 
                className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-200"
              >
                <div
                  className="py-4 px-6 text-center font-bold text-xl shadow-sm"
                  style={{
                    backgroundColor: kingdom.color,
                    color: textColor,
                  }}
                >
                  {kingdom.name}
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400 text-sm">국력</span>
                    <span className="font-mono font-bold text-yellow-500">{kingdom.power?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400 text-sm">도시</span>
                    <span className="font-mono text-white">{kingdom.cities?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">장수</span>
                    <span className="font-mono text-white">{kingdom.generals?.length || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {kingdomList.length === 0 && (
             <div className="col-span-full text-center py-12 text-gray-500">
                활성화된 세력이 없습니다.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
