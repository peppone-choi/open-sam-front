'use client';

import React, { useState, useEffect } from 'react';
import { SammoAPI } from '@/lib/api/sammo';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ChiefDiplomacyPanelProps {
  serverID: string;
  chiefData: any;
  onUpdate: () => void;
}

export default function ChiefDiplomacyPanel({ serverID, chiefData, onUpdate }: ChiefDiplomacyPanelProps) {
  const router = useRouter();
  const [notice, setNotice] = useState('');
  const [scoutMsg, setScoutMsg] = useState('');

  useEffect(() => {
    if (chiefData?.nation) {
      setNotice(chiefData.nation.notice || '');
      setScoutMsg(chiefData.nation.scoutMsg || '');
    }
  }, [chiefData]);

  const handleSetNotice = async () => {
    try {
      const result = await SammoAPI.NationSetNotice(notice);
      if (result.result) {
        alert('국가 공지가 변경되었습니다.');
        onUpdate();
      } else {
        alert(result.reason || '공지 변경 실패');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleSetScoutMsg = async () => {
    try {
      const result = await SammoAPI.NationSetScoutMsg(scoutMsg);
      if (result.result) {
        alert('임관 권유 메시지가 변경되었습니다.');
        onUpdate();
      } else {
        alert(result.reason || '메시지 변경 실패');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleCommand = (command: string) => {
    router.push(`/${serverID}/processing/${command}?is_chief=true`);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">외교 및 전략</h3>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">국가 공지</label>
          <div className="flex flex-col gap-2">
            <textarea 
              value={notice} 
              onChange={(e) => setNotice(e.target.value)}
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 transition-colors resize-y"
              placeholder="국가 공지사항을 입력하세요..."
            />
            <div className="flex justify-end">
              <button 
                onClick={handleSetNotice}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-blue-900/20"
              >
                저장
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">임관 권유 메시지</label>
          <div className="flex flex-col gap-2">
            <textarea 
              value={scoutMsg} 
              onChange={(e) => setScoutMsg(e.target.value)}
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 transition-colors resize-y"
              placeholder="재야 장수에게 보낼 임관 권유 메시지를 입력하세요..."
            />
            <div className="flex justify-end">
              <button 
                onClick={handleSetScoutMsg}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-blue-900/20"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">전략 명령</h4>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleCommand('국호변경')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded border border-white/10 transition-colors"
          >
            국호 변경
          </button>
          <button 
            onClick={() => handleCommand('국기변경')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded border border-white/10 transition-colors"
          >
            국기 변경
          </button>
          <button 
            onClick={() => handleCommand('천도')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded border border-white/10 transition-colors"
          >
            천도
          </button>
          <button 
            onClick={() => handleCommand('선전포고')}
            className="px-4 py-2 bg-red-900/40 hover:bg-red-800/50 text-red-400 border border-red-500/30 text-sm font-bold rounded transition-colors"
          >
            선전포고
          </button>
          <button 
            onClick={() => handleCommand('불가침제의')}
            className="px-4 py-2 bg-green-900/40 hover:bg-green-800/50 text-green-400 border border-green-500/30 text-sm font-bold rounded transition-colors"
          >
            불가침 제의
          </button>
        </div>
      </div>
    </div>
  );
}

