'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';

import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';
import crewStyles from './ConscriptCommandForm.module.css';
import { useToast } from '@/contexts/ToastContext';

interface CrewTypeItem {
  id: number;
  reqTech: number;
  reqYear: number;
  notAvailable?: boolean;
  baseRice: number;
  baseRiceRaw?: number;
  baseCost: number;
  baseCostRaw?: number;
  name: string;
  attack: number;
  defence: number;
  speed: number;
  avoid: number;
  img: string;
  info: string[];
}

interface ArmCrewType {
  armType: number;
  armName: string;
  values: CrewTypeItem[];
}

interface ConscriptCommandFormProps {
  commandName: string;
  relYear: number;
  year: number;
  tech: number;
  techLevel: number;
  startYear: number;
  goldCoeff: number;
  leadership: number;
  fullLeadership: number;
  armCrewTypes: ArmCrewType[];
  currentCrewType: number;
  crew: number;
  gold: number;
  rice: number;
  // 스택 시스템 제거됨 - 호환성을 위해 nullable로 유지
  unitStacks?: unknown;
  cityStacks?: unknown;
  onSubmit: (args: { crewType: number; amount: number }) => void;
  onCancel: () => void;
}

const parseFiniteNumber = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : defaultValue;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    if (!normalized) {
      return defaultValue;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
};

const formatNumber = (value: unknown): string => {
  const numberValue = parseFiniteNumber(value);
  return numberValue.toLocaleString();
};

