'use client';

import React, { useState, useEffect } from 'react';
import SelectGeneral, { type ProcGeneralItem } from '../SelectGeneral';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface GeneralTargetCommandFormProps {
  commandName: string;
  generals: ProcGeneralItem[];
  onSubmit: (args: { destGeneralID: number }) => void;
  onCancel: () => void;
}

export default function GeneralTargetCommandForm({
  commandName,
  generals,
  onSubmit,
  onCancel
}: GeneralTargetCommandFormProps) {
  const [selectedGeneralID, setSelectedGeneralID] = useState<number>(0);

  useEffect(() => {
    if (generals.length > 0 && selectedGeneralID === 0) {
      setSelectedGeneralID(generals[0].no);
    }
  }, [generals, selectedGeneralID]);

  const handleSubmit = () => {
    if (selectedGeneralID === 0) {
      alert('장수를 선택해주세요.');
      return;
    }
    onSubmit({ destGeneralID: selectedGeneralID });
  };

  const getDescription = () => {
    if (commandName === '부대탈퇴지시' || commandName === '부대 탈퇴 지시') {
      return '지정한 장수에게 부대 탈퇴를 지시합니다.\n부대원만 가능합니다.';
    }
    return '장수를 선택하세요.';
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          {getDescription().split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>장수:</label>
            <SelectGeneral
              value={selectedGeneralID}
              generals={generals}
              onChange={setSelectedGeneralID}
            />
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={handleSubmit} className={styles.submitButton}>
              {commandName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

