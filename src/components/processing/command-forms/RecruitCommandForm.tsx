'use client';

import React, { useState, useEffect } from 'react';
import SelectGeneral, { type ProcGeneralItem, type ProcNationItem } from '../SelectGeneral';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface RecruitCommandFormProps {
  commandName: string;
  generals: ProcGeneralItem[];
  nations: Map<number, ProcNationItem>;
  onSubmit: (args: { destGeneralID: number }) => void;
  onCancel: () => void;
}

export default function RecruitCommandForm({
  commandName,
  generals,
  nations,
  onSubmit,
  onCancel
}: RecruitCommandFormProps) {
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

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          재야나 타국의 장수를 등용합니다.<br />
          서신은 개인 메세지로 전달됩니다.<br />
          등용할 장수를 목록에서 선택하세요.<br />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>장수:</label>
            <SelectGeneral
              value={selectedGeneralID}
              generals={generals}
              groupByNation={nations}
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

