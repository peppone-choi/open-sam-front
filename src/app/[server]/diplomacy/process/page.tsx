'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function DiplomacyProcessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const action = searchParams?.get('action') || '';

  const [loading, setLoading] = useState(true);
  const [diplomacyData, setDiplomacyData] = useState<any>(null);

  useEffect(() => {
    loadDiplomacyData();
  }, [serverID, action]);

  const router = useRouter();
  const letterNo = searchParams?.get('letterNo') ? Number(searchParams.get('letterNo')) : 0;

  async function loadDiplomacyData() {
    if (!action || !letterNo) {
      return;
    }

    try {
      setLoading(true);
      // 외교 데이터는 GetDiplomacyLetter에서 가져올 수 있음
      const result = await SammoAPI.GetDiplomacyLetter();
      if (result.result && result.letters) {
        const letter = result.letters.find((l: any) => l.no === letterNo);
        setDiplomacyData(letter || null);
      }
    } catch (err) {
      console.error(err);
      alert('외교 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: any) {
    if (!letterNo || !action) {
      alert('필수 정보가 없습니다.');
      return;
    }

    try {
      const result = await SammoAPI.DiplomacyProcess({
        letterNo,
        action,
        data: formData,
      });

      if (result.result) {
        alert('처리되었습니다.');
        router.push(`/${serverID}/diplomacy`);
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
      <TopBackBar title="외교 처리" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.diplomacyForm}>
            {/* 외교 처리 폼 */}
          </div>
        </div>
      )}
    </div>
  );
}




