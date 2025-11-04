'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function MyPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [basicInfo, setBasicInfo] = useState<any>(null);
  const [frontInfo, setFrontInfo] = useState<any>(null);
  const [settings, setSettings] = useState({
    use_treatment: 10,
    use_auto_nation_turn: 1,
    defence_train: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [serverID]);

  async function loadUserData() {
    try {
      setLoading(true);
      
      // 병렬로 기본 정보와 프론트 정보 로드
      const [basicInfoResult, frontInfoResult] = await Promise.all([
        SammoAPI.GetBasicInfo().catch(() => null),
        SammoAPI.GeneralGetFrontInfo({
          serverID: serverID || '',
          lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          lastGeneralRecordID: 0,
          lastWorldHistoryID: 0,
        }).catch(() => null),
      ]);

      if (basicInfoResult?.result) {
        setBasicInfo(basicInfoResult);
      }

      if (frontInfoResult?.result && frontInfoResult.general) {
        setFrontInfo(frontInfoResult);
        // 설정 초기값 설정 (실제로는 API에서 가져와야 함)
        setSettings({
          use_treatment: frontInfoResult.general.use_treatment || 10,
          use_auto_nation_turn: frontInfoResult.general.use_auto_nation_turn || 1,
          defence_train: frontInfoResult.general.defence_train === 999 || false,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    try {
      setSaving(true);
      const result = await SammoAPI.SetMySetting({
        use_treatment: settings.use_treatment,
        use_auto_nation_turn: settings.use_auto_nation_turn,
        defence_train: settings.defence_train,
      });

      if (result.result) {
        alert('설정이 저장되었습니다.');
      } else {
        alert(result.reason || '설정 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="내 정보&amp;설정" reloadable onReload={loadUserData} />

      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>기본 정보</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>장수명</div>
                <div className={styles.infoValue}>
                  {frontInfo?.general?.name || basicInfo?.generalID || '-'}
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>국가</div>
                <div className={styles.infoValue}>
                  {frontInfo?.nation?.name || basicInfo?.myNationID || '-'}
                </div>
              </div>
              {basicInfo && (
                <>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>직위</div>
                    <div className={styles.infoValue}>
                      {frontInfo?.general?.officerLevelText || `레벨 ${basicInfo.officerLevel}`}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>권한</div>
                    <div className={styles.infoValue}>
                      {basicInfo.permission > 0 ? `권한 ${basicInfo.permission}` : '일반'}
                    </div>
                  </div>
                  {basicInfo.isChief && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>지위</div>
                      <div className={styles.infoValue}>군주</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>설정</h2>
            <div className={styles.settingsForm}>
              <div className={styles.settingItem}>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.defence_train}
                    onChange={(e) => setSettings({ ...settings, defence_train: e.target.checked })}
                  />
                  수비 훈련
                </label>
              </div>
              <div className={styles.settingItem}>
                <label>치료 사용량</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.use_treatment}
                  onChange={(e) => setSettings({ ...settings, use_treatment: Number(e.target.value) })}
                  className={styles.numberInput}
                />
              </div>
              <div className={styles.settingItem}>
                <label>자동 국가 턴</label>
                <select
                  value={settings.use_auto_nation_turn}
                  onChange={(e) => setSettings({ ...settings, use_auto_nation_turn: Number(e.target.value) })}
                  className={styles.selectInput}
                >
                  <option value={0}>사용 안함</option>
                  <option value={1}>사용</option>
                </select>
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleSaveSettings} 
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


