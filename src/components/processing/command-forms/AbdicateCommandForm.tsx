'use client';

import React, { useState } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectGeneral from '@/components/processing/SelectGeneral';
import type { ProcGeneralItem, ProcNationItem } from '@/components/processing/SelectGeneral';
import styles from './CommandForm.module.css';

interface AbdicateCommandFormProps {
  commandName: string;
  generals: ProcGeneralItem[];
  nations?: Map<number, ProcNationItem>;
  onSubmit: (args: { destGeneralID: number }) => void;
  onCancel: () => void;
}

export default function AbdicateCommandForm({
  commandName,
  generals,
  nations,
  onSubmit,
  onCancel
}: AbdicateCommandFormProps) {
  const [selectedGeneralID, setSelectedGeneralID] = useState<number>(
    generals.length > 0 ? generals[0].no : 0
  );

  const handleSubmit = () => {
    if (!selectedGeneralID) {
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
          {commandName === '선양' && (
            <>
              군주의 자리를 다른 장수에게 물려줍니다.
              <br />
              장수를 선택하세요.
            </>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>장수:</label>
            <SelectGeneral
              generals={generals}
              nations={nations}
              selectedGeneralID={selectedGeneralID}
              onSelect={setSelectedGeneralID}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.submitButton}
          >
            {commandName}
          </button>
        </div>
      </div>
    </div>
  );
}


