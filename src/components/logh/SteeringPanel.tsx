'use client';

import { useState } from 'react';

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

const DEFAULT_DISTRIBUTION: Record<SystemKey, number> = {
  BEAM: 20,
  GUN: 20,
  SHIELD: 20,
  ENGINE: 20,
  WARP: 0,
  SENSOR: 20,
};

export default function SteeringPanel() {
  const [distribution, setDistribution] = useState<Record<SystemKey, number>>(DEFAULT_DISTRIBUTION);

  const handleChange = (key: SystemKey, newVal: number) => {
    setDistribution((prev) => {
      // 1. 새로운 값 설정
      const newDistribution = { ...prev, [key]: newVal };
      
      // 2. 총합 계산
      const total = Object.values(newDistribution).reduce((a, b) => a + b, 0);
      
      // 3. 100% 이하면 그대로 반환
      if (total <= 100) {
        return newDistribution;
      }
      
      // 4. 100% 초과 시: 다른 슬라이더들을 비례적으로 감소
      const excess = total - 100;
      
      // 현재 조정한 키를 제외한 나머지 키들의 합계
      const otherKeys = SYSTEM_KEYS.filter((k) => k !== key);
      const otherTotal = otherKeys.reduce((sum, k) => sum + prev[k], 0);
      
      // 다른 키들의 합이 0이면 현재 키를 100으로 제한
      if (otherTotal === 0) {
        return { ...newDistribution, [key]: 100 };
      }
      
      // 각 키의 비율에 따라 초과분을 차감 (개선된 알고리즘)
      const adjustedDistribution = { ...newDistribution };
      let distributedExcess = 0;
      
      // 첫 번째 패스: 비율에 따라 차감 계산
      const reductions: Record<SystemKey, number> = {} as Record<SystemKey, number>;
      otherKeys.forEach((k) => {
        const reduction = (prev[k] / otherTotal) * excess;
        reductions[k] = reduction;
        distributedExcess += reduction;
      });
      
      // 두 번째 패스: 반올림 오차 조정
      const roundingError = excess - distributedExcess;
      let errorAdjusted = false;
      
      otherKeys.forEach((k) => {
        const reducedValue = prev[k] - reductions[k];
        
        if (!errorAdjusted && roundingError !== 0) {
          // 첫 번째 0이 아닌 키에 반올림 오차 적용
          if (reducedValue > 0) {
            adjustedDistribution[k] = Math.max(0, Math.round(reducedValue - roundingError));
            errorAdjusted = true;
          } else {
            adjustedDistribution[k] = 0;
          }
        } else {
          adjustedDistribution[k] = Math.max(0, Math.round(reducedValue));
        }
      });
      
      // 최종 검증: 합계가 정확히 100인지 확인
      const finalTotal = Object.values(adjustedDistribution).reduce((a, b) => a + b, 0);
      if (finalTotal !== 100) {
        // 미세 조정: 가장 큰 값을 가진 키에서 차이만큼 조정
        const diff = finalTotal - 100;
        const maxKey = otherKeys.reduce((a, b) => 
          adjustedDistribution[a] > adjustedDistribution[b] ? a : b
        );
        adjustedDistribution[maxKey] = Math.max(0, adjustedDistribution[maxKey] - diff);
      }
      
      return adjustedDistribution;
    });
  };

  const handleReset = () => {
    setDistribution(DEFAULT_DISTRIBUTION);
  };

  // 총합 계산
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const isOverload = total > 100;
  const isOptimal = total === 100;
  const isUnderUtilized = total < 100;

  return (
    <div className="bg-[#101520]/90 border border-[#1E90FF] p-4 w-48 rounded text-xs font-mono shadow-2xl backdrop-blur">
      <div className="flex justify-between items-center mb-2 border-b border-[#333] pb-1">
        <span className="text-[#1E90FF] font-bold">에너지 배분</span>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm ${
            isOptimal ? 'text-[#10B981]' : 
            isOverload ? 'text-red-500 animate-pulse' : 
            'text-[#FFA500]'
          }`}>
            {total}/100%
          </span>
        </div>
      </div>
      
      {/* 상태 인디케이터 */}
      <div className="mb-2 text-[10px] flex items-center justify-between">
        <span className={`italic ${
          isOptimal ? 'text-[#10B981]' : 
          isOverload ? 'text-red-500' : 
          'text-[#9CA3AF]'
        }`}>
          {isOptimal && '✓ 최적 배분'}
          {isOverload && '⚠ 초과 - 자동 재분배됨'}
          {isUnderUtilized && `• ${100 - total}% 여유`}
        </span>
        <button
          onClick={handleReset}
          className="text-[#1E90FF] hover:text-[#4AA8FF] transition-colors text-[10px]"
          title="기본값으로 재설정"
        >
          초기화
        </button>
      </div>
      
      {/* 전체 에너지 사용률 바 */}
      <div className="mb-3">
        <div className="w-full h-2 bg-[#333] rounded overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              total === 100 ? 'bg-[#10B981]' : 
              total > 100 ? 'bg-red-500 animate-pulse' : 
              'bg-[#FFA500]'
            }`}
            style={{ width: `${Math.min(total, 100)}%` }}
          />
        </div>
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
