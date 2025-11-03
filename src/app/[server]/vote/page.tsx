'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function VotePage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [voteData, setVoteData] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    loadVoteData();
  }, [serverID]);

  async function loadVoteData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setVoteData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitVote() {
    if (selectedOption === null) return;
    try {
      // API 호출 로직 필요
      alert('투표가 완료되었습니다.');
      await loadVoteData();
    } catch (err) {
      console.error(err);
      alert('투표에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="설문 조사" reloadable onReload={loadVoteData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : voteData ? (
        <div className={styles.content}>
          <div className={styles.voteCard}>
            <h2 className={styles.voteTitle}>{voteData.title}</h2>
            <div className={styles.voteOptions}>
              {voteData.options.map((option: any, idx: number) => (
                <label key={idx} className={styles.option}>
                  <input
                    type="radio"
                    name="vote"
                    value={idx}
                    checked={selectedOption === idx}
                    onChange={() => setSelectedOption(idx)}
                  />
                  {option.text}
                </label>
              ))}
            </div>
            <button type="button" onClick={handleSubmitVote} className={styles.submitBtn}>
              투표하기
            </button>
          </div>
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>진행중인 설문이 없습니다.</div>
      )}
    </div>
  );
}

