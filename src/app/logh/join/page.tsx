'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { loghApi } from '@/lib/api/logh';
import { 
  Faction, 
  Gender, 
  Origin, 
  CharacterStats, 
  ORIGIN_CONFIG, 
  STAT_LABELS, 
  STAT_DESCRIPTIONS,
  CharacterCreationParams
} from '@/types/logh';

// Faction Config
const FACTION_CONFIG = {
  empire: {
    name: '은하제국',
    nameEn: 'Galactic Empire',
    color: 'from-yellow-500 to-amber-600',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/50',
    hoverBorder: 'hover:border-yellow-400',
    emblem: '🦅',
    description: '질서와 통일을 추구하는 황금빛 제국. 강력한 군사력과 체계적인 조직력이 특징입니다.',
    motto: '"우리의 아름다운 제국을 위하여"',
  },
  alliance: {
    name: '자유혹성동맹',
    nameEn: 'Free Planets Alliance',
    color: 'from-cyan-500 to-blue-600',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/50',
    hoverBorder: 'hover:border-cyan-400',
    emblem: '🌟',
    description: '자유와 민주주의를 수호하는 연합체. 개인의 자유와 인권을 최우선으로 합니다.',
    motto: '"자유여, 영원하라!"',
  },
};

// Star Background
function StarField() {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; opacity: number }>>([]);
  
  useEffect(() => {
    setStars(
      Array.from({ length: 100 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
}

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const sessionId = searchParams.get('sessionId') || '';
  const preSelectedFaction = searchParams.get('faction') as Faction | null;
  
  const [step, setStep] = useState<number>(preSelectedFaction ? 2 : 1);
  
  // Form State
  const [faction, setFaction] = useState<Faction | null>(preSelectedFaction);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [stats, setStats] = useState<CharacterStats | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ korName: string; scenarioName: string } | null>(null);
  
  // Rolling State
  const [isRolling, setIsRolling] = useState(false);
  const [rollCount, setRollCount] = useState(3); // 재굴림 횟수 제한

  useEffect(() => {
    async function loadSessionInfo() {
      try {
        const result = await loghApi.getSessionList();
        if (result.result) {
          const session = result.sessions.find(s => s.sessionId === sessionId);
          if (session) {
            setSessionInfo({
              korName: session.korName,
              scenarioName: session.scenarioName,
            });
          }
        }
      } catch (e) {
        console.error('Failed to load session info:', e);
      }
    }
    if (sessionId) loadSessionInfo();
  }, [sessionId]);
  
  const handleFactionSelect = (f: Faction) => {
    setFaction(f);
    setOrigin(null); // 진영 변경 시 출신 초기화
    setStep(2);
  };

  const handleOriginSelect = (o: Origin) => {
    setOrigin(o);
    setStep(3);
  };

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('이름을 입력해주세요.', 'error');
      return;
    }
    setStep(4);
    if (!stats) rollStats(); // 처음 진입 시 자동 굴림
  };

  const rollStats = async () => {
    if (!origin || !faction) return;
    setIsRolling(true);
    
    // 주사위 굴리는 연출
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // 기본 주사위: 30 ~ 90 (정규분포 느낌으로 중앙값 60 주변이 많이 나오도록)
    const roll = () => Math.floor(Math.random() * 30) + Math.floor(Math.random() * 30) + 30;
    
    const baseStats: CharacterStats = {
      leadership: roll(),
      politics: roll(),
      operations: roll(),
      intelligence: roll(),
      command: roll(),
      maneuver: roll(),
      offense: roll(),
      defense: roll(),
    };

    // 출신 보너스 적용
    const originData = ORIGIN_CONFIG[faction].find(o => o.id === origin);
    if (originData?.bonus) {
      Object.entries(originData.bonus).forEach(([key, value]) => {
        if (key in baseStats) {
          baseStats[key as keyof CharacterStats] += value;
          // 최대치 100 보정 (단, 보너스로 100 넘는건 허용? 일단 100으로 제한)
          if (baseStats[key as keyof CharacterStats] > 100) baseStats[key as keyof CharacterStats] = 100;
        }
      });
    }

    setStats(baseStats);
    setIsRolling(false);
  };

  const handleReRoll = () => {
    if (rollCount > 0) {
      setRollCount(prev => prev - 1);
      rollStats();
    } else {
      showToast('재굴림 횟수를 모두 소진했습니다.', 'error');
    }
  };

  const handleFinalSubmit = async () => {
    if (!faction || !origin || !name || !stats) return;
    
    setIsSubmitting(true);
    
    try {
      const params: CharacterCreationParams = {
        sessionId,
        name: name.trim(),
        gender,
        faction,
        origin,
        stats,
        avatarId: 0, // 기본값
      };

      const result = await loghApi.createCharacter(params);
      
      if (result.success) {
        showToast(`${name} 캐릭터가 생성되었습니다!`, 'success');
        router.push(`/logh/game?sessionId=${sessionId}`);
      } else {
        showToast(result.message || '캐릭터 생성에 실패했습니다.', 'error');
      }
    } catch (error: any) {
      showToast(error.message || '캐릭터 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const factionConfig = faction ? FACTION_CONFIG[faction] : null;
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-x-hidden pb-20">
      <StarField />
      
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-black/20 sticky top-0 z-50">
        <Link href={`/logh/entrance`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
          </svg>
          <span>로비로 돌아가기</span>
        </Link>
        <div className="text-sm text-gray-500">
          {sessionInfo && <span>{sessionInfo.korName} • {sessionInfo.scenarioName}</span>}
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">캐릭터 생성</h1>
          <p className="text-gray-400">은하계의 역사에 당신의 이름을 새기세요</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex justify-center gap-4 mb-12">
          {['진영', '출신', '기본 정보', '능력치'].map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            
            return (
              <div key={label} className="flex items-center">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  isActive ? "bg-white/10 text-white border border-white/20" : isCompleted ? "text-green-400" : "text-gray-600"
                )}>
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                    isActive ? "bg-white text-black" : isCompleted ? "bg-green-500 text-black" : "bg-gray-700"
                  )}>
                    {isCompleted ? '✓' : stepNum}
                  </span>
                  {label}
                </div>
                {stepNum < 4 && <div className="w-8 h-px bg-white/10 mx-2" />}
              </div>
            );
          })}
        </div>
        
        {/* Step 1: Faction Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {(['empire', 'alliance'] as const).map((f) => {
              const config = FACTION_CONFIG[f];
              return (
                <button
                  key={f}
                  onClick={() => handleFactionSelect(f)}
                  className={cn(
                    "relative p-8 rounded-2xl border-2 transition-all duration-300 text-left group",
                    "hover:scale-[1.02] hover:shadow-2xl",
                    config.borderColor,
                    config.bgColor,
                    config.hoverBorder
                  )}
                >
                  <div className="text-6xl mb-4">{config.emblem}</div>
                  <h3 className={cn("text-3xl font-bold mb-1", config.textColor)}>{config.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 font-mono">{config.nameEn}</p>
                  <p className="text-gray-400 leading-relaxed mb-4">{config.description}</p>
                  <p className={cn("text-sm italic", config.textColor)}>{config.motto}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Origin Selection */}
        {step === 2 && faction && factionConfig && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6 text-center">
              <span className={factionConfig.textColor}>{factionConfig.name}</span>에서의 당신의 출신은?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ORIGIN_CONFIG[faction].map((o) => (
                <button
                  key={o.id}
                  onClick={() => handleOriginSelect(o.id as Origin)}
                  className={cn(
                    "p-6 rounded-xl border text-left transition-all group",
                    "border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn("text-xl font-bold group-hover:text-white", factionConfig.textColor)}>
                      {o.name}
                    </span>
                    {o.bonus && (
                      <div className="text-xs bg-black/30 px-2 py-1 rounded text-green-400 border border-green-500/20">
                        {Object.entries(o.bonus).map(([k, v]) => `${STAT_LABELS[k as keyof CharacterStats]}+${v}`).join(', ')}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300">{o.desc}</p>
                </button>
              ))}
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white transition-colors text-sm">
                ← 진영 다시 선택하기
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Basic Info */}
        {step === 3 && faction && factionConfig && origin && (
          <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
              <div className="text-4xl">{factionConfig.emblem}</div>
              <div>
                <div className={cn("font-bold", factionConfig.textColor)}>{factionConfig.name}</div>
                <div className="text-sm text-gray-400">
                  {ORIGIN_CONFIG[faction].find(o => o.id === origin)?.name} 출신
                </div>
              </div>
            </div>

            <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-white/30 transition-all outline-none text-white"
                  maxLength={20}
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500">2자 이상 20자 이하</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">성별</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={cn(
                      "p-3 rounded-xl border transition-all text-center",
                      gender === 'male' ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 text-gray-500 hover:bg-white/5"
                    )}
                  >
                    남성
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={cn(
                      "p-3 rounded-xl border transition-all text-center",
                      gender === 'female' ? "bg-pink-500/20 border-pink-500 text-pink-400" : "border-white/10 text-gray-500 hover:bg-white/5"
                    )}
                  >
                    여성
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400"
                >
                  이전
                </button>
                <button
                  type="submit"
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-black transition-all",
                    faction === 'empire' ? "bg-yellow-500 hover:bg-yellow-400" : "bg-cyan-500 hover:bg-cyan-400"
                  )}
                >
                  다음: 능력치 생성
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Stats Roll */}
        {step === 4 && faction && factionConfig && stats && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold">능력치 생성</h2>
              <div className="text-sm text-gray-400">
                남은 재굴림 횟수: <span className="text-white font-bold">{rollCount}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Stats Grid */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {(Object.entries(stats) as [keyof CharacterStats, number][]).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                      <div className="group relative cursor-help">
                        <span className="text-gray-400">{STAT_LABELS[key]}</span>
                        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black border border-white/20 rounded text-xs text-gray-300 hidden group-hover:block z-10">
                          {STAT_DESCRIPTIONS[key]}
                        </div>
                      </div>
                      <span className={cn(
                        "text-xl font-mono font-bold",
                        value >= 90 ? "text-yellow-400" : value >= 80 ? "text-green-400" : "text-white"
                      )}>
                        {isRolling ? '??' : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info & Actions */}
              <div className="flex flex-col justify-between">
                <div className="bg-black/30 rounded-xl p-6 border border-white/10 mb-6">
                  <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                    <span className="text-2xl">{gender === 'male' ? '👨‍✈️' : '👩‍✈️'}</span>
                    {name} <span className="text-xs text-gray-500 font-normal">({gender === 'male' ? '남' : '여'})</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">소속</span>
                      <span className={factionConfig.textColor}>{factionConfig.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">출신</span>
                      <span className="text-white">{ORIGIN_CONFIG[faction].find(o => o.id === origin)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">계급</span>
                      <span className="text-white">소위 (초기값)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleReRoll}
                    disabled={rollCount <= 0 || isRolling}
                    className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRolling ? '굴리는 중...' : '🎲 능력치 재굴림'}
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(3)}
                      className="w-1/3 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleFinalSubmit}
                      disabled={isRolling || isSubmitting}
                      className={cn(
                        "w-2/3 py-3 rounded-xl font-bold text-black transition-all shadow-lg",
                        faction === 'empire' 
                          ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400" 
                          : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                      )}
                    >
                      {isSubmitting ? '생성 중...' : '✅ 캐릭터 생성 완료'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LoGHJoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
