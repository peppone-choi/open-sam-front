'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

interface Nation {
  nation: number;
  name: string;
  color: string;
  scout?: string;
  scoutmsg?: string;
}

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;

  const [nationList, setNationList] = useState<Nation[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    nation: 0,
    icon: 0,
    npcType: 0,
  });

  useEffect(() => {
    loadNations();
  }, [serverID]);

  async function loadNations() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setNationList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // API 호출 로직 필요
      router.push(`/${serverID}/game`);
    } catch (err) {
      console.error(err);
      alert('장수 생성에 실패했습니다.');
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
            <label>소속 국가</label>
            <select
              value={formData.nation}
              onChange={(e) => setFormData({ ...formData, nation: Number(e.target.value) })}
              className={styles.select}
              required
            >
              <option value="0">선택하세요</option>
              {nationList.map((nation) => (
                <option key={nation.nation} value={nation.nation}>
                  {nation.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>NPC 타입</label>
            <select
              value={formData.npcType}
              onChange={(e) => setFormData({ ...formData, npcType: Number(e.target.value) })}
              className={styles.select}
            >
              <option value="0">일반</option>
              <option value="1">NPC</option>
            </select>
          </div>

          <button type="submit" className={styles.submitButton}>
            장수 생성
          </button>
        </form>
      )}
    </div>
  );
}
