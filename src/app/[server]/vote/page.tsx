'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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
      const result = await SammoAPI.VoteGetVoteList();
      if (result.result && result.votes.length > 0) {
        // 가장 최근 투표 가져오기
        const latestVote = result.votes[0];
        setVoteData(latestVote);
      } else {
        setVoteData(null);
      }
    } catch (err) {
      console.error(err);
      alert('투표 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitVote() {
    if (selectedOption === null || !voteData) {
      alert('옵션을 선택해주세요.');
      return;
    }
    
    try {
      const result = await SammoAPI.VoteVote({
        voteID: voteData.id || voteData.no,
        option: selectedOption,
      });

      if (result.result) {
        alert('투표가 완료되었습니다.');
        setSelectedOption(null);
        await loadVoteData();
      } else {
        alert(result.reason || '투표에 실패했습니다.');
      }
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
            <h2 className={styles.voteTitle}>{voteData.title || voteData.brief}</h2>
            <div className={styles.voteOptions}>
              {voteData.options?.map((option: any, idx: number) => (
                <label key={idx} className={styles.option}>
                  <input
                    type="radio"
                    name="vote"
                    value={idx}
                    checked={selectedOption === idx}
                    onChange={() => setSelectedOption(idx)}
                  />
                  {typeof option === 'string' ? option : option.text || option}
                </label>
              )) || (
                <div>투표 옵션을 불러올 수 없습니다.</div>
              )}
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


