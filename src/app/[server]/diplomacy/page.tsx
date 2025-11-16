'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import TipTapEditor from '@/components/editor/TipTapEditor';
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
  const [showNewLetter, setShowNewLetter] = useState(true);
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
      const result = await SammoAPI.GlobalGetNationList({ session_id: serverID });

      if (!result.result) {
        setNations([]);
        return;
      }

      if (Array.isArray(result.nationList)) {
        setNations(result.nationList);
      } else if (Array.isArray(result.nations)) {
        const list = result.nations.map((n: any): [number, string, string, number] => [
          n.nation ?? n.id,
          n.name,
          n.color ?? '#000000',
          0,
        ]);
        setNations(list);
      } else {
        setNations([]);
      }
    } catch (err) {
      console.error(err);
      setNations([]);
    }
  }

  async function loadLetters() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetDiplomacyLetter({ session_id: serverID });
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
        session_id: serverID,
        prevNo: newLetter.prevNo ? Number(newLetter.prevNo) : undefined,
        destNationID: Number(newLetter.destNation),
        brief: newLetter.brief,
        detail: newLetter.detail,
      });

      if (result.success && result.result) {
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
        <span>외교문서 작성</span>
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
            <label>내용 (국가 내 공개)</label>
            <textarea
              value={newLetter.brief}
              onChange={(e) => setNewLetter({ ...newLetter, brief: e.target.value })}
              className={styles.textarea}
              placeholder="국가 구성원 모두가 볼 수 있는 공개 내용을 입력하세요"
              rows={5}
            />
          </div>
          <div className={styles.formGroup}>
            <label>상세 내용 (외교권자 전용)</label>
            <TipTapEditor
              content={newLetter.detail}
              onChange={(content) => setNewLetter({ ...newLetter, detail: content })}
              placeholder="외교권자만 볼 수 있는 상세 내용을 입력하세요 (선택사항)"
              serverID={serverID}
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
        <div className="center" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>외교문서가 없습니다.</div>
          <button
            type="button"
            onClick={() => {
              setShowNewLetter(true);
              setNewLetter({ prevNo: '', destNation: '', brief: '', detail: '' });
            }}
            className={styles.composeBtn}
          >
            새 외교문서 작성
          </button>
        </div>
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
               {letter.detail && (
                  <div className={styles.letterDetail}>
                    <div className={styles.letterDetailLabel}>상세 내용</div>
                    <div className={styles.letterDetailBody}>{letter.detail}</div>
                  </div>
                )}

                {letter.status && (
                 <div className={styles.letterStatus}>
                   상태: {letter.status}
                   {letter.status === 'pending' && (
                     <button
                       type="button"
                       onClick={async () => {
                         try {
                           const result = await SammoAPI.RespondDiplomacyLetter({
                             serverID,
                             letterNo: letter.no,
                             action: 'accept',
                           });
                           if (result.result) {
                             await loadLetters();
                           } else {
                             alert(result.reason || '처리에 실패했습니다.');
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
                           const result = await SammoAPI.RespondDiplomacyLetter({
                             serverID,
                             letterNo: letter.no,
                             action: 'reject',
                           });
                           if (result.result) {
                             await loadLetters();
                           } else {
                             alert(result.reason || '처리에 실패했습니다.');
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

               <div className={styles.letterActions}>
                 <button
                   type="button"
                   onClick={() => {
                     setShowNewLetter(true);
                     setNewLetter({
                       prevNo: String(letter.no),
                       destNation: '',
                       brief: '',
                       detail: '',
                     });
                   }}
                   className={styles.renewBtn}
                 >
                   추가 문서 작성
                 </button>
               </div>

             </div>
           ))}
         </div>
       )}
     </div>
   );
 }
 
 
 
 
 
