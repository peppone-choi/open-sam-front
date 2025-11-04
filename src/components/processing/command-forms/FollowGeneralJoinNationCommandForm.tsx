'use client';

import React, { useState, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectGeneral from '@/components/processing/SelectGeneral';
import SelectNation from '@/components/processing/SelectNation';
import type { ProcGeneralItem, ProcNationItem } from '@/components/processing/SelectGeneral';
import styles from './CommandForm.module.css';

interface FollowGeneralJoinNationCommandFormProps {
  commandName: string;
  generals: ProcGeneralItem[];
  nations: ProcNationItem[];
  onSubmit: (args: { destGeneralID: number }) => void;
  onCancel: () => void;
}

export default function FollowGeneralJoinNationCommandForm({
  commandName,
  generals,
  nations: nationsArray,
  onSubmit,
  onCancel
}: FollowGeneralJoinNationCommandFormProps) {
  // 배열을 Map으로 변환
  const nationsMap = useMemo(() => {
    const map = new Map<number, ProcNationItem>();
    for (const nation of nationsArray) {
      map.set(nation.id, nation);
    }
    return map;
  }, [nationsArray]);

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
          장수를 따라 임관합니다.
          <br />
          이미 임관/등용되었던 국가는 다시 임관할 수 없습니다.
          <br />
          바로 군주의 위치로 이동합니다.
          <br />
          임관할 장수를 선택하세요.
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>장수:</label>
            <SelectGeneral
              value={selectedGeneralID}
              generals={generals}
              groupByNation={nationsMap}
              onChange={(value) => setSelectedGeneralID(value)}
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

