'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

const diplomacyStateInfo: Record<number, {name: string, color: string}> = {
  0: { name: '중립', color: '#808080' },
  1: { name: '불가침', color: '#00ff00' },
  2: { name: '동맹', color: '#0000ff' },
  3: { name: '교전', color: '#ff0000' },
  7: { name: '-', color: '#ffffff' }
};

function calculateEndDate(year: number, month: number, term: number): {year: number, month: number} {
  const totalMonths = year * 12 + month + term;
  return {
    year: Math.floor(totalMonths / 12),
    month: totalMonths % 12 || 12
  };
}

export default function NationStratFinanPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [nationData, setNationData] = useState<any>(null);
  
  const [nationMsg, setNationMsg] = useState('');
  const [scoutMsg, setScoutMsg] = useState('');
  const [editingNationMsg, setEditingNationMsg] = useState(false);
  const [editingScoutMsg, setEditingScoutMsg] = useState(false);
  const [originalNationMsg, setOriginalNationMsg] = useState('');
  const [originalScoutMsg, setOriginalScoutMsg] = useState('');
  
  const [policy, setPolicy] = useState({
    rate: 0,
    bill: 0,
    secretLimit: 0,
    blockWar: false,
    blockScout: false
  });

  useEffect(() => {
    loadNationData();
  }, [serverID]);

  async function loadNationData() {
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetStratFinan();
      if (result.result) {
        const data = result.stratFinan;
        setNationData(data);
        
        setNationMsg(data.nationMsg || '');
        setScoutMsg(data.scoutMsg || '');
        setOriginalNationMsg(data.nationMsg || '');
        setOriginalScoutMsg(data.scoutMsg || '');
        
        setPolicy({
          rate: data.rate || 0,
          bill: data.bill || 0,
          secretLimit: data.secretLimit || 0,
          blockWar: data.blockWar || false,
          blockScout: data.blockScout || false
        });
      }
    } catch (err) {
      console.error(err);
      alert('내무부 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function saveNationMsg() {
    try {
      const result = await SammoAPI.NationSetNotice(nationMsg);
      if (result.result) {
        setOriginalNationMsg(nationMsg);
        setEditingNationMsg(false);
        alert('국가 방침이 저장되었습니다.');
      } else {
        alert(result.reason || '저장에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '저장에 실패했습니다.');
    }
  }

  function cancelNationMsg() {
    setNationMsg(originalNationMsg);
    setEditingNationMsg(false);
  }

  async function saveScoutMsg() {
    try {
      const result = await SammoAPI.NationSetScoutMsg(scoutMsg);
      if (result.result) {
        setOriginalScoutMsg(scoutMsg);
        setEditingScoutMsg(false);
        alert('임관 권유 메시지가 저장되었습니다.');
      } else {
        alert(result.reason || '저장에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '저장에 실패했습니다.');
    }
  }

  function cancelScoutMsg() {
    setScoutMsg(originalScoutMsg);
    setEditingScoutMsg(false);
  }

  async function setRate() {
    try {
      const result = await SammoAPI.NationSetRate(policy.rate);
      if (result.result) {
        alert('세율이 변경되었습니다.');
        await loadNationData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    }
  }

  async function setBill() {
    try {
      const result = await SammoAPI.NationSetBill(policy.bill);
      if (result.result) {
        alert('지급률이 변경되었습니다.');
        await loadNationData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    }
  }

  async function setSecretLimit() {
    try {
      const result = await SammoAPI.NationSetSecretLimit(policy.secretLimit);
      if (result.result) {
        alert('기밀 권한이 변경되었습니다.');
        await loadNationData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    }
  }

  async function setBlockWar(value: boolean) {
    try {
      const result = await SammoAPI.NationSetBlockWar(value);
      if (result.result) {
        setPolicy({...policy, blockWar: value});
        alert('전쟁 금지 설정이 변경되었습니다.');
        await loadNationData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    }
  }

  async function setBlockScout(value: boolean) {
    try {
      const result = await SammoAPI.NationSetBlockScout(value);
      if (result.result) {
        setPolicy({...policy, blockScout: value});
        alert('임관 금지 설정이 변경되었습니다.');
        await loadNationData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <TopBackBar title="내 무 부" reloadable onReload={loadNationData} />
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      </div>
    );
  }

  const editable = nationData?.editable || false;
  const nationsList = nationData?.nationsList || [];
  const gold = nationData?.gold || 0;
  const rice = nationData?.rice || 0;
  const income = nationData?.income || { gold: { war: 0, city: 0 }, rice: { wall: 0, city: 0 } };
  const outcome = nationData?.outcome || 0;
  const incomeGold = (income.gold?.war || 0) + (income.gold?.city || 0);
  const incomeRice = (income.rice?.wall || 0) + (income.rice?.city || 0);
  const warSettingCnt = nationData?.warSettingCnt || { remain: 0, inc: 0, max: 0 };
  const year = nationData?.year || 0;
  const month = nationData?.month || 0;

  return (
    <div className={styles.container}>
      <TopBackBar title="내 무 부" reloadable onReload={loadNationData} />
      <div className={styles.content}>
        
        {/* 외교 관계 */}
        <section className={styles.section}>
          <h2>외교 관계</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.diplomacyTable}>
              <thead>
                <tr>
                  <th>국가명</th>
                  <th>국력</th>
                  <th>장수</th>
                  <th>속령</th>
                  <th>상태</th>
                  <th>기간</th>
                  <th>종료 시점</th>
                </tr>
              </thead>
              <tbody>
                {nationsList.map((nation: any) => {
                  const diplomacy = nation.diplomacy || {};
                  const term = diplomacy.term || 0;
                  const endDate = term > 0 ? calculateEndDate(year, month, term) : null;
                  const stateInfo = diplomacyStateInfo[diplomacy.state] || diplomacyStateInfo[0];
                  
                  return (
                    <tr key={nation.nation}>
                      <td style={{backgroundColor: nation.color}}>{nation.name}</td>
                      <td>{nation.power?.toLocaleString() || '-'}</td>
                      <td>{nation.gennum?.toLocaleString() || '-'}</td>
                      <td>{nation.cityCnt?.toLocaleString() || '-'}</td>
                      <td style={{color: stateInfo.color}}>{stateInfo.name}</td>
                      <td>{term === 0 ? '-' : `${term}개월`}</td>
                      <td>{!endDate ? '-' : `${endDate.year}년 ${endDate.month}월`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 국가 방침 & 임관 권유 메시지 */}
        <section className={styles.section}>
          <h2>국가 방침 & 임관 권유 메시지</h2>
          
          <div className={styles.messageBox}>
            <div className={styles.messageHeader}>
              <h3>국가 방침</h3>
              <div className={styles.buttonGroup}>
                {editable && !editingNationMsg && (
                  <button className={styles.btn} onClick={() => setEditingNationMsg(true)}>수정</button>
                )}
                {editingNationMsg && (
                  <>
                    <button className={styles.btnPrimary} onClick={saveNationMsg}>저장</button>
                    <button className={styles.btn} onClick={cancelNationMsg}>취소</button>
                  </>
                )}
              </div>
            </div>
            <textarea
              className={styles.textarea}
              value={nationMsg}
              onChange={(e) => setNationMsg(e.target.value)}
              readOnly={!editingNationMsg}
              rows={5}
            />
          </div>
          
          <div className={styles.messageBox}>
            <div className={styles.messageHeader}>
              <h3>임관 권유</h3>
              <div className={styles.buttonGroup}>
                {editable && !editingScoutMsg && (
                  <button className={styles.btn} onClick={() => setEditingScoutMsg(true)}>수정</button>
                )}
                {editingScoutMsg && (
                  <>
                    <button className={styles.btnPrimary} onClick={saveScoutMsg}>저장</button>
                    <button className={styles.btn} onClick={cancelScoutMsg}>취소</button>
                  </>
                )}
              </div>
            </div>
            <textarea
              className={styles.textarea}
              value={scoutMsg}
              onChange={(e) => setScoutMsg(e.target.value)}
              readOnly={!editingScoutMsg}
              rows={3}
            />
          </div>
        </section>

        {/* 예산 & 정책 */}
        <section className={styles.section}>
          <h2>예산 & 정책</h2>
          
          <div className={styles.financeGrid}>
            <div className={styles.financeSection}>
              <h3>자금 예산</h3>
              <div className={styles.financeRow}>
                <span className={styles.label}>현재:</span>
                <span className={styles.value}>{gold.toLocaleString()}</span>
              </div>
              <div className={styles.financeRow}>
                <span className={styles.label}>단기수입:</span>
                <span className={styles.value}>{(income.gold?.war || 0).toLocaleString()}</span>
              </div>
              <div className={styles.financeRow}>
                <span className={styles.label}>세금:</span>
                <span className={styles.value}>{Math.floor(income.gold?.city || 0).toLocaleString()}</span>
              </div>
              <div className={styles.financeRow}>
                <span className={styles.label}>수입/지출:</span>
                <span className={styles.value}>
                  +{Math.floor(incomeGold).toLocaleString()} / {Math.floor(-outcome).toLocaleString()}
                </span>
              </div>
              <div className={styles.financeRow}>
                <span className={styles.label}>국고 예산:</span>
                <span className={styles.valueHighlight}>
                  {Math.floor(gold + incomeGold - outcome).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className={styles.financeSection}>
              <h3>군량 예산</h3>
              <div className={styles.financeRow}>
                <span className={styles.label}>현재:</span>
                <span className={styles.value}>{rice.toLocaleString()}</span>
              </div>
              <div className={styles.financeRow}>
                <span className={styles.label}>둔전수입:</span>
                <span className={styles.value}>{Math.floor(income.rice?.wall || 0).toLocaleString()}</span>
              </div>
              <div className={styles.financeRow}>
                <span className={styles.label}>세금:</span>
                <span className={styles.value}>{Math.floor(income.rice?.city || 0).toLocaleString()}</span>
              </div>
              <div className={styles.financeRow}>
                <span className={styles.label}>수입/지출:</span>
                <span className={styles.value}>
                  +{Math.floor(incomeRice).toLocaleString()} / {Math.floor(-outcome).toLocaleString()}
                </span>
              </div>
              <div className={styles.financeRow}>
                <span className={styles.label}>군량 예산:</span>
                <span className={styles.valueHighlight}>
                  {Math.floor(rice + incomeRice - outcome).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className={styles.policyGrid}>
            <div className={styles.policyItem}>
              <label className={styles.policyLabel}>세율 (5 ~ 30%)</label>
              <div className={styles.inputGroup}>
                <input 
                  type="number" 
                  className={styles.input}
                  value={policy.rate} 
                  onChange={(e) => setPolicy({...policy, rate: Number(e.target.value)})} 
                  min={5} 
                  max={30}
                  disabled={!editable}
                />
                {editable && <button className={styles.btnPrimary} onClick={setRate}>변경</button>}
              </div>
            </div>
            
            <div className={styles.policyItem}>
              <label className={styles.policyLabel}>지급률 (20 ~ 200%)</label>
              <div className={styles.inputGroup}>
                <input 
                  type="number" 
                  className={styles.input}
                  value={policy.bill} 
                  onChange={(e) => setPolicy({...policy, bill: Number(e.target.value)})} 
                  min={20} 
                  max={200}
                  disabled={!editable}
                />
                {editable && <button className={styles.btnPrimary} onClick={setBill}>변경</button>}
              </div>
            </div>
            
            <div className={styles.policyItem}>
              <label className={styles.policyLabel}>기밀 권한 (1 ~ 99년)</label>
              <div className={styles.inputGroup}>
                <input 
                  type="number" 
                  className={styles.input}
                  value={policy.secretLimit} 
                  onChange={(e) => setPolicy({...policy, secretLimit: Number(e.target.value)})} 
                  min={1} 
                  max={99}
                  disabled={!editable}
                />
                {editable && <button className={styles.btnPrimary} onClick={setSecretLimit}>변경</button>}
              </div>
            </div>
            
            <div className={styles.policyItem}>
              <label className={styles.policyLabel}>전쟁 금지 설정</label>
              <div className={styles.warSettingInfo}>
                {warSettingCnt.remain}회 (월 +{warSettingCnt.inc}회, 최대 {warSettingCnt.max}회)
              </div>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={policy.blockWar} 
                    onChange={(e) => editable && setBlockWar(e.target.checked)}
                    disabled={!editable}
                  />
                  <span>전쟁 금지</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={policy.blockScout} 
                    onChange={(e) => editable && setBlockScout(e.target.checked)}
                    disabled={!editable}
                  />
                  <span>임관 금지</span>
                </label>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
