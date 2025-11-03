'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function MyPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [settings, setSettings] = useState({
    use_treatment: 10,
    use_auto_nation_turn: 1,
    defence_train: false,
  });

  useEffect(() => {
    loadUserData();
  }, [serverID]);

  async function loadUserData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setUserData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    try {
      // API 호출 로직 필요
      alert('설정이 저장되었습니다.');
    } catch (err) {
      console.error(err);
      alert('설정 저장에 실패했습니다.');
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
                <div className={styles.infoValue}>-</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>국가</div>
                <div className={styles.infoValue}>-</div>
              </div>
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
            </div>
            <button type="button" onClick={handleSaveSettings} className={styles.saveButton}>
              설정 저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


