'use client';

import React, { useState, useEffect } from 'react';
import { SammoAPI } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';

interface ChiefDomesticPanelProps {
  serverID: string;
  chiefData: any;
  onUpdate: () => void;
}

export default function ChiefDomesticPanel({ serverID, chiefData, onUpdate }: ChiefDomesticPanelProps) {
  const [rate, setRate] = useState<number>(0);
  const [bill, setBill] = useState<number>(0);
  const [secretLimit, setSecretLimit] = useState<number>(0);
  const [blockWar, setBlockWar] = useState<boolean>(false);
  const [blockScout, setBlockScout] = useState<boolean>(false);

  useEffect(() => {
    if (chiefData?.nation) {
      setRate(chiefData.nation.rate ?? 0);
      setBill(chiefData.nation.bill ?? 0);
      setSecretLimit(chiefData.nation.secretLimit ?? 0);
      setBlockWar(!!chiefData.nation.blockWar);
      setBlockScout(!!chiefData.nation.blockScout);
    }
  }, [chiefData]);

  const handleSetRate = async () => {
    try {
      const result = await SammoAPI.NationSetRate(rate);
      if (result.result) {
        alert('세율이 변경되었습니다.');
        onUpdate();
      } else {
        alert(result.reason || '세율 변경 실패');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleSetBill = async () => {
    try {
      const result = await SammoAPI.NationSetBill(bill);
      if (result.result) {
        alert('징병비가 변경되었습니다.');
        onUpdate();
      } else {
        alert(result.reason || '징병비 변경 실패');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleSetSecretLimit = async () => {
    try {
      const result = await SammoAPI.NationSetSecretLimit(secretLimit);
      if (result.result) {
        alert('기밀 권한이 변경되었습니다.');
        onUpdate();
      } else {
        alert(result.reason || '기밀 권한 변경 실패');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleSetBlockWar = async (value: boolean) => {
    try {
      const result = await SammoAPI.NationSetBlockWar(value);
      if (result.result) {
        setBlockWar(value);
        onUpdate();
      } else {
        alert(result.reason || '설정 실패');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleSetBlockScout = async (value: boolean) => {
    try {
      const result = await SammoAPI.NationSetBlockScout(value);
      if (result.result) {
        setBlockScout(value);
        onUpdate();
      } else {
        alert(result.reason || '설정 실패');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">내정 설정</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 세율 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">세율 설정 (%)</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={rate} 
              onChange={(e) => setRate(Number(e.target.value))}
              min={0} max={100}
              className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-right"
            />
            <button 
              onClick={handleSetRate}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-blue-900/20"
            >
              변경
            </button>
          </div>
        </div>

        {/* 징병비 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">징병비 설정</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={bill} 
              onChange={(e) => setBill(Number(e.target.value))}
              min={0}
              className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-right"
            />
            <button 
              onClick={handleSetBill}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-blue-900/20"
            >
              변경
            </button>
          </div>
        </div>

        {/* 기밀 권한 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">기밀 권한 (관직 등급)</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={secretLimit} 
              onChange={(e) => setSecretLimit(Number(e.target.value))}
              min={0} max={99}
              className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-right"
            />
            <button 
              onClick={handleSetSecretLimit}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-blue-900/20"
            >
              변경
            </button>
          </div>
        </div>

        {/* 전쟁 금지 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">전쟁 금지</label>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button 
              className={cn(
                "flex-1 py-2 text-xs font-bold transition-colors",
                blockWar ? "bg-red-600 text-white" : "bg-black/40 text-gray-500 hover:bg-white/5"
              )}
              onClick={() => handleSetBlockWar(true)}
            >
              금지
            </button>
            <button 
              className={cn(
                "flex-1 py-2 text-xs font-bold transition-colors border-l border-white/10",
                !blockWar ? "bg-green-600 text-white" : "bg-black/40 text-gray-500 hover:bg-white/5"
              )}
              onClick={() => handleSetBlockWar(false)}
            >
              허용
            </button>
          </div>
        </div>

        {/* 임관 금지 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">임관 금지</label>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button 
              className={cn(
                "flex-1 py-2 text-xs font-bold transition-colors",
                blockScout ? "bg-red-600 text-white" : "bg-black/40 text-gray-500 hover:bg-white/5"
              )}
              onClick={() => handleSetBlockScout(true)}
            >
              금지
            </button>
            <button 
              className={cn(
                "flex-1 py-2 text-xs font-bold transition-colors border-l border-white/10",
                !blockScout ? "bg-green-600 text-white" : "bg-black/40 text-gray-500 hover:bg-white/5"
              )}
              onClick={() => handleSetBlockScout(false)}
            >
              허용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