export default function ConscriptCommandForm({
  commandName,
  goldCoeff,
  leadership,
  fullLeadership,
  armCrewTypes,
  crew,
  gold,
  rice,
  onSubmit,
  onCancel
}: ConscriptCommandFormProps) {
  const [selectedCrewType, setSelectedCrewType] = useState<CrewTypeItem | null>(null);
  const [amount, setAmount] = useState(1);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const safeGold = parseFiniteNumber(gold);
  const safeRice = parseFiniteNumber(rice);
  const safeCrew = parseFiniteNumber(crew);
  const { showToast } = useToast();

  // 병종 맵 생성
  const crewTypeMap = useMemo(() => {
    const map = new Map<number, CrewTypeItem>();
    for (const armType of armCrewTypes) {
      for (const crewType of armType.values) {
        map.set(crewType.id, crewType);
      }
    }
    return map;
  }, [armCrewTypes]);

  const getCostPerHundred = useCallback((crewType: CrewTypeItem | null): number => {
    if (!crewType) {
      return 0;
    }
    return (
      (crewType as any).effectiveCostPerHundred ??
      crewType.baseCostRaw ??
      crewType.baseCost ??
      0
    );
  }, []);

  const getRicePerHundred = useCallback((crewType: CrewTypeItem | null): number => {
    if (!crewType) {
      return 0;
    }
    return crewType.baseRiceRaw ?? crewType.baseRice ?? 0;
  }, []);

  const getMaxRecruitable = useCallback((): number => {
    const leadershipLimit = Math.max(100, Math.floor(fullLeadership * 100));
    return Math.max(0, leadershipLimit - safeCrew);
  }, [fullLeadership, safeCrew]);

  const actualCrew = useMemo(() => {
    if (!selectedCrewType) {
      return 0;
    }
    const maxRecruitable = getMaxRecruitable();
    if (maxRecruitable <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(amount * 100, maxRecruitable));
  }, [amount, getMaxRecruitable, selectedCrewType]);

  const normalizedCrew = useMemo(() => {
    if (actualCrew <= 0) {
      return 0;
    }
    return Math.max(100, actualCrew);
  }, [actualCrew]);

  const getSelectableForType = useCallback((): number => {
    const maxRecruitable = getMaxRecruitable();
    const limit = Math.floor(fullLeadership * 1.2);
    return Math.max(1, Math.min(Math.ceil(maxRecruitable / 100), limit));
  }, [fullLeadership, getMaxRecruitable]);

  // 초기화
  useEffect(() => {
    if (!selectedCrewType && crewTypeMap.size > 0) {
      const firstType = Array.from(crewTypeMap.values())[0];
      setSelectedCrewType(firstType);
    }
  }, [crewTypeMap, selectedCrewType]);

  const getMaxSelectableAmount = useCallback(() => {
    return getSelectableForType();
  }, [getSelectableForType]);

  const handleAmountChange = (newAmount: number) => {
    const maxSelectable = getMaxSelectableAmount();
    setAmount(Math.max(1, Math.min(newAmount, maxSelectable)));
  };

  const beHalf = () => {
    const maxSelectable = getMaxSelectableAmount();
    setAmount(Math.min(Math.ceil(maxSelectable * 0.5), maxSelectable));
  };

  const beFilled = () => {
    const leadershipLimit = Math.max(100, Math.floor(fullLeadership * 100));
    const remain = Math.max(0, leadershipLimit - safeCrew);
    const desired = Math.ceil(remain / 100);
    const maxSelectable = getMaxSelectableAmount();
    setAmount(Math.min(desired, maxSelectable));
  };

  const beFull = () => {
    setAmount(getMaxSelectableAmount());
  };

  const handleSubmit = () => {
    if (!selectedCrewType) {
      showToast('병종을 선택해주세요.', 'error');
      return;
    }
    if (selectedCrewType.notAvailable) {
      showToast('선택한 병종은 현재 사용할 수 없습니다.', 'error');
      return;
    }
    if (amount < 1) {
      showToast('병력은 1명 이상이어야 합니다.', 'error');
      return;
    }
    
    if (actualCrew <= 0) {
      showToast('징집 가능한 병력이 없습니다.', 'error');
      return;
    }
    
    const totalCost = getTotalCost();
    const totalRice = getTotalRice();
    
    if (totalCost > safeGold) {
      showToast(`자금이 부족합니다. 필요: ${totalCost.toLocaleString()}금, 보유: ${formatNumber(safeGold)}금`, 'error');
      return;
    }
    
    if (totalRice > safeRice) {
      showToast(`군량이 부족합니다. 필요: ${totalRice.toLocaleString()}미, 보유: ${formatNumber(safeRice)}미`, 'error');
      return;
    }

    onSubmit({
      crewType: selectedCrewType.id,
      amount: actualCrew
    });
  };

  const getTotalCost = () => {
    if (!selectedCrewType || normalizedCrew <= 0) return 0;
    const costPerHundred = getCostPerHundred(selectedCrewType);
    if (costPerHundred <= 0) return 0;
    return Math.round((costPerHundred * normalizedCrew * goldCoeff) / 100);
  };

  const getTotalRice = () => {
    if (!selectedCrewType || normalizedCrew <= 0) return 0;
    const ricePerHundred = getRicePerHundred(selectedCrewType);
    const baseRicePerHundred = ricePerHundred > 0 ? ricePerHundred : 1;
    return Math.round((baseRicePerHundred * normalizedCrew) / 100);
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          <div>
            통솔력: {leadership} (최대 병력: {fullLeadership * 100}명)
            {goldCoeff > 1 && ` | 모병 비용: ${goldCoeff}배`}
          </div>
          <div>
            현재 병력: {formatNumber(safeCrew)}명 | 자금: {formatNumber(safeGold)}금 | 군량: {formatNumber(safeRice)}미
          </div>
        </div>

        {/* 필터 토글 버튼 */}
        <div className={crewStyles.filterSection}>
          <label className={crewStyles.filterToggle}>
            <input
              type="checkbox"
              checked={showUnavailable}
              onChange={(e) => setShowUnavailable(e.target.checked)}
            />
            <span>징병 불가 병종 표시</span>
          </label>
        </div>

        {/* 병종 계열별 선택 */}
        <div className={crewStyles.armTypeList}>
          {armCrewTypes.map((armType) => (
            <div key={armType.armType} className={crewStyles.armTypeGroup}>
              <h3 className={crewStyles.armTypeTitle}>{armType.armName}</h3>
              <div className={crewStyles.crewTypeGrid}>
                {armType.values.filter(ct => showUnavailable || !ct.notAvailable).map((crewType) => (
                  <div
                    key={crewType.id}
                    className={`${crewStyles.crewTypeItem} ${
                      selectedCrewType?.id === crewType.id ? crewStyles.selected : ''
                    } ${crewType.notAvailable ? crewStyles.notAvailable : ''}`}
                    onClick={() => {
                      if (!crewType.notAvailable) {
                        setSelectedCrewType(crewType);
                      }
                    }}
                  >
                    <div
                      className={crewStyles.crewTypeImg}
                      style={{
                        backgroundImage: `url('${crewType.img}')`,
                      }}
                    />
                    <div
                      className={crewStyles.crewTypeName}
                      style={{
                        backgroundColor: crewType.notAvailable
                          ? '#dc3545'
                          : crewType.reqTech === 0
                          ? '#28a745'
                          : '#90ee90',
                      }}
                    >
                      {crewType.name}
                    </div>
                    <div className={crewStyles.crewTypeStats}>
                      <div>공: {crewType.attack}</div>
                      <div>방: {crewType.defence}</div>
                      <div>속: {crewType.speed}</div>
                      <div>회: {crewType.avoid}</div>
                    </div>
                    <div className={crewStyles.crewTypeCost}>
                      <div>비용: {crewType.baseCost.toFixed(1)}</div>
                      <div>군량: {crewType.baseRice.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 선택된 병종의 상세 정보 및 병력 입력 */}
        {selectedCrewType && (
          <div className={crewStyles.crewTypeDetail}>
            <div className={crewStyles.crewTypeInfo}>
              <h4>{selectedCrewType.name}</h4>
              <div className={crewStyles.infoText}>
                {selectedCrewType.info.map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className={crewStyles.amountControls}>
              <div className={crewStyles.amountButtons}>
                <button
                  type="button"
                  className={crewStyles.amountButton}
                  onClick={beHalf}
                >
                  절반
                </button>
                <button
                  type="button"
                  className={crewStyles.amountButton}
                  onClick={beFilled}
                >
                  채우기
                </button>
                <button
                  type="button"
                  className={crewStyles.amountButton}
                  onClick={beFull}
                >
                  가득
                </button>
              </div>

              <div className={crewStyles.amountInput}>
                <label>병력:</label>
                <input
                  type="number"
                  min="1"
                  max={getMaxSelectableAmount()}
                  value={amount}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className={styles.textInput}
                />

                <span>00명</span>
              </div>

              <div className={crewStyles.costDisplay}>
                <div>
                  실제 징집 병력: <strong>{formatNumber(actualCrew)}명</strong>
                </div>
                <div>
                  총 비용: <strong>{formatNumber(getTotalCost())}금</strong>
                </div>
                <div>
                  총 군량: <strong>{formatNumber(getTotalRice())}</strong>
                </div>
              </div>

            </div>

            <div className={crewStyles.submitSection}>
              <button
                type="button"
                onClick={handleSubmit}
                className={styles.submitButton}
                disabled={
                  selectedCrewType?.notAvailable ||
                  getTotalCost() > safeGold ||
                  getTotalRice() > safeRice
                }
                style={{
                  opacity:
                    selectedCrewType?.notAvailable || getTotalCost() > safeGold || getTotalRice() > safeRice
                      ? 0.5
                      : 1,
                  cursor:
                    selectedCrewType?.notAvailable || getTotalCost() > safeGold || getTotalRice() > safeRice
                      ? 'not-allowed'
                      : 'pointer',
                  backgroundColor:
                    selectedCrewType?.notAvailable || getTotalCost() > safeGold || getTotalRice() > safeRice
                      ? '#666'
                      : undefined
                }}
               >
                {commandName}
              </button>
              {selectedCrewType && getTotalCost() > safeGold && (
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#ff6b6b', textAlign: 'center' }}>
                  ⚠️ 자금이 부족합니다 (필요: {formatNumber(getTotalCost())}금, 보유: {formatNumber(safeGold)}금)
                </div>
              )}
              {selectedCrewType && getTotalRice() > safeRice && (
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#ff6b6b', textAlign: 'center' }}>
                  ⚠️ 군량이 부족합니다 (필요: {formatNumber(getTotalRice())}미, 보유: {formatNumber(safeRice)}미)
                </div>
              )}
               {selectedCrewType?.notAvailable && (

                <div style={{ marginTop: '10px', fontSize: '14px', color: '#ff6b6b', textAlign: 'center' }}>
                  ⚠️ 이 병종은 현재 징병할 수 없습니다
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
