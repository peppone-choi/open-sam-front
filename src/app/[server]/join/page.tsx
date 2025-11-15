'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

interface Nation {
  nation: number;
  name: string;
  color: string;
  scout?: string;
  scoutmsg?: string;
}

interface StatLimits {
  min: number;
  max: number;
  total: number; // 통무지정매 5개 능력치 합계 (기본 275, 평균 55)
}

interface City {
  id: number;
  name: string;
  x: number;
  y: number;
  nation?: number; // 소속 국가 ID
}

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
      const result = await SammoAPI.GetJoinNations({
        serverID: serverID,
      });
      if (result.result) {
        setNationList(result.nations);
        setAllowJoinNation(result.allowJoinNation !== false); // 기본값 true
        if (result.cities) {
          setAllCities(result.cities); // 전체 도시 목록 저장
          setCityList(result.cities); // 초기에는 전체 도시 표시
        }
        if (result.statLimits) {
          setStatLimits(result.statLimits);
          // 초기 능력치를 균등 분배 (5개 능력치)
          const total = result.statLimits.total;
          const defaultStat = Math.floor(total / 5);
          const remainder = total - (defaultStat * 5);
          setFormData(prev => ({
            ...prev,
            leadership: defaultStat + remainder,
            strength: defaultStat,
            intel: defaultStat,
            politics: defaultStat,
            charm: defaultStat,
            nation: result.allowJoinNation !== false ? prev.nation : 0, // 국가 선택 불가면 0
          }));
        }
      }
    } catch (err) {
      console.error(err);
      alert('국가 목록을 불러오는데 실패했습니다.');
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

  // 배경색에 따라 텍스트 색상 결정 (밝은 배경 -> 검은색, 어두운 배경 -> 흰색)
  function getTextColor(bgColor: string): string {
    if (!bgColor) return '#ffffff';
    
    // #RRGGBB 형식을 RGB로 변환
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 밝기 계산 (YIQ 공식)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 밝기가 128 이상이면 검은색, 아니면 흰색
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  function getTraitInfo(traitName: string) {
    switch (traitName) {
      case '천재':
        return { 
          name: '천재', 
          description: '하늘이 내린 재능', 
          details: '최대 95, 보너스 5~7개',
          penalty: '유산 1000P, 초기 자원 50%, 나이 -7세',
          color: '#ff6b6b', 
          totalMin: 220, 
          totalMax: 240, 
          max: 95 
        };
      case '영재':
        return { 
          name: '영재', 
          description: '남다른 자질', 
          details: '최대 92, 보너스 4~6개',
          penalty: '유산 500P, 초기 자원 70%, 나이 -4세',
          color: '#4ecdc4', 
          totalMin: 241, 
          totalMax: 255, 
          max: 92 
        };
      case '수재':
        return { 
          name: '수재', 
          description: '뛰어난 소질', 
          details: '최대 91, 보너스 4~5개',
          penalty: '유산 200P, 초기 자원 85%, 나이 -2세',
          color: '#95e1d3', 
          totalMin: 256, 
          totalMax: 265, 
          max: 91 
        };
      case '범인':
      default:
        return { 
          name: '범인', 
          description: '평범한 인물', 
          details: '최대 90, 보너스 3~5개',
          penalty: '페널티 없음',
          color: '#999', 
          totalMin: 266, 
          totalMax: 275, 
          max: 90 
        };
    }
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
      const result = await SammoAPI.CreateGeneral({
        name: formData.name,
        nation: nation,
        leadership: formData.leadership,
        strength: formData.strength,
        intel: formData.intel,
        politics: formData.politics,
        charm: formData.charm,
        character: formData.character,
        trait: formData.trait, // 트레잇 전송
        pic: formData.pic ? true : undefined, // 전용 아이콘 사용 여부 (boolean)
        city: formData.city || undefined, // 0이면 undefined (랜덤)
        serverID: serverID,
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
    <div className={styles.container}>
      <TopBackBar title="장수 생성" backUrl="/entrance" />
      
      {/* 임관 권유문 테이블 */}
      {nationList.length > 0 && (
        <table className={styles.scoutTable}>
          <thead>
            <tr className="bg2">
              <th style={{ width: '130px' }}>국가</th>
              <th>임관 권유문</th>
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
                >
                  <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {nation.name}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <div 
                      style={{ maxHeight: '200px', overflow: 'hidden' }}
                      dangerouslySetInnerHTML={{ __html: nation.scoutmsg || '-' }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.joinForm}>
          <div className={styles.formGroup}>
            <label>장수명</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="장수명을 입력하세요"
              className={styles.input}
              required
            />
          </div>

          {allowJoinNation && (
            <div className={styles.formGroup}>
              <label>소속 국가</label>
              <select
                value={formData.nation}
                onChange={(e) => setFormData({ ...formData, nation: Number(e.target.value) })}
                className={styles.select}
              >
                <option value="0">재야</option>
                {nationList.map((nation) => (
                  <option key={nation.nation} value={nation.nation}>
                    {nation.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {!allowJoinNation && (
            <div className={styles.formGroup}>
              <label>소속 국가</label>
              <div style={{ padding: '0.75rem', background: 'rgba(251, 73, 52, 0.1)', borderRadius: '4px', color: '#fb4934' }}>
                ⚠️ 이 서버는 재야로만 시작할 수 있습니다
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>트레잇 선택</label>
            <select
              value={formData.trait}
              onChange={(e) => setFormData({ ...formData, trait: e.target.value })}
              className={styles.select}
            >
              <option value="범인">범인 - 평범 (총합 266~275)</option>
              <option value="수재">수재 - 뛰어남 (총합 256~265, 유산 200P)</option>
              <option value="영재">영재 - 남다름 (총합 241~255, 유산 500P)</option>
              <option value="천재">천재 - 천부적 (총합 220~240, 유산 1000P)</option>
            </select>
            {(() => {
              const traitInfo = getTraitInfo(formData.trait);
              return (
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.75rem', 
                  background: 'rgba(0,0,0,0.3)', 
                  borderRadius: '4px',
                  borderLeft: `4px solid ${traitInfo.color}`
                }}>
                  <div>
                    <span style={{ color: traitInfo.color, fontWeight: 'bold', fontSize: '1.1em' }}>✨ {traitInfo.name}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.9em', color: '#ccc' }}>
                      - {traitInfo.description}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85em' }}>
                    <div style={{ color: '#8ec07c' }}>📈 {traitInfo.details}</div>
                    <div style={{ color: '#fb4934', marginTop: '0.25rem' }}>⚠️ {traitInfo.penalty}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className={styles.formGroup}>
            <label>
              능력치 (통/무/지/정/매) - 합계: {calculateTotalStats()}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {(() => {
                const traitMax = getTraitInfo(formData.trait).max;
                return (
                  <>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.9em', color: '#aaa' }}>통솔</label>
                      <input
                        type="number"
                        value={formData.leadership}
                        readOnly
                        className={styles.input}
                        style={{ width: '100%', cursor: 'not-allowed', opacity: 0.7 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.9em', color: '#aaa' }}>무력</label>
                      <input
                        type="number"
                        value={formData.strength}
                        readOnly
                        className={styles.input}
                        style={{ width: '100%', cursor: 'not-allowed', opacity: 0.7 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.9em', color: '#aaa' }}>지력</label>
                      <input
                        type="number"
                        value={formData.intel}
                        readOnly
                        className={styles.input}
                        style={{ width: '100%', cursor: 'not-allowed', opacity: 0.7 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.9em', color: '#aaa' }}>정치</label>
                      <input
                        type="number"
                        value={formData.politics}
                        readOnly
                        className={styles.input}
                        style={{ width: '100%', cursor: 'not-allowed', opacity: 0.7 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.9em', color: '#aaa' }}>매력</label>
                      <input
                        type="number"
                        value={formData.charm}
                        readOnly
                        className={styles.input}
                        style={{ width: '100%', cursor: 'not-allowed', opacity: 0.7 }}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => randomizeStats('random')}
                className={styles.statBtn}
              >
                🎲 랜덤
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('balanced')}
                className={styles.statBtn}
              >
                ⚖️ 균형
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('commander')}
                className={styles.statBtn}
              >
                👑 지휘관
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('general_warrior')}
                className={styles.statBtn}
              >
                ⚔️ 맹장
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('warrior')}
                className={styles.statBtn}
              >
                💪 무인
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('tactician')}
                className={styles.statBtn}
              >
                🎯 전략가
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('strategist')}
                className={styles.statBtn}
              >
                📜 모사
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('scholar')}
                className={styles.statBtn}
              >
                📚 학자
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('administrator')}
                className={styles.statBtn}
              >
                🏛️ 내정
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('diplomat')}
                className={styles.statBtn}
              >
                🤝 외교
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('charismatic')}
                className={styles.statBtn}
              >
                ✨ 군주
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>성격</label>
            <select
              value={formData.character}
              onChange={(e) => setFormData({ ...formData, character: e.target.value })}
              className={styles.select}
            >
              <option value="Random">랜덤</option>
              <option value="brave">용맹</option>
              <option value="wise">현명</option>
              <option value="loyal">충성</option>
              <option value="ambitious">야망</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>출생 도시</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: Number(e.target.value) })}
                className={styles.select}
                style={{ flex: 1 }}
              >
                <option value="0">랜덤</option>
                {cityList.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  // 현재 선택된 국가에 속한 도시만 랜덤 선택
                  const availableCities = formData.nation === 0 
                    ? allCities // 재야면 모든 도시
                    : allCities.filter(city => city.nation === formData.nation); // 선택한 국가의 도시만
                  
                  if (availableCities.length > 0) {
                    const randomCity = availableCities[Math.floor(Math.random() * availableCities.length)];
                    setFormData(prev => ({ ...prev, city: randomCity.id }));
                  }
                }}
                className={styles.statBtn}
                disabled={cityList.length === 0}
              >
                랜덤
              </button>
            </div>
            {cityList.length === 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#999' }}>
                도시 목록을 불러올 수 없습니다. 랜덤으로 선택됩니다.
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>
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
                style={{ marginRight: '0.5rem' }}
              />
              전용 아이콘 사용
            </label>
            
            {formData.useCustomIcon && (
              <div style={{ marginTop: '0.75rem' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  disabled={uploading}
                  className={styles.input}
                  style={{ marginBottom: '0.5rem' }}
                />
                
                <div style={{ 
                  fontSize: '0.85em', 
                  color: '#999', 
                  marginBottom: '0.5rem' 
                }}>
                  권장 크기: 156x210px. 다른 크기는 중앙을 기준으로 잘립니다.
                </div>
                
                {uploading && (
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'rgba(251, 189, 8, 0.1)', 
                    borderRadius: '4px', 
                    color: '#fbbd08',
                    marginBottom: '0.5rem'
                  }}>
                    업로드 중...
                  </div>
                )}
                
                {iconPreview && !uploading && (
                  <div style={{ 
                    marginTop: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '128px',
                      height: '128px',
                      border: '2px solid rgba(142, 192, 124, 0.5)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0, 0, 0, 0.3)'
                    }}>
                      <img
                        src={iconPreview}
                        alt="아이콘 미리보기"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#8ec07c' }}>
                      ✓ 업로드 완료
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button type="submit" className={styles.submitButton}>
            장수 생성
          </button>
        </form>
      )}
    </div>
  );
}
