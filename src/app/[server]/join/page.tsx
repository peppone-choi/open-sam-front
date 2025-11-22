'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI, type JoinCitySummary, type JoinNationSummary, type JoinStatLimits } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import InfoSummaryCard from '@/components/info/InfoSummaryCard';
import HistoryTimeline from '@/components/info/HistoryTimeline';
import { buildJoinSummaryCards, buildTimelineFromSources, getTraitInfo } from '@/lib/utils/game/entryFormatter';
import { INFO_TEXT } from '@/constants/uiText';
import { cn } from '@/lib/utils';

type Nation = JoinNationSummary;
type StatLimits = JoinStatLimits;
type City = JoinCitySummary;

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;

  const [nationList, setNationList] = useState<Nation[]>([]);
  const [cityList, setCityList] = useState<City[]>([]); // 전체 도시 목록
  const [allCities, setAllCities] = useState<City[]>([]); // 전체 도시 목록 (필터링용)
  const [statLimits, setStatLimits] = useState<StatLimits>({ min: 15, max: 90, total: 275 });
  const [allowJoinNation, setAllowJoinNation] = useState(true); // 소속 국가 선택 가능 여부
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    nation: 0,
    leadership: 60,
    strength: 60,
    intel: 60,
    politics: 60,  // 정치
    charm: 60,     // 매력
    character: 'Random',
    city: 0, // 0이면 랜덤
    trait: '범인', // 선택된 트레잇
    pic: '',
    useCustomIcon: false,
  });
  
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setUploading(true);
    
    // base64로 변환
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        setIconPreview(base64); // 미리보기
        const base64Data = base64.split(',')[1]; // data:image/... 제거
        
        const result = await SammoAPI.MiscUploadImage({
          imageData: base64Data,
          session_id: serverID
        } as any);
      
        if (result.result && result.url) {
          setFormData(prev => ({ ...prev, pic: result.url || '' }));
        } else {
          alert(result.reason || '이미지 업로드에 실패했습니다.');
          setIconPreview(null);
          setFormData(prev => ({ ...prev, pic: '' }));
        }
      } catch (err) {
        console.error('이미지 업로드 에러:', err);
        alert('이미지 업로드 중 오류가 발생했습니다.');
        setIconPreview(null);
        setFormData(prev => ({ ...prev, pic: '' }));
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadNations = useCallback(async () => {
    if (!serverID) return;

    try {
      setLoading(true);
      const response = await SammoAPI.JoinGetNations(serverID);
      if (!response?.result) {
        throw new Error(response?.reason || '국가 목록을 불러오지 못했습니다.');
      }

      setNationList(response.nations ?? []);
      const allowNationSelection = response.allowJoinNation !== false;
      setAllowJoinNation(allowNationSelection);

      if (response.cities) {
        setAllCities(response.cities);
        setCityList(response.cities);
      }

      if (response.statLimits) {
        const limits = response.statLimits;
        setStatLimits(limits);
        const defaultStat = Math.floor(limits.total / 5);
        const remainder = limits.total - defaultStat * 5;
        setFormData((prev) => ({
          ...prev,
          leadership: defaultStat + remainder,
          strength: defaultStat,
          intel: defaultStat,
          politics: defaultStat,
          charm: defaultStat,
          nation: allowNationSelection ? prev.nation : 0,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  useEffect(() => {
    loadNations();
  }, [loadNations]);

  // 국가 선택 변경 시 도시 필터링
  useEffect(() => {
    if (formData.nation === 0) {
      // 재야 선택 시 모든 도시 표시
      setCityList(allCities);
    } else {
      // 선택한 국가의 도시만 표시
      const filteredCities = allCities.filter(city => city.nation === formData.nation);
      setCityList(filteredCities);
      
      // 현재 선택된 도시가 필터링된 목록에 없으면 초기화
      if (formData.city !== 0 && !filteredCities.some(city => city.id === formData.city)) {
        setFormData(prev => ({ ...prev, city: 0 }));
      }
    }
  }, [formData.nation, allCities]);

  function calculateTotalStats() {
    return formData.leadership + formData.strength + formData.intel + formData.politics + formData.charm;
  }

  const totalStats = calculateTotalStats();
  const selectedNation = useMemo(() => nationList.find((nation) => nation.nation === formData.nation), [nationList, formData.nation]);
  const joinSummaryCards = useMemo(
    () =>
      buildJoinSummaryCards({
        trait: formData.trait,
        statLimits,
        totalStats,
        allowJoinNation,
        selectedNationName: selectedNation?.name,
        hasCustomIcon: formData.useCustomIcon,
      }),
    [formData.trait, statLimits, totalStats, allowJoinNation, selectedNation?.name, formData.useCustomIcon],
  );
  const traitMetadata = useMemo(() => getTraitInfo(formData.trait), [formData.trait]);
  const entryTimelineEvents = useMemo(
    () =>
      buildTimelineFromSources([
        {
          id: 'trait',
          order: 1,
          category: 'system',
          title: `트레잇 · ${traitMetadata.name}`,
          description: traitMetadata.details,
        },
        {
          id: 'stat',
          order: 2,
          category: 'action',
          title: `능력치 합 ${totalStats}p`,
          description: `최소 ${statLimits.min} / 최대 ${statLimits.max}`,
        },
        {
          id: 'nation',
          order: 3,
          category: 'nation',
          title: selectedNation ? `${selectedNation.name} 시작` : '재야 시작',
          description: allowJoinNation ? '원하는 국가를 선택하세요.' : '현재 재야 전용 서버입니다.',
        },
        {
          id: 'icon',
          order: 4,
          category: 'system',
          title: formData.useCustomIcon ? '전용 아이콘 업로드 완료' : '기본 아이콘 사용',
          description: formData.useCustomIcon ? '검수 후 자동 반영됩니다.' : '설정 > 아이콘 관리에서 변경 가능',
        },
      ]),
    [traitMetadata, totalStats, statLimits.min, statLimits.max, selectedNation?.name, allowJoinNation, formData.useCustomIcon],
  );

  // 배경색에 따라 텍스트 색상 결정 (밝은 배경 -> 검은색, 어두운 배경 -> 흰색)
  function getTextColor(bgColor: string): string {
    if (!bgColor) return '#ffffff';
    
    // #RRGGBB 형식을 RGB로 변환
    let hex = bgColor.replace('#', '');
    if(hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];

    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 밝기 계산 (YIQ 공식)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 밝기가 128 이상이면 검은색, 아니면 흰색
    return brightness > 128 ? '#000000' : '#ffffff';
  }


  function randomizeStats(type: 'random' | 'balanced' | 'commander' | 'warrior' | 'strategist' | 'administrator' | 'scholar' | 'general_warrior' | 'tactician' | 'diplomat' | 'charismatic' = 'random') {
    const { min } = statLimits;
    const traitInfo = getTraitInfo(formData.trait);
    const max = traitInfo.max; // 트레잇에 따른 최댓값
    const totalMin = traitInfo.totalMin;
    const totalMax = traitInfo.totalMax;
    const total = totalMin + Math.floor(Math.random() * (totalMax - totalMin + 1)); // 결정된 총합
    
    // Helper: 정확히 total에 맞춤
    const adjustToTotal = (stats: number[]) => {
      let currentTotal = stats.reduce((sum, val) => sum + val, 0);
      let diff = total - currentTotal;
      
      let attempts = 0;
      while (diff !== 0 && attempts < 1000) {
        attempts++;
        const idx = Math.floor(Math.random() * 5);
        if (diff > 0 && stats[idx] < max) {
          stats[idx]++;
          diff--;
        } else if (diff < 0 && stats[idx] > min) {
          stats[idx]--;
          diff++;
        }
      }
      
      return stats;
    };
    
    if (type === 'random') {
      // 각 능력치마다 독립적으로 주사위 굴리기
      // 1. 각 능력치에 지수 분포 랜덤 값 배정 (극단적인 분포)
      const rawStats = [
        Math.pow(Math.random(), 2.0) * 100, // 낮은 값에 강한 편향
        Math.pow(Math.random(), 2.0) * 100,
        Math.pow(Math.random(), 2.0) * 100,
        Math.pow(Math.random(), 2.0) * 100,
        Math.pow(Math.random(), 2.0) * 100
      ];
      
      // 2. 총합 계산
      const rawTotal = rawStats.reduce((sum, val) => sum + val, 0);
      
      // 3. 총합 300에 맞춰 정규화
      const normalizedStats = rawStats.map(val => (val / rawTotal) * total);
      
      // 4. 정수로 변환
      let stats = normalizedStats.map(val => Math.round(val));
      
      // 5. min, max 제한 적용
      stats = stats.map(val => Math.max(min, Math.min(max, val)));
      
      // 6. 총합 조정 (min 적용 후 초과분 처리)
      let currentTotal = stats.reduce((sum, val) => sum + val, 0);
      let diff = total - currentTotal;
      
      // 차이가 있으면 높은 능력치부터 조정
      let attempts = 0;
      while (diff !== 0 && attempts < 1000) {
        attempts++;
        const idx = Math.floor(Math.random() * 5);
        if (diff > 0 && stats[idx] < max) {
          stats[idx]++;
          diff--;
        } else if (diff < 0 && stats[idx] > min) {
          stats[idx]--;
          diff++;
        }
      }
      
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    } else if (type === 'balanced') {
      // 균형형 - 모든 능력치 균등 배분 + 약간의 랜덤
      const avg = Math.floor(total / 5);
      const stats = [avg, avg, avg, avg, avg];
      let remainder = total - avg * 5;
      
      // 나머지를 랜덤하게 분배
      while (remainder > 0) {
        const idx = Math.floor(Math.random() * 5);
        if (stats[idx] < max) {
          stats[idx]++;
          remainder--;
        }
      }
      
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    } else if (type === 'commander') {
      // 지휘관형 - 통솔 60+, 매력 55+
      const stats = [min, min, min, min, min];
      let remaining = total - (min * 5);
      
      const leadershipTarget = 60 + Math.floor(Math.random() * (max - 60 + 1));
      const leadershipNeeded = Math.min(leadershipTarget - min, remaining);
      stats[0] += leadershipNeeded;
      remaining -= leadershipNeeded;
      
      const charmTarget = 55 + Math.floor(Math.random() * (max - 55 + 1));
      const charmNeeded = Math.min(charmTarget - min, remaining);
      stats[4] += charmNeeded;
      remaining -= charmNeeded;
      
      while (remaining > 0) {
        const idx = Math.floor(Math.random() * 5);
        if (stats[idx] < max) {
          stats[idx]++;
          remaining--;
        }
      }
      
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    } else if (type === 'warrior') {
      // 무력형 - 무력 반드시 높게 (70~max)
      const stats = [min, min, min, min, min];
      let remaining = total - (min * 5);
      
      // 무력에 70~max 보장
      const strengthTarget = 70 + Math.floor(Math.random() * (max - 70 + 1));
      const strengthNeeded = Math.min(strengthTarget - min, remaining);
      stats[1] += strengthNeeded;
      remaining -= strengthNeeded;
      
      // 남은 포인트 랜덤 분배
      while (remaining > 0) {
        const idx = Math.floor(Math.random() * 5);
        if (stats[idx] < max) {
          stats[idx]++;
          remaining--;
        }
      }
      
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    } else if (type === 'strategist') {
      // 지력형 - 지력 반드시 높게 (70~max)
      const stats = [min, min, min, min, min];
      let remaining = total - (min * 5);
      
      // 지력에 70~max 보장
      const intelTarget = 70 + Math.floor(Math.random() * (max - 70 + 1));
      const intelNeeded = Math.min(intelTarget - min, remaining);
      stats[2] += intelNeeded;
      remaining -= intelNeeded;
      
      // 남은 포인트 랜덤 분배
      while (remaining > 0) {
        const idx = Math.floor(Math.random() * 5);
        if (stats[idx] < max) {
          stats[idx]++;
          remaining--;
        }
      }
      
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    } else if (type === 'administrator') {
      // 정치형 - 정치 반드시 높게 (70~max)
      const stats = [min, min, min, min, min];
      let remaining = total - (min * 5);
      
      // 정치에 70~max 보장
      const politicsTarget = 70 + Math.floor(Math.random() * (max - 70 + 1));
      const politicsNeeded = Math.min(politicsTarget - min, remaining);
      stats[3] += politicsNeeded;
      remaining -= politicsNeeded;
      
      // 남은 포인트 랜덤 분배
      while (remaining > 0) {
        const idx = Math.floor(Math.random() * 5);
        if (stats[idx] < max) {
          stats[idx]++;
          remaining--;
        }
      }
      
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    } else if (type === 'scholar') {
      // 학자형 - 지력+정치 반드시 높게 (60~max)
      const stats = [min, min, min, min, min];
      let remaining = total - (min * 5);
      
      // 지력과 정치에 각각 50~70% 배분 보장
      const intelTarget = 60 + Math.floor(Math.random() * (max - 60 + 1)); // 60~max
      const intelNeeded = Math.min(intelTarget - min, remaining);
      stats[2] += intelNeeded;
      remaining -= intelNeeded;
      
      const politicsTarget = 60 + Math.floor(Math.random() * (max - 60 + 1)); // 60~max
      const politicsNeeded = Math.min(politicsTarget - min, remaining);
      stats[3] += politicsNeeded;
      remaining -= politicsNeeded;
      
      // 남은 포인트 랜덤 분배
      while (remaining > 0) {
        const idx = Math.floor(Math.random() * 5);
        if (stats[idx] < max) {
          stats[idx]++;
          remaining--;
        }
      }
      
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    } else if (type === 'general_warrior') {
      // 맹장형 - 통솔 50+, 무력 60+
      const stats = [min, min, min, min, min];
      let remaining = total - (min * 5);
      
      const leadershipTarget = 50 + Math.floor(Math.random() * (max - 50 + 1));
      const leadershipNeeded = Math.min(leadershipTarget - min, remaining);
      stats[0] += leadershipNeeded;
      remaining -= leadershipNeeded;
      
      const strengthTarget = 60 + Math.floor(Math.random() * (max - 60 + 1));
      const strengthNeeded = Math.min(strengthTarget - min, remaining);
      stats[1] += strengthNeeded;
      remaining -= strengthNeeded;
      
      while (remaining > 0) {
        const idx = Math.floor(Math.random() * 5);
        if (stats[idx] < max) {
          stats[idx]++;
          remaining--;
        }
      }
      
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    } else if (type === 'tactician') {
      // 전략가형 - 통솔 50+, 지력 60+
      const stats = [min, min, min, min, min];
      let remaining = total - (min * 5);
      
      const leadershipTarget = 50 + Math.floor(Math.random() * (max - 50 + 1));
      const leadershipNeeded = Math.min(leadershipTarget - min, remaining);
      stats[0] += leadershipNeeded;
      remaining -= leadershipNeeded;
      
      const intelTarget = 60 + Math.floor(Math.random() * (max - 60 + 1));
      const intelNeeded = Math.min(intelTarget - min, remaining);
      stats[2] += intelNeeded;
      remaining -= intelNeeded;
      
      while (remaining > 0) {
        const idx = Math.floor(Math.random() * 5);
        if (stats[idx] < max) {
          stats[idx]++;
          remaining--;
        }
      }
      
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    } else if (type === 'diplomat') {
      // 외교관형 - 정치 55+, 매력 60+
      const stats = [min, min, min, min, min];
      let remaining = total - (min * 5);
      
      const politicsTarget = 55 + Math.floor(Math.random() * (max - 55 + 1));
      const politicsNeeded = Math.min(politicsTarget - min, remaining);
      stats[3] += politicsNeeded;
      remaining -= politicsNeeded;
      
      const charmTarget = 60 + Math.floor(Math.random() * (max - 60 + 1));
      const charmNeeded = Math.min(charmTarget - min, remaining);
      stats[4] += charmNeeded;
      remaining -= charmNeeded;
      
      while (remaining > 0) {
        const idx = Math.floor(Math.random() * 5);
        if (stats[idx] < max) {
          stats[idx]++;
          remaining--;
        }
      }
      
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    } else if (type === 'charismatic') {
      // 군주형 - 통솔 55+, 매력 60+
      const rawStats = [
        Math.pow(Math.random(), 1.0) * 100, // 통솔 - 중간
        Math.pow(Math.random(), 2.0) * 100, // 무력 - 낮게
        Math.pow(Math.random(), 2.0) * 100, // 지력 - 낮게
        Math.pow(Math.random(), 2.0) * 100, // 정치 - 낮게
        Math.pow(Math.random(), 0.7) * 100  // 매력 - 높게
      ];
      const rawTotal = rawStats.reduce((sum, val) => sum + val, 0);
      let stats = rawStats.map(val => Math.max(min, Math.min(max, Math.round((val / rawTotal) * total))));
      let diff = total - stats.reduce((sum, val) => sum + val, 0);
      while (diff !== 0) {
        const idx = diff > 0 ? (Math.random() < 0.6 ? 4 : 0) : Math.floor(Math.random() * 5);
        if (diff > 0 && stats[idx] < max) { stats[idx]++; diff--; }
        else if (diff < 0 && stats[idx] > min) { stats[idx]--; diff++; }
      }
      const adjustedStats = adjustToTotal(stats);
      const [l, s, i, p, c] = adjustedStats;
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i, politics: p, charm: c }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name) {
      alert('장수명을 입력해주세요.');
      return;
    }

    if (!serverID) {
      alert('서버 정보가 없습니다.');
      return;
    }

    // 각 능력치가 범위 내인지 확인
    const stats = [formData.leadership, formData.strength, formData.intel, formData.politics, formData.charm];
    if (stats.some(stat => stat > statLimits.max)) {
      alert(`각 능력치는 ${statLimits.max} 이하여야 합니다.`);
      return;
    }

    if (stats.some(stat => stat < statLimits.min)) {
      alert(`각 능력치는 ${statLimits.min} 이상이어야 합니다.`);
      return;
    }

    // 트레잇에 따른 총합 검증
    const total = calculateTotalStats();
    const traitInfo = getTraitInfo(formData.trait);
    if (total < traitInfo.totalMin || total > traitInfo.totalMax) {
      alert(`${formData.trait} 트레잇은 능력치 합이 ${traitInfo.totalMin}~${traitInfo.totalMax} 사이여야 합니다. (현재: ${total})`);
      return;
    }

    // nation이 0이거나 없으면 재야로 설정
    const nation = formData.nation || 0;

    try {
      const result = await SammoAPI.JoinCreateGeneral({
        name: formData.name,
        nation: nation,
        leadership: formData.leadership,
        strength: formData.strength,
        intel: formData.intel,
        politics: formData.politics,
        charm: formData.charm,
        character: formData.character,
        trait: formData.trait,
        pic: formData.pic ? true : undefined,
        city: formData.city || undefined,
        serverID,
      });

      if (result.result) {
        router.push(`/${serverID}/game`);
      } else {
        alert(result.reason || '장수 생성에 실패했습니다.');
      }
    } catch (err: unknown) {
      console.error('장수 생성 에러:', err);
      const errorMessage = 
        (err instanceof Error && err.message) ||
        (typeof err === 'object' && err !== null && 'data' in err && typeof err.data === 'object' && err.data !== null && ('reason' in err.data ? String(err.data.reason) : 'message' in err.data ? String(err.data.message) : '')) ||
        '장수 생성에 실패했습니다.';
      alert(errorMessage);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="장수 생성" backUrl="/entrance" />
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 임관 권유문 테이블 */}
        {nationList.length > 0 && (
          <div className="bg-background-secondary/70 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800/50 text-gray-300 border-b border-white/5">
                    <th className="py-3 px-4 text-left w-[130px]">국가</th>
                    <th className="py-3 px-4 text-left">임관 권유문</th>
                  </tr>
                </thead>
                <tbody>
                  {nationList.filter(n => n.nation !== 0).map((nation) => {
                    const bgColor = nation.color || '#000000';
                    const textColor = getTextColor(bgColor);
                    return (
                      <tr 
                        key={nation.nation}
                        style={{ 
                          backgroundColor: bgColor,
                          color: textColor
                        }}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="py-3 px-4 font-bold text-center">
                          {nation.name}
                        </td>
                        <td className="py-3 px-4">
                          <div 
                            className="max-h-[200px] overflow-hidden whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: nation.scoutmsg || '-' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {joinSummaryCards.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {joinSummaryCards.map((card) => (
              <InfoSummaryCard key={card.label} dense {...card} />
            ))}
          </div>
        )}

        <HistoryTimeline
          title="입장 절차"
          subtitle="트레잇 · 능력치 · 국가"
          events={entryTimelineEvents}
          variant="compact"
          highlightCategory={allowJoinNation ? 'nation' : 'system'}
        />
        
        {loading ? (
          <div className="flex justify-center items-center p-12">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/5 bg-background-secondary/70 p-6 shadow-lg backdrop-blur">
            
            {/* 장수명 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">장수명</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="장수명을 입력하세요"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white placeholder-gray-600"
                required
              />
            </div>

            {/* 소속 국가 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">소속 국가</label>
              {allowJoinNation ? (
                <select
                  value={formData.nation}
                  onChange={(e) => setFormData({ ...formData, nation: Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                >
                  <option value="0" className="bg-gray-900">재야</option>
                  {nationList.map((nation) => (
                    <option key={nation.nation} value={nation.nation} className="bg-gray-900">
                      {nation.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  ⚠️ 이 서버는 재야로만 시작할 수 있습니다
                </div>
              )}
            </div>

            {/* 트레잇 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">트레잇 선택</label>
              <select
                value={formData.trait}
                onChange={(e) => setFormData({ ...formData, trait: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
              >
                <option value="범인" className="bg-gray-900">범인 - 평범 (총합 266~275)</option>
                <option value="수재" className="bg-gray-900">수재 - 뛰어남 (총합 256~265, 유산 200P)</option>
                <option value="영재" className="bg-gray-900">영재 - 남다름 (총합 241~255, 유산 500P)</option>
                <option value="천재" className="bg-gray-900">천재 - 천부적 (총합 220~240, 유산 1000P)</option>
              </select>
              
              {/* 트레잇 정보 카드 */}
              <div 
                className="mt-2 p-4 bg-black/20 rounded-lg border-l-4"
                style={{ borderLeftColor: traitMetadata.color }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg" style={{ color: traitMetadata.color }}>✨ {traitMetadata.name}</span>
                  <span className="text-sm text-gray-400">- {traitMetadata.description}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="text-green-400">📈 {traitMetadata.details}</div>
                  <div className="text-red-400">⚠️ {traitMetadata.penalty}</div>
                </div>
              </div>
            </div>

            {/* 능력치 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="block text-sm font-medium text-gray-400">
                  능력치 (통/무/지/정/매)
                </label>
                <span className="text-xs text-gray-500 font-mono">
                  합계: <span className="text-white font-bold">{calculateTotalStats()}</span>
                </span>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: '통솔', value: formData.leadership, key: 'leadership' },
                  { label: '무력', value: formData.strength, key: 'strength' },
                  { label: '지력', value: formData.intel, key: 'intel' },
                  { label: '정치', value: formData.politics, key: 'politics' },
                  { label: '매력', value: formData.charm, key: 'charm' },
                ].map((stat) => (
                  <div key={stat.key} className="flex flex-col gap-1">
                    <label className="text-xs text-center text-gray-500">{stat.label}</label>
                    <div className="w-full bg-black/20 border border-white/5 rounded px-2 py-2 text-center text-white font-mono">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {[
                  { id: 'random', icon: '🎲', label: '랜덤' },
                  { id: 'balanced', icon: '⚖️', label: '균형' },
                  { id: 'commander', icon: '👑', label: '지휘관' },
                  { id: 'general_warrior', icon: '⚔️', label: '맹장' },
                  { id: 'warrior', icon: '💪', label: '무인' },
                  { id: 'tactician', icon: '🎯', label: '전략가' },
                  { id: 'strategist', icon: '📜', label: '모사' },
                  { id: 'scholar', icon: '📚', label: '학자' },
                  { id: 'administrator', icon: '🏛️', label: '내정' },
                  { id: 'diplomat', icon: '🤝', label: '외교' },
                  { id: 'charismatic', icon: '✨', label: '군주' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => randomizeStats(btn.id as any)}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-xs text-gray-300"
                  >
                    <span className="text-base">{btn.icon}</span>
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 성격 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">성격</label>
              <select
                value={formData.character}
                onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
              >
                <option value="Random" className="bg-gray-900">랜덤</option>
                <option value="brave" className="bg-gray-900">용맹</option>
                <option value="wise" className="bg-gray-900">현명</option>
                <option value="loyal" className="bg-gray-900">충성</option>
                <option value="ambitious" className="bg-gray-900">야망</option>
              </select>
            </div>

            {/* 출생 도시 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">출생 도시</label>
              <div className="flex gap-2">
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: Number(e.target.value) })}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                >
                  <option value="0" className="bg-gray-900">랜덤</option>
                  {cityList.map((city) => (
                    <option key={city.id} value={city.id} className="bg-gray-900">
                      {city.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const availableCities = formData.nation === 0 
                      ? allCities 
                      : allCities.filter(city => city.nation === formData.nation);
                    
                    if (availableCities.length > 0) {
                      const randomCity = availableCities[Math.floor(Math.random() * availableCities.length)];
                      setFormData(prev => ({ ...prev, city: randomCity.id }));
                    }
                  }}
                  disabled={cityList.length === 0}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors disabled:opacity-50"
                >
                  랜덤
                </button>
              </div>
              {cityList.length === 0 && (
                <p className="text-xs text-gray-500">
                  도시 목록을 불러올 수 없습니다. 랜덤으로 선택됩니다.
                </p>
              )}
            </div>

            {/* 전용 아이콘 */}
            <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useCustomIcon}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({ ...formData, useCustomIcon: checked });
                    if (!checked) {
                      setIconPreview(null);
                      setFormData(prev => ({ ...prev, pic: '' }));
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm font-medium text-gray-300">전용 아이콘 사용</span>
              </label>
              
              {formData.useCustomIcon && (
                <div className="space-y-4 pl-6 border-l-2 border-white/10">
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-blue-600 file:text-white
                        hover:file:bg-blue-700
                        cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">
                      권장 크기: 156x210px. 다른 크기는 중앙을 기준으로 잘립니다.
                    </p>
                  </div>
                  
                  {uploading && (
                    <div className="flex items-center gap-2 text-yellow-500 text-sm bg-yellow-500/10 p-2 rounded">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500"></div>
                      업로드 중...
                    </div>
                  )}
                  
                  {iconPreview && !uploading && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-32 h-32 border-2 border-green-500/50 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                        <img
                          src={iconPreview}
                          alt="아이콘 미리보기"
                          className="max-w-full max-h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        ✓ 업로드 완료
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
            >
              장수 생성
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
