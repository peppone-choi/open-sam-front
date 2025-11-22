'use client';

import { useState, useEffect } from 'react';

const SYSTEM_KEYS = ['BEAM', 'GUN', 'SHIELD', 'ENGINE', 'WARP', 'SENSOR'] as const;
const SYSTEM_LABELS: Record<SystemKey, string> = {
  BEAM: '빔 무장',
  GUN: '포격 시스템',
  SHIELD: '방어막',
  ENGINE: '추진 기관',
  WARP: '워프 드라이브',
  SENSOR: '센서 어레이',
};
type SystemKey = typeof SYSTEM_KEYS[number];

export default function SteeringPanel() {
  // 총 에너지 100%를 기본 분배로 둔다.
  const [distribution, setDistribution] = useState<Record<SystemKey, number>>({
    BEAM: 20,
    GUN: 20,
    SHIELD: 20,
    ENGINE: 20,
    WARP: 0,
    SENSOR: 20,
  });

  const handleChange = (key: SystemKey, newVal: number) => {
    // 프로토타입 단계이므로 100%를 넘어도 바로 값만 반영한다.
    setDistribution(prev => ({ ...prev, [key]: newVal }));
  };

  // 총합 계산
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const isOverload = total > 100;

  return (
    <div className="bg-[#101520]/90 border border-[#1E90FF] p-4 w-48 rounded text-xs font-mono shadow-2xl backdrop-blur">
      <div className="flex justify-between mb-2 border-b border-[#333] pb-1">
        <span className="text-[#1E90FF]">에너지 배분</span>
        <span className={`${isOverload ? 'text-red-500 animate-pulse' : 'text-[#10B981]'}`}>
          {total}%
        </span>
      </div>

      <div className="space-y-3">
        {SYSTEM_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex justify-between text-[#9CA3AF]">
              <span>{SYSTEM_LABELS[key]}</span>
              <span>{distribution[key]}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={distribution[key]}
              onChange={(e) => handleChange(key, parseInt(e.target.value))}
              className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#1E90FF]"
            />
            {/* Visual Bar */}
            <div className="w-full h-1 bg-[#333] rounded overflow-hidden mt-0.5">
              <div 
                className={`h-full ${distribution[key] > 80 ? 'bg-red-500' : 'bg-[#1E90FF]'}`} 
                style={{ width: `${distribution[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
