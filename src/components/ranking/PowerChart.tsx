'use client';

import React, { useMemo } from 'react';

interface PowerData {
  name: string;
  value: number;
  color: string;
}

interface PowerChartProps {
  data: PowerData[];
  title?: string;
}

/**
 * SVG 기반 막대 차트 (가로형)
 * Phase 24 - 데이터 시각화 및 분석
 */
export default function PowerChart({ data, title = '국가별 종합 국력' }: PowerChartProps) {
  const sortedData = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4 shadow-lg">
      <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        {title}
      </h3>
      
      <div className="space-y-3">
        {sortedData.map((item, idx) => {
          const widthPercent = (item.value / maxValue) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400">
                <span className="font-bold" style={{ color: item.color }}>{item.name}</span>
                <span className="font-mono text-gray-300">{item.value.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${widthPercent}%`, 
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}80`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {sortedData.length === 0 && (
        <div className="py-8 text-center text-xs text-gray-500 italic">
          데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
