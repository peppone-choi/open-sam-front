'use client';

import React, { useState, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectNation from '@/components/processing/SelectNation';
import type { ProcNationItem } from '@/components/processing/SelectGeneral';
import styles from './CommandForm.module.css';

interface JoinNationCommandFormProps {
  commandName: string;
  nations: ProcNationItem[];
  onSubmit: (args: { destNationID: number }) => void;
  onCancel: () => void;
}

export default function JoinNationCommandForm({
  commandName,
  nations,
  onSubmit,
  onCancel
}: JoinNationCommandFormProps) {
  // 배열을 Map으로 변환
  const nationsMap = useMemo(() => {
    const map = new Map<number, ProcNationItem>();
    for (const nation of nations) {
      map.set(nation.id, nation);
    }
    return map;
  }, [nations]);

  const [selectedNationID, setSelectedNationID] = useState<number>(
    nations.length > 0 ? nations[0].id : 0
  );

  const handleSubmit = () => {
    if (!selectedNationID) {
      alert('국가를 선택해주세요.');
      return;
    }

    onSubmit({ destNationID: selectedNationID });
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          국가에 임관합니다.
          <br />
          이미 임관/등용되었던 국가는 다시 임관할 수 없습니다.
          <br />
          바로 군주의 위치로 이동합니다.
          <br />
          임관할 국가를 목록에서 선택하세요.
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>국가:</label>
            <SelectNation
              value={selectedNationID}
              nations={nationsMap}
              onChange={setSelectedNationID}
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

