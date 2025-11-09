'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './CommandForm.module.css';

interface RaiseArmyCommandFormProps {
  serverID: string;
  onComplete?: () => void;
}

export default function RaiseArmyCommandForm({ serverID, onComplete }: RaiseArmyCommandFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const result = await SammoAPI.CommandReserveCommand({
        serverID,
        action: '거병',
        arg: {}
      });

      if (result.result) {
        alert('거병 명령이 추가되었습니다.');
        if (onComplete) {
          onComplete();
        } else {
          router.push(`/${serverID}/game`);
        }
      } else {
        setError(result.message || '거병 명령 추가에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('거병 명령 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.commandForm}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <p className={styles.description}>
            재야 장수가 새로운 세력을 결성합니다.
          </p>
          <p className={styles.warning}>
            ※ 거병 후에는 방랑군 세력의 군주가 됩니다.
          </p>
          <p className={styles.info}>
            • 경험치 +100<br />
            • 공적 +100<br />
            • 초기 군량: 50,000
          </p>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '처리 중...' : '거병하기'}
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => router.back()}
            disabled={loading}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
