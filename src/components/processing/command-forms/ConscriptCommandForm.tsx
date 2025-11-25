'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';

import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';
import crewStyles from './ConscriptCommandForm.module.css';
import { getCrewTypeDisplayName } from '@/utils/unitTypeMapping';
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

interface UnitStackItem {
  id: string;
  crewTypeId: number;
  crewTypeName?: string;
  unitSize?: number;
  stackCount?: number;
  troops: number;
  train: number;
  morale: number;
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
  unitStacks?: {
    totalTroops?: number;
    stackCount?: number;
    stacks: UnitStackItem[];
  } | null;
  cityStacks?: {
    totalTroops?: number;
    stackCount?: number;
    stacks: UnitStackItem[];
  } | null;
  onSubmit: (args: { crewType: number; amount: number; targetStackId?: string; targetType?: 'general' | 'city' }) => void;
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
  relYear,
  year,
  tech,
  techLevel,
  startYear,
  goldCoeff,
  leadership,
  fullLeadership,
  armCrewTypes,
  currentCrewType,
  crew,
  gold,
  rice,
  unitStacks,
  cityStacks,
  onSubmit,
  onCancel
}: ConscriptCommandFormProps) {
  const [selectedCrewType, setSelectedCrewType] = useState<CrewTypeItem | null>(null);
  const [amount, setAmount] = useState(1);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [targetType, setTargetType] = useState<'general' | 'city'>('general');
  const [targetStackId, setTargetStackId] = useState<string>('new');
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

  const resolveStackTroops = useCallback((stack?: UnitStackItem): number => {
    if (!stack) return 0;
    const troops = parseFiniteNumber(stack.troops);
    if (troops > 0) {
      return troops;
    }
    const unitSize = parseFiniteNumber(stack.unitSize);
    const stackCount = parseFiniteNumber(stack.stackCount);
    return unitSize * stackCount;
  }, []);

  const resolveGeneralTroops = useCallback((): number => {
    if (unitStacks) {
      const total = parseFiniteNumber(unitStacks.totalTroops);
      if (total > 0) {
        return total;
      }
    }
    return safeCrew;
  }, [unitStacks, safeCrew]);

  const currentGeneralTroops = useMemo(() => resolveGeneralTroops(), [resolveGeneralTroops]);

  const getCostPerHundred = useCallback((crewType: CrewTypeItem | null): number => {
    if (!crewType) {
      return 0;
    }
    // PHP/백엔드 징병 비용과 최대한 일치시키기 위해,
    // onCalcDomestic까지 반영된 effectiveCostPerHundred가 있으면 우선 사용한다.
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

  const getMaxRecruitable = useCallback((crewType: CrewTypeItem | null): number => {
    if (!crewType) {
      return 0;
    }
    
    // 도시 주둔군으로 징병할 때는 통솔력 제한을 받지 않음 (또는 매우 높게 설정)
    // 하지만 여기서는 일단 장수의 통솔력을 기준으로 제한을 둠 (모병 개념)
    // 만약 순수 징병(도시 인구 -> 주둔군)이라면 통솔력 제한이 없어야 함
    // 하지만 현재 시스템상 '징병' 커맨드는 장수가 실행하는 것이므로 통솔력 제한을 두는 것이 안전함
    const leadershipLimit = Math.max(100, Math.floor(fullLeadership * 100));
    
    if (targetType === 'city') {
      // 도시 주둔군은 통솔력 제한 없음 (자금/군량/인구 제한만 받음)
      return 999999; 
    }

    // 기존 스택에 추가하는 경우
    if (targetStackId !== 'new') {
      const stacks = targetType === 'general' ? unitStacks?.stacks : cityStacks?.stacks;
      const stack = stacks?.find((s) => s.id === targetStackId);
      if (stack) {
        const currentTotalTroops = resolveGeneralTroops();
        return Math.max(0, leadershipLimit - currentTotalTroops);
      }
    }

    // 신규 스택인 경우
    const currentTotalTroops = resolveGeneralTroops();
    return Math.max(0, leadershipLimit - currentTotalTroops);
  }, [fullLeadership, resolveGeneralTroops, targetStackId, targetType, cityStacks]);

  const actualCrew = useMemo(() => {
    if (!selectedCrewType) {
      return 0;
    }
    const maxRecruitable = getMaxRecruitable(selectedCrewType);
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

  const getSelectableForType = useCallback((crewType: CrewTypeItem): number => {
    const maxRecruitable = getMaxRecruitable(crewType);
    // 도시 주둔군일 때는 통솔력 * 1.2 제한을 무시하고 넉넉하게
    const limit = targetType === 'city' ? 9999 : Math.floor(fullLeadership * 1.2);
    return Math.max(1, Math.min(Math.ceil(maxRecruitable / 100), limit));
  }, [fullLeadership, getMaxRecruitable, targetType]);

  // 초기화 및 스택 변경 시 처리
  useEffect(() => {
    if (targetStackId !== 'new') {
      // 기존 스택 선택 시 해당 병종으로 고정
      const stacks = targetType === 'general' ? unitStacks?.stacks : cityStacks?.stacks;
      const stack = stacks?.find(s => s.id === targetStackId);
      
      if (stack && crewTypeMap.has(stack.crewTypeId)) {
        const fixedType = crewTypeMap.get(stack.crewTypeId)!;
        setSelectedCrewType(fixedType);
        
        // 수량 재계산
        const maxSelectable = getSelectableForType(fixedType);
        const costPerHundred = getCostPerHundred(fixedType) * goldCoeff;
        const maxAffordable = Math.floor(safeGold / Math.max(1, costPerHundred));
        setAmount(Math.min(maxSelectable, maxAffordable));
      }
    } else {
      // 신규 스택일 때, 현재 선택된 병종이 없으면 기본값 설정
      if (!selectedCrewType && crewTypeMap.size > 0) {
        const firstType = Array.from(crewTypeMap.values())[0];
        setSelectedCrewType(firstType);
      }
    }
  }, [targetStackId, targetType, unitStacks, cityStacks, crewTypeMap, safeGold, goldCoeff, getCostPerHundred, getSelectableForType]);

  // 타겟 타입 변경 시 스택 ID 초기화
  useEffect(() => {
    setTargetStackId('new');
  }, [targetType]);

  const getMaxSelectableAmount = useCallback(() => {
    if (selectedCrewType) {
      return getSelectableForType(selectedCrewType);
    }
    return targetType === 'city' ? 9999 : Math.floor(fullLeadership * 1.2);
  }, [fullLeadership, getSelectableForType, selectedCrewType, targetType]);

  const handleAmountChange = (newAmount: number) => {
    const maxSelectable = getMaxSelectableAmount();
    setAmount(Math.max(1, Math.min(newAmount, maxSelectable)));
  };

  const beHalf = () => {
    const maxSelectable = getMaxSelectableAmount();
    setAmount(Math.min(Math.ceil(maxSelectable * 0.5), maxSelectable));
  };

  const beFilled = () => {
    const maxSelectable = getMaxSelectableAmount();
    
    if (targetType === 'city') {
      setAmount(maxSelectable);
      return;
    }

    // 남은 통솔력만큼 채우기
    const currentTotalTroops = resolveGeneralTroops();
    const leadershipLimit = Math.max(100, Math.floor(fullLeadership * 100));
    const remain = Math.max(0, leadershipLimit - currentTotalTroops);
    const desired = Math.ceil(remain / 100);
    
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
      amount: actualCrew,
      targetStackId: targetStackId === 'new' ? undefined : targetStackId,
      targetType
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

  const currentStacks = targetType === 'general' ? unitStacks : cityStacks;

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
            현재 병력: {formatNumber(currentGeneralTroops)}명 | 자금: {formatNumber(safeGold)}금 | 군량: {formatNumber(safeRice)}미
          </div>
        </div>

        {/* 타겟 타입 선택 (탭) */}
        <div className={crewStyles.targetTypeTabs} style={{ display: 'flex', marginBottom: '1rem', borderBottom: '1px solid #ddd' }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.75rem',
              background: targetType === 'general' ? '#f0f0f0' : 'transparent',
              border: 'none',
              borderBottom: targetType === 'general' ? '2px solid #333' : 'none',
              fontWeight: targetType === 'general' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
            onClick={() => setTargetType('general')}
          >
            내 부대 (모병)
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.75rem',
              background: targetType === 'city' ? '#f0f0f0' : 'transparent',
              border: 'none',
              borderBottom: targetType === 'city' ? '2px solid #333' : 'none',
              fontWeight: targetType === 'city' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
            onClick={() => setTargetType('city')}
          >
            도시 주둔군 (징병)
          </button>
        </div>

        {/* 스택 선택 섹션 */}
        <div className={styles.formRow} style={{ marginBottom: '1rem' }}>
          <div className={styles.formField}>
            <label>대상 부대:</label>
            <select 
              value={targetStackId} 
              onChange={(e) => setTargetStackId(e.target.value)}
              className={styles.selectInput}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="new">➕ 신규 부대 창설</option>
              {currentStacks?.stacks?.map((stack) => {
                const stackTroops = resolveStackTroops(stack);
                return (
                  <option key={stack.id} value={stack.id}>
                    {getCrewTypeDisplayName(stack.crewTypeId, stack.crewTypeName)} ({formatNumber(stackTroops)}명)
                  </option>
                );
              })}
            </select>
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

        {/* 병종 계열별 선택 - 신규 부대일 때만 선택 가능 */}
        {targetStackId === 'new' ? (
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
        ) : (
          <div className={styles.description} style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            기존 부대에 병력을 충원합니다. 병종은 변경할 수 없습니다.<br/>
            <strong>{selectedCrewType?.name}</strong>
          </div>
        )}

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
