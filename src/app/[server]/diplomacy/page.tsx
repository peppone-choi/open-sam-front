'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

interface Letter {
  no: number;
  fromNation: string;
  toNation: string;
  brief: string;
  detail: string;
  date: string;
  status: string;
}

export default function DiplomacyPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [letters, setLetters] = useState<Letter[]>([]);
  const [nations, setNations] = useState<Array<[number, string, string, number]>>([]);
  const [loading, setLoading] = useState(true);
  const [showNewLetter, setShowNewLetter] = useState(false);
  const [newLetter, setNewLetter] = useState({
    prevNo: '',
    destNation: '',
    brief: '',
    detail: '',
  });

  useEffect(() => {
    loadLetters();
    loadNations();
  }, [serverID]);

  async function loadNations() {
    try {
      const result = await SammoAPI.GlobalGetNationList();
      if (result.result && result.nationList) {
        setNations(result.nationList);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadLetters() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetDiplomacyLetter({ serverID });
      if (result.success && result.letters) {
        setLetters(result.letters);
      } else {
        setLetters([]);
      }
    } catch (err) {
      console.error(err);
      alert('외교문서를 불러오는데 실패했습니다.');
      setLetters([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendLetter() {
    if (!newLetter.destNation || !newLetter.brief) {
      alert('대상 국가와 내용을 입력해주세요.');
      return;
    }

    try {
      const result = await SammoAPI.SendDiplomacyLetter({
        serverID,
        prevNo: newLetter.prevNo ? Number(newLetter.prevNo) : undefined,
        destNationID: Number(newLetter.destNation),
        brief: newLetter.brief,
        detail: newLetter.detail,
      });

      if (result.success && result.result) {
        setShowNewLetter(false);
        setNewLetter({ prevNo: '', destNation: '', brief: '', detail: '' });
        await loadLetters();
      } else {
        alert(result.reason || result.message || '외교문서 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('외교문서 전송에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="외 교 부" reloadable onReload={loadLetters} />

      <div className={styles.header}>
        <button type="button" onClick={() => setShowNewLetter(!showNewLetter)} className={styles.composeBtn}>
          {showNewLetter ? '작성 취소' : '새 외교문서 작성'}
        </button>
      </div>

      {showNewLetter && (
        <div className={styles.composeForm}>
          <div className={styles.formGroup}>
            <label>대상 국가</label>
            <select
              value={newLetter.destNation}
              onChange={(e) => setNewLetter({ ...newLetter, destNation: e.target.value })}
              className={styles.select}
            >
              <option value="">선택하세요</option>
              {nations.map(([nationNo, nationName]) => (
                <option key={nationNo} value={nationNo}>
                  {nationName}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>내용(국가 내 공개)</label>
            <textarea
              value={newLetter.brief}
              onChange={(e) => setNewLetter({ ...newLetter, brief: e.target.value })}
              className={styles.textarea}
            />
          </div>
          <div className={styles.formGroup}>
            <label>내용(외교권자 전용)</label>
            <textarea
              value={newLetter.detail}
              onChange={(e) => setNewLetter({ ...newLetter, detail: e.target.value })}
              className={styles.textarea}
            />
          </div>
          <button type="button" onClick={sendLetter} className={styles.sendBtn}>
            전송
          </button>
        </div>
      )}

      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : letters.length === 0 ? (
        <div className="center" style={{ padding: '2rem' }}>외교문서가 없습니다.</div>
      ) : (
        <div className={styles.lettersList}>
          {letters.map((letter) => (
            <div key={letter.no} className={styles.letterCard}>
              <div className={styles.letterHeader}>
                <div className={styles.letterInfo}>
                  <span className={styles.from}>{letter.fromNation}</span>
                  <span className={styles.arrow}> → </span>
                  <span className={styles.to}>{letter.toNation}</span>
                </div>
                <div className={styles.date}>{letter.date}</div>
              </div>
              <div className={styles.letterMessage}>{letter.brief}</div>
              {letter.status && (
                <div className={styles.letterStatus}>
                  상태: {letter.status}
                  {letter.status === 'pending' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const result = await SammoAPI.DiplomacyProcess({
                            serverID,
                            letterNo: letter.no,
                            action: 'accept',
                          });
                          if (result.success && result.result) {
                            await loadLetters();
                          } else {
                            alert(result.reason || result.message || '처리에 실패했습니다.');
                          }
                        } catch (err) {
                          console.error(err);
                          alert('처리에 실패했습니다.');
                        }
                      }}
                      className={styles.acceptBtn}
                    >
                      수락
                    </button>
                  )}
                  {letter.status === 'pending' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const result = await SammoAPI.DiplomacyProcess({
                            serverID,
                            letterNo: letter.no,
                            action: 'reject',
                          });
                          if (result.success && result.result) {
                            await loadLetters();
                          } else {
                            alert(result.reason || result.message || '처리에 실패했습니다.');
                          }
                        } catch (err) {
                          console.error(err);
                          alert('처리에 실패했습니다.');
                        }
                      }}
                      className={styles.rejectBtn}
                    >
                      거절
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




