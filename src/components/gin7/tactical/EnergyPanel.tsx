'use client';

import { useCallback, useMemo } from 'react';
import { useGin7TacticalStore } from '@/stores/gin7TacticalStore';
import type { EnergyDistribution } from '@/types/gin7-tactical';

// ============================================================
// Energy Field Config
// ============================================================

interface EnergyField {
  key: keyof EnergyDistribution;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

const ENERGY_FIELDS: EnergyField[] = [
  {
    key: 'beam',
    label: '빔 무기',
    shortLabel: 'BEM',
    description: '레이저/빔 출력',
    icon: '⚡',
    color: '#ef4444',
    gradient: 'from-red-600 to-red-400',
  },
  {
    key: 'gun',
    label: '실탄 무기',
    shortLabel: 'GUN',
    description: '포격/건 출력',
    icon: '💥',
    color: '#f97316',
    gradient: 'from-orange-600 to-orange-400',
  },
  {
    key: 'shield',
    label: '방어막',
    shortLabel: 'SHD',
    description: '쉴드 재생률',
    icon: '🛡️',
    color: '#06b6d4',
    gradient: 'from-cyan-600 to-cyan-400',
  },
  {
    key: 'engine',
    label: '추진 기관',
    shortLabel: 'ENG',
    description: '추력/기동성',
    icon: '🚀',
    color: '#22c55e',
    gradient: 'from-green-600 to-green-400',
  },
  {
    key: 'warp',
    label: '워프 충전',
    shortLabel: 'WRP',
    description: '긴급 탈출용',
    icon: '🌀',
    color: '#8b5cf6',
    gradient: 'from-violet-600 to-violet-400',
  },
  {
    key: 'sensor',
    label: '센서',
    shortLabel: 'SNS',
    description: '탐지/조준 보정',
    icon: '📡',
    color: '#eab308',
    gradient: 'from-yellow-600 to-yellow-400',
  },
];

// ============================================================
// Energy Slider Component
// ============================================================

interface EnergySliderProps {
  field: EnergyField;
  value: number;
  total: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function EnergySlider({ field, value, total, onChange, disabled }: EnergySliderProps) {
  const remaining = 100 - total + value;
  const maxValue = Math.min(40, remaining);
  
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      if (newValue <= maxValue) {
        onChange(newValue);
      }
    },
    [onChange, maxValue]
  );
  
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{field.icon}</span>
          <span className="text-xs font-medium text-white/90">{field.shortLabel}</span>
        </div>
        <span
          className="text-xs font-mono font-bold"
          style={{ color: field.color }}
        >
          {value}%
        </span>
      </div>
      
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${field.gradient} transition-all duration-150`}
          style={{ width: `${(value / 40) * 100}%` }}
        />
        <input
          type="range"
          min={0}
          max={40}
          step={5}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
      
      <div className="mt-0.5 text-[10px] text-white/40 group-hover:text-white/60 transition-colors">
        {field.description}
      </div>
    </div>
  );
}

// ============================================================
// Preset Buttons
// ============================================================

interface EnergyPreset {
  name: string;
  shortName: string;
  distribution: EnergyDistribution;
}

const PRESETS: EnergyPreset[] = [
  {
    name: '균형',
    shortName: 'BAL',
    distribution: { beam: 15, gun: 15, shield: 20, engine: 20, warp: 0, sensor: 20 },
  },
  {
    name: '공격',
    shortName: 'ATK',
    distribution: { beam: 30, gun: 30, shield: 10, engine: 15, warp: 0, sensor: 15 },
  },
  {
    name: '방어',
    shortName: 'DEF',
    distribution: { beam: 10, gun: 10, shield: 40, engine: 20, warp: 0, sensor: 20 },
  },
  {
    name: '기동',
    shortName: 'MOV',
    distribution: { beam: 10, gun: 10, shield: 15, engine: 40, warp: 5, sensor: 20 },
  },
  {
    name: '철수',
    shortName: 'ESC',
    distribution: { beam: 0, gun: 0, shield: 30, engine: 30, warp: 40, sensor: 0 },
  },
];

// ============================================================
// Main Component
// ============================================================

export interface EnergyPanelProps {
  className?: string;
  compact?: boolean;
}

export default function EnergyPanel({ className = '', compact = false }: EnergyPanelProps) {
  const energyDistribution = useGin7TacticalStore((s) => s.energyDistribution);
  const updateEnergy = useGin7TacticalStore((s) => s.updateEnergy);
  const setEnergyDistribution = useGin7TacticalStore((s) => s.setEnergyDistribution);
  const selectedUnitIds = useGin7TacticalStore((s) => s.selectedUnitIds);
  const queueCommand = useGin7TacticalStore((s) => s.queueCommand);
  
  const totalEnergy = useMemo(
    () => Object.values(energyDistribution).reduce((a, b) => a + b, 0),
    [energyDistribution]
  );
  
  const isOverLimit = totalEnergy > 100;
  const hasSelection = selectedUnitIds.size > 0;
  
  const handlePreset = useCallback(
    (preset: EnergyPreset) => {
      setEnergyDistribution(preset.distribution);
    },
    [setEnergyDistribution]
  );
  
  const handleApply = useCallback(() => {
    if (selectedUnitIds.size > 0 && totalEnergy <= 100) {
      queueCommand({
        type: 'ENERGY_DISTRIBUTION',
        unitIds: Array.from(selectedUnitIds),
        timestamp: Date.now(),
        data: {
          distribution: energyDistribution,
        },
      });
    }
  }, [selectedUnitIds, totalEnergy, energyDistribution, queueCommand]);
  
  if (compact) {
    return (
      <div className={`bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-2 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/80">에너지</span>
          <span className={`text-xs font-mono ${isOverLimit ? 'text-red-400' : 'text-cyan-400'}`}>
            {totalEnergy}%
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {ENERGY_FIELDS.map((field) => (
            <div
              key={field.key}
              className="text-center"
              title={`${field.label}: ${energyDistribution[field.key]}%`}
            >
              <div
                className="h-8 rounded transition-all"
                style={{
                  background: `linear-gradient(to top, ${field.color} ${(energyDistribution[field.key] / 40) * 100}%, rgba(30,41,59,0.8) ${(energyDistribution[field.key] / 40) * 100}%)`,
                }}
              />
              <div className="text-[8px] text-white/60 mt-0.5">{field.shortLabel}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-sm font-bold text-white">에너지 배분</h3>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
              isOverLimit
                ? 'bg-red-500/20 text-red-400'
                : totalEnergy === 100
                ? 'bg-green-500/20 text-green-400'
                : 'bg-slate-700 text-white/80'
            }`}
          >
            {totalEnergy}% / 100%
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-300 ${
            isOverLimit
              ? 'bg-red-500'
              : totalEnergy === 100
              ? 'bg-green-500'
              : 'bg-cyan-500'
          }`}
          style={{ width: `${Math.min(100, totalEnergy)}%` }}
        />
      </div>
      
      {/* Sliders */}
      <div className="space-y-3">
        {ENERGY_FIELDS.map((field) => (
          <EnergySlider
            key={field.key}
            field={field}
            value={energyDistribution[field.key]}
            total={totalEnergy}
            onChange={(v) => updateEnergy(field.key, v)}
          />
        ))}
      </div>
      
      {/* Presets */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="text-[10px] text-white/50 mb-2">프리셋</div>
        <div className="flex gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.shortName}
              onClick={() => handlePreset(preset)}
              className="flex-1 px-2 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white/80 hover:text-white rounded transition-colors"
              title={preset.name}
            >
              {preset.shortName}
            </button>
          ))}
        </div>
      </div>
      
      {/* Apply button */}
      {hasSelection && (
        <button
          onClick={handleApply}
          disabled={isOverLimit}
          className={`mt-3 w-full py-2 text-sm font-bold rounded-lg transition-all ${
            isOverLimit
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          선택 유닛에 적용 ({selectedUnitIds.size})
        </button>
      )}
    </div>
  );
}








