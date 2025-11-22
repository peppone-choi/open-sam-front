'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

export default function EmperiorPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [emperiorList, setEmperiorList] = useState<any[]>([]);
  const [currentNation, setCurrentNation] = useState<any>(null);

  useEffect(() => {
    loadEmperiorList();
  }, [serverID]);

  async function loadEmperiorList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetEmperiorList();
      if (result.result) {
        setEmperiorList(result.emperiorList || []);
        setCurrentNation(result.currentNation || null);
      }
    } catch (err) {
      console.error(err);
      alert('역대 왕조 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="역 대 왕 조" />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Current Era Banner */}
          {currentNation && (
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg backdrop-blur-sm">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-white mb-1">
                  현재 시대
                </h2>
                <p className="text-blue-200 font-mono">
                  {currentNation.year}년 {currentNation.month}월
                </p>
              </div>
              <Link 
                href={`/${serverID}/history`} 
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow transition-colors"
              >
                역사 보기
              </Link>
            </div>
          )}

          {/* Dynasty Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {emperiorList.map((emperior) => (
              <div 
                key={emperior.no} 
                className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg hover:border-yellow-500/30 transition-all duration-200 flex flex-col gap-4 group"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-yellow-500 group-hover:text-yellow-400 transition-colors">
                    {emperior.phase}
                  </h2>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                    ID: {emperior.no}
                  </span>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Link 
                    href={`/${serverID}/archive/emperior/${emperior.no}`} 
                    className="flex-1 text-center py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                  >
                    자세히
                  </Link>
                  {emperior.server_id && (
                    <Link 
                      href={`/${serverID}/history?serverID=${emperior.server_id}`} 
                      className="flex-1 text-center py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      역사 보기
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {emperiorList.length === 0 && !currentNation && (
             <div className="text-center py-12 text-gray-500">
                기록된 역사가 없습니다.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
