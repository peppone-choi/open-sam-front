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
  total: number;
}

interface City {
  id: number;
  name: string;
  x: number;
  y: number;
}

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;

  const [nationList, setNationList] = useState<Nation[]>([]);
  const [cityList, setCityList] = useState<City[]>([]);
  const [statLimits, setStatLimits] = useState<StatLimits>({ min: 30, max: 100, total: 240 });
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    nation: 0,
    leadership: 80,
    strength: 80,
    intel: 80,
    character: 'Random',
    city: 0, // 0이면 랜덤
  });

  const loadNations = useCallback(async () => {
    if (!serverID) return;
    
    try {
      setLoading(true);
      const result = await SammoAPI.GetJoinNations({
        serverID: serverID,
      });
      if (result.result) {
        setNationList(result.nations);
        if (result.cities) {
          setCityList(result.cities);
        }
        if (result.statLimits) {
          setStatLimits(result.statLimits);
          // 초기 능력치를 균등 분배
          const total = result.statLimits.total;
          const defaultLeadership = total - 2 * Math.floor(total / 3);
          const defaultStat = Math.floor(total / 3);
          setFormData(prev => ({
            ...prev,
            leadership: defaultLeadership,
            strength: defaultStat,
            intel: defaultStat,
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

  function calculateTotalStats() {
    return formData.leadership + formData.strength + formData.intel;
  }

  function randomizeStats(type: 'random' | 'leadPow' | 'leadInt' | 'powInt' = 'random') {
    const { min, max, total } = statLimits;
    
    if (type === 'random') {
      // 완전 랜덤 - 각 능력치가 max를 초과하지 않도록
      // 먼저 각 능력치를 min~max 범위로 랜덤 생성
      let l = min + Math.floor(Math.random() * (max - min + 1));
      let s = min + Math.floor(Math.random() * (max - min + 1));
      let i = min + Math.floor(Math.random() * (max - min + 1));
      
      // 합계를 total에 맞추기
      const currentTotal = l + s + i;
      const diff = total - currentTotal;
      
      // 차이를 분배하되, 각 능력치가 min~max 범위를 유지하도록
      if (diff > 0) {
        // 합이 부족하면 증가
        const available = [max - l, max - s, max - i];
        const totalAvailable = available.reduce((a, b) => a + b, 0);
        if (totalAvailable > 0) {
          l = Math.min(max, l + Math.floor((available[0] / totalAvailable) * diff));
          s = Math.min(max, s + Math.floor((available[1] / totalAvailable) * diff));
          i = total - l - s;
          i = Math.max(min, Math.min(max, i));
          // i 조정으로 인한 차이를 다시 분배
          const finalDiff = total - l - s - i;
          if (finalDiff !== 0) {
            if (finalDiff > 0) {
              if (l < max) l = Math.min(max, l + finalDiff);
              else if (s < max) s = Math.min(max, s + finalDiff);
            } else {
              if (l > min) l = Math.max(min, l + finalDiff);
              else if (s > min) s = Math.max(min, s + finalDiff);
            }
            i = total - l - s;
          }
        }
      } else if (diff < 0) {
        // 합이 초과하면 감소
        const available = [l - min, s - min, i - min];
        const totalAvailable = available.reduce((a, b) => a + b, 0);
        if (totalAvailable > 0) {
          l = Math.max(min, l + Math.floor((available[0] / totalAvailable) * diff));
          s = Math.max(min, s + Math.floor((available[1] / totalAvailable) * diff));
          i = total - l - s;
          i = Math.max(min, Math.min(max, i));
          const finalDiff = total - l - s - i;
          if (finalDiff !== 0) {
            if (finalDiff > 0) {
              if (l < max) l = Math.min(max, l + finalDiff);
              else if (s < max) s = Math.min(max, s + finalDiff);
            } else {
              if (l > min) l = Math.max(min, l + finalDiff);
              else if (s > min) s = Math.max(min, s + finalDiff);
            }
            i = total - l - s;
          }
        }
      }
      setFormData(prev => ({ ...prev, leadership: l, strength: s, intel: i }));
    } else if (type === 'leadPow') {
      // 통솔+무력형
      const l = min + Math.floor(Math.random() * (max - min + 1));
      const remaining = total - l;
      const s = Math.min(max, Math.max(min, remaining - min));
      const i = total - l - s;
      setFormData(prev => ({ 
        ...prev, 
        leadership: Math.min(Math.max(l, min), max), 
        strength: Math.min(Math.max(s, min), max), 
        intel: Math.min(Math.max(i, min), max) 
      }));
    } else if (type === 'leadInt') {
      // 통솔+지력형
      const l = min + Math.floor(Math.random() * (max - min + 1));
      const remaining = total - l;
      const i = Math.min(max, Math.max(min, remaining - min));
      const s = total - l - i;
      setFormData(prev => ({ 
        ...prev, 
        leadership: Math.min(Math.max(l, min), max), 
        strength: Math.min(Math.max(s, min), max), 
        intel: Math.min(Math.max(i, min), max) 
      }));
    } else if (type === 'powInt') {
      // 무력+지력형
      const s = min + Math.floor(Math.random() * (max - min + 1));
      const remaining = total - s;
      const i = Math.min(max, Math.max(min, remaining - min));
      const l = total - s - i;
      setFormData(prev => ({ 
        ...prev, 
        leadership: Math.min(Math.max(l, min), max), 
        strength: Math.min(Math.max(s, min), max), 
        intel: Math.min(Math.max(i, min), max) 
      }));
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

    // 각 능력치가 100 이하인지 확인
    if (formData.leadership > statLimits.max || formData.strength > statLimits.max || formData.intel > statLimits.max) {
      alert(`각 능력치는 ${statLimits.max} 이하여야 합니다.`);
      return;
    }

    if (formData.leadership < statLimits.min || formData.strength < statLimits.min || formData.intel < statLimits.min) {
      alert(`각 능력치는 ${statLimits.min} 이상이어야 합니다.`);
      return;
    }

    const total = calculateTotalStats();
    if (total > statLimits.total) {
      alert(`능력치 합이 ${statLimits.total}을 초과할 수 없습니다. (현재: ${total})`);
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
        character: formData.character,
        pic: true,
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
      <TopBackBar title="장수 생성" />
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

          <div className={styles.formGroup}>
            <label>소속 국가 (선택 안 하면 재야)</label>
            <select
              value={formData.nation}
              onChange={(e) => setFormData({ ...formData, nation: Number(e.target.value) })}
              className={styles.select}
            >
              <option value="0">재야 (국가 없음)</option>
              {nationList.map((nation) => (
                <option key={nation.nation} value={nation.nation}>
                  {nation.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>
              능력치 (통/무/지) - 합계: {calculateTotalStats()} / {statLimits.total}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9em', color: '#aaa' }}>통솔</label>
                <input
                  type="number"
                  min={statLimits.min}
                  max={statLimits.max}
                  value={formData.leadership}
                  onChange={(e) => {
                    const value = Math.min(Math.max(Number(e.target.value) || 0, statLimits.min), statLimits.max);
                    setFormData({ ...formData, leadership: value });
                  }}
                  className={styles.input}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9em', color: '#aaa' }}>무력</label>
                <input
                  type="number"
                  min={statLimits.min}
                  max={statLimits.max}
                  value={formData.strength}
                  onChange={(e) => {
                    const value = Math.min(Math.max(Number(e.target.value) || 0, statLimits.min), statLimits.max);
                    setFormData({ ...formData, strength: value });
                  }}
                  className={styles.input}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9em', color: '#aaa' }}>지력</label>
                <input
                  type="number"
                  min={statLimits.min}
                  max={statLimits.max}
                  value={formData.intel}
                  onChange={(e) => {
                    const value = Math.min(Math.max(Number(e.target.value) || 0, statLimits.min), statLimits.max);
                    setFormData({ ...formData, intel: value });
                  }}
                  className={styles.input}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => randomizeStats('random')}
                className={styles.statBtn}
              >
                랜덤형
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('leadPow')}
                className={styles.statBtn}
              >
                통솔무력형
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('leadInt')}
                className={styles.statBtn}
              >
                통솔지력형
              </button>
              <button
                type="button"
                onClick={() => randomizeStats('powInt')}
                className={styles.statBtn}
              >
                무력지력형
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
                  if (cityList.length > 0) {
                    const randomCity = cityList[Math.floor(Math.random() * cityList.length)];
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

          <button type="submit" className={styles.submitButton}>
            장수 생성
          </button>
        </form>
      )}
    </div>
  );
}
