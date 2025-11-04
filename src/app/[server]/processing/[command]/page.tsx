'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function CommandProcessingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const command = params?.command as string;
  const turnList = searchParams?.get('turnList')?.split('_').map(Number) || [0];
  const isChief = searchParams?.get('is_chief') === 'true';

  const [loading, setLoading] = useState(true);
  const [commandData, setCommandData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadCommandData();
  }, [serverID, command, turnList, isChief]);

  const router = useRouter();

  async function loadCommandData() {
    if (!command) return;

    try {
      setLoading(true);
      const result = await SammoAPI.GetCommandData({
        command,
        turnList,
        isChief,
      });

      if (result.result) {
        setCommandData(result.commandData);
        setFormData(result.commandData.defaultFormData || {});
      }
    } catch (err) {
      console.error(err);
      alert('명령 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!command) {
      alert('명령이 지정되지 않았습니다.');
      return;
    }

    try {
      const result = await SammoAPI.SubmitCommand({
        command,
        turnList,
        isChief,
        data: formData,
      });

      if (result.result) {
        alert('명령이 등록되었습니다.');
        router.push(`/${serverID}/${isChief ? 'chief' : 'game'}`);
      } else {
        alert(result.reason || '명령 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('명령 등록에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title={commandData?.name || command || '명령 처리'} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.commandInfo}>
            <div>명령: {command}</div>
            <div>턴: {turnList.join(', ')}</div>
            <div>형태: {isChief ? '수뇌부' : '일반'}</div>
          </div>
          <div className={styles.commandForm}>
            <h2>명령 입력</h2>
            {/* 명령 타입에 따른 동적 폼 */}
            <button type="button" onClick={handleSubmit} className={styles.submitButton}>
              명령 등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


