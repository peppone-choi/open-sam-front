'use client';
 
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import styles from './page.module.css';


export default function AdminTimeControlPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [timeData, setTimeData] = useState<any>(null);
  const [minute, setMinute] = useState('');
  const [minute2, setMinute2] = useState('');

  const isLocked = Boolean(timeData?.plock > 0);

  const statusCards = useMemo(() => {
    return [
      {
        label: '턴 진행',
        value: timeData?.turntime ?? '-',
        caption: '최종 갱신 기준 시간',
        badge: isLocked ? '동결 중' : '가동 중',
        tone: isLocked ? 'danger' as const : 'success' as const,
      },
      {
        label: '토너먼트',
        value: timeData?.tnmt_time ?? '-',
        caption: '토너먼트 진행 시간',
        badge: 'TNMT',
        tone: 'warn' as const,
      },
      {
        label: '락 상태',
        value: isLocked ? '관리자 락 ON' : '관리자 락 OFF',
        caption: isLocked ? '명령 처리 차단됨' : '명령 처리 가능',
        badge: isLocked ? 'LOCKED' : 'LIVE',
        tone: isLocked ? 'danger' as const : 'success' as const,
      },
    ];
  }, [isLocked, timeData]);
 
  const loadTimeData = useCallback(async () => {

    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetTimeControl();
      if (result.result) {
        setTimeData(result.timeControl);
      }
    } catch (err) {
      console.error(err);
      alert('시간 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTimeData();
  }, [loadTimeData]);


  async function handleTimeControl(action: string) {
    try {
      const data: any = {};
      
      if (action === 'forward' || action === 'backward') {
        if (!minute) {
          alert('분을 입력해주세요.');
          return;
        }
        data.minute = Number(minute);
      } else if (action === 'tnmt_forward' || action === 'tnmt_backward') {
        if (!minute2) {
          alert('분을 입력해주세요.');
          return;
        }
        data.minute = Number(minute2);
      }

      const result = await SammoAPI.AdminUpdateTimeControl({
        action,
        data,
      });

      if (result.result) {
        alert('처리되었습니다.');
        setMinute('');
        setMinute2('');
        await loadTimeData();
      } else {
        alert(result.reason || '처리에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('처리에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="시간 조정" reloadable onReload={loadTimeData} />
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-gray-400">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-white" />
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.statusGrid}>
            {statusCards.map((card) => (
              <div key={card.label} className={styles.statCard}>
                <p className={styles.statLabel}>{card.label}</p>
                <p className={styles.statValue}>{card.value}</p>
                <p className={styles.statMeta}>{card.caption}</p>
                {card.badge && (
                  <span
                    className={cn(styles.badge, {
                      [styles.badgeSuccess]: card.tone === 'success',
                      [styles.badgeWarn]: card.tone === 'warn',
                      [styles.badgeDanger]: card.tone === 'danger',
                    })}
                  >
                    {card.badge}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.timeControlForm}>
            <div className={styles.formRow}>
              <div>
                <label>시간조정 (분)</label>
                <p className={styles.metaText}>최종 갱신: {timeData?.turntime || '-'}</p>
              </div>
              <input
                type="number"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className={styles.input}
                size={3}
              />
              <button type="button" onClick={() => handleTimeControl('forward')} className={styles.button}>
                분당김
              </button>
              <button type="button" onClick={() => handleTimeControl('backward')} className={styles.button}>
                분지연
              </button>
            </div>
            <div className={styles.formRow}>
              <div>
                <label>토너먼트 시간조정 (분)</label>
                <p className={styles.metaText}>토너먼트 기준: {timeData?.tnmt_time || '-'}</p>
              </div>
              <input
                type="number"
                value={minute2}
                onChange={(e) => setMinute2(e.target.value)}
                className={styles.input}
                size={3}
              />
              <button type="button" onClick={() => handleTimeControl('tnmt_forward')} className={styles.button}>
                토너분당김
              </button>
              <button type="button" onClick={() => handleTimeControl('tnmt_backward')} className={styles.button}>
                토너분지연
              </button>
            </div>
            <div className={styles.formRow}>
              <label>보상 지급</label>
              <button type="button" onClick={() => handleTimeControl('gold_payment')} className={styles.button}>
                금지급
              </button>
              <button type="button" onClick={() => handleTimeControl('rice_payment')} className={styles.button}>
                쌀지급
              </button>
            </div>
            <div className={styles.formRow}>
              <div>
                <label>관리자 락</label>
                <p className={cn(styles.lockState, isLocked ? styles.lockStateActive : styles.lockStateIdle)}>
                  현재: {isLocked ? '동결중' : '가동중'}
                </p>
              </div>
              <button type="button" onClick={() => handleTimeControl('lock')} className={styles.button}>
                락걸기
              </button>
              <button type="button" onClick={() => handleTimeControl('unlock')} className={styles.button}>
                락풀기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




