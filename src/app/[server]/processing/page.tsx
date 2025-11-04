'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function ProcessingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serverID = params?.server as string;
  const commandType = searchParams?.get('command') || '';
  const turnList = searchParams?.get('turnList')?.split('_').map(Number) || [];
  const isChiefTurn = searchParams?.get('is_chief') === 'true';

  const [loading, setLoading] = useState(true);
  const [commandData, setCommandData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (commandType && turnList.length > 0) {
      loadCommandData();
    }
  }, [commandType, turnList, isChiefTurn]);

  async function loadCommandData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetCommandTable({
        command: commandType,
        turnList: turnList,
        isChief: isChiefTurn,
      });

      if (result.result) {
        setCommandData(result.commandTable);
        // 폼 데이터 초기화
        setFormData({});
      } else {
        alert(result.reason || '명령 정보를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('명령 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      const result = await SammoAPI.CommandReserveCommand({
        command: commandType,
        args: formData,
        turnList: turnList,
      });

      if (result.result) {
        router.push(`/${serverID}/game`);
      } else {
        alert(result.reason || '명령 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('명령 등록에 실패했습니다.');
    }
  }

  if (!commandType || turnList.length === 0) {
    return (
      <div className={styles.container}>
        <TopBackBar title="명령 처리" />
        <div className="center" style={{ padding: '2rem' }}>잘못된 접근입니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="명령 처리" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.commandForm}>
            <h2>{commandData?.name || commandType}</h2>
            {/* 명령별 입력 폼 */}
            <button type="button" onClick={handleSubmit} className={styles.submitBtn}>
              명령 등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
