'use client';

import React, { useMemo, useState } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';
import localStyles from './ReassignUnitCommandForm.module.css';

interface UnitStackItem {
  id: string;
  crewTypeId: number;
  crewTypeName?: string;
  unitSize: number;
  stackCount: number;
  troops: number;
  train: number;
  morale: number;
  ownerType?: string;
  updatedAt?: string;
}

interface ReassignUnitCommandFormProps {
  commandName: string;
  currentCityId?: number;
  currentCityName?: string | null;
  generalStacks: UnitStackItem[];
  cityStacks: UnitStackItem[];
  availableCities?: Array<{ id: number; name: string }>;
  onSubmit: (args: { stackId: string; splitCount?: number; targetCityId?: number }) => void;
  onCancel: () => void;
}

function formatStackLabel(stack: UnitStackItem) {
  return `${stack.crewTypeName || `병종 ${stack.crewTypeId}`} · ${stack.troops.toLocaleString()}명 (${stack.stackCount}스택)`;
}

export default function ReassignUnitCommandForm({
  commandName,
  currentCityId,
  currentCityName,
  generalStacks,
  cityStacks,
  availableCities = [],
  onSubmit,
  onCancel,
}: ReassignUnitCommandFormProps) {
  const hasGeneralStacks = generalStacks.length > 0;
  const hasCityStacks = cityStacks.length > 0;

  const [activeGroup, setActiveGroup] = useState<'general' | 'city'>(hasGeneralStacks ? 'general' : 'city');
  const stackList = useMemo(() => (activeGroup === 'general' ? generalStacks : cityStacks), [activeGroup, generalStacks, cityStacks]);
  const [selectedStackId, setSelectedStackId] = useState<string>(stackList[0]?.id ?? '');
  const selectedStack = stackList.find((stack) => stack.id === selectedStackId) || null;
  const [splitCount, setSplitCount] = useState<number>(selectedStack?.stackCount ?? 1);
  const [targetCityId, setTargetCityId] = useState<number | undefined>(currentCityId);

  React.useEffect(() => {
    if (stackList.length && !selectedStackId) {
      setSelectedStackId(stackList[0].id);
      setSplitCount(stackList[0].stackCount);
    }
  }, [stackList, selectedStackId]);

  React.useEffect(() => {
    if (selectedStack) {
      setSplitCount(selectedStack.stackCount);
    }
  }, [selectedStack]);

  const maxSplit = selectedStack?.stackCount ?? 1;

  const handleSubmit = () => {
    if (!selectedStack) {
      alert('병력을 선택하세요.');
      return;
    }

    const payload: { stackId: string; splitCount?: number; targetCityId?: number } = {
      stackId: selectedStack.id,
    };

    if (splitCount > 0 && splitCount < selectedStack.stackCount) {
      payload.splitCount = splitCount;
    }

    if (activeGroup === 'general') {
      payload.targetCityId = targetCityId ?? currentCityId;
      if (!payload.targetCityId) {
        alert('재배치할 도시를 선택하세요.');
        return;
      }
    }

    onSubmit(payload);
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          <div>장수가 보유한 부대를 도시 수비대로 편성하거나, 현재 도시 수비대를 자신의 부대로 편입합니다.</div>
          <div>일부만 이동하려면 스택 수를 조정하세요. 동일 병종은 기존 스택에 합쳐집니다.</div>
          {currentCityName && (
            <div>현재 주둔 도시: <strong>{currentCityName}</strong></div>
          )}
        </div>

        <div className={localStyles.stackFilter}>
          <button
            type="button"
            className={activeGroup === 'general' ? localStyles.active : ''}
            disabled={!hasGeneralStacks}
            onClick={() => setActiveGroup('general')}
          >
            장수 보유 ({generalStacks.length})
          </button>
          <button
            type="button"
            className={activeGroup === 'city' ? localStyles.active : ''}
            disabled={!hasCityStacks}
            onClick={() => setActiveGroup('city')}
          >
            도시 수비 ({cityStacks.length})
          </button>
        </div>

        {stackList.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#adb5bd' }}>
            이동 가능한 병력이 없습니다.
          </div>
        ) : (
          <div className={localStyles.stackList}>
            {stackList.map((stack) => (
              <div
                key={stack.id}
                className={`${localStyles.stackCard} ${selectedStackId === stack.id ? localStyles.selected : ''}`}
                onClick={() => setSelectedStackId(stack.id)}
              >
                <div className={localStyles.stackMain}>{formatStackLabel(stack)}</div>
                <div className={localStyles.stackMeta}>
                  <span>훈련 {Math.round(stack.train)}</span>
                  <span>사기 {Math.round(stack.morale)}</span>
                  <span>{stack.unitSize}명 × {stack.stackCount}스택</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedStack && (
          <div className={localStyles.formGrid}>
            <div className={localStyles.inputGroup}>
              <label>이동할 스택 수 ({selectedStack.stackCount} 중)</label>
              <input
                type="number"
                min={1}
                max={Math.max(1, maxSplit)}
                value={splitCount}
                onChange={(e) => setSplitCount(Math.max(1, Math.min(Number(e.target.value) || 1, Math.max(1, maxSplit))))}
                className={localStyles.splitInput}
              />
              <div className={localStyles.helperText}>
                1은 스택 전체를 의미합니다. 일부만 이동하면 스택이 자동으로 분할됩니다.
              </div>
            </div>

            {activeGroup === 'general' && (
              <div className={localStyles.inputGroup}>
                <label>배치할 도시</label>
                <select
                  className={localStyles.citySelect}
                  value={targetCityId ?? ''}
                  onChange={(e) => setTargetCityId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">현재 도시</option>
                  {availableCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <div className={localStyles.helperText}>선택하지 않으면 현재 도시 수비대로 편성됩니다.</div>
              </div>
            )}
          </div>
        )}

        <div className={styles.formActions}>
          <button type="button" className={styles.submitButton} onClick={handleSubmit} disabled={!selectedStack}>
            {commandName}
          </button>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
