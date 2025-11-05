'use client';

import React, { useState, useMemo, useEffect } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';
import crewStyles from './ConscriptCommandForm.module.css';

interface CrewTypeItem {
  id: number;
  reqTech: number;
  reqYear: number;
  notAvailable?: boolean;
  baseRice: number;
  baseCost: number;
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
  onSubmit: (args: { crewType: number; amount: number }) => void;
  onCancel: () => void;
}

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
  onSubmit,
  onCancel
}: ConscriptCommandFormProps) {
  const [selectedCrewType, setSelectedCrewType] = useState<CrewTypeItem | null>(null);
  const [amount, setAmount] = useState(1);

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

  // 현재 병종으로 초기화
  useEffect(() => {
    if (crewTypeMap.has(currentCrewType)) {
      const currentType = crewTypeMap.get(currentCrewType)!;
      setSelectedCrewType(currentType);
      // 현재 병종과 같으면 채울 수 있는 만큼, 다르면 통솔력만큼
      if (currentType.id === currentCrewType) {
        setAmount(Math.max(1, fullLeadership - Math.floor(crew / 100)));
      } else {
        setAmount(fullLeadership);
      }
    } else if (crewTypeMap.size > 0) {
      // 첫 번째 병종 선택
      const firstType = Array.from(crewTypeMap.values())[0];
      setSelectedCrewType(firstType);
      setAmount(fullLeadership);
    }
  }, [crewTypeMap, currentCrewType, crew, fullLeadership]);

  const handleAmountChange = (newAmount: number) => {
    setAmount(Math.max(1, Math.min(newAmount, Math.floor(fullLeadership * 1.2))));
  };

  const beHalf = () => {
    setAmount(Math.ceil(fullLeadership * 0.5));
  };

  const beFilled = () => {
    if (selectedCrewType && selectedCrewType.id === currentCrewType) {
      setAmount(Math.max(1, fullLeadership - Math.floor(crew / 100)));
    } else {
      setAmount(fullLeadership);
    }
  };

  const beFull = () => {
    setAmount(Math.floor(fullLeadership * 1.2));
  };

  const handleSubmit = () => {
    if (!selectedCrewType) {
      alert('병종을 선택해주세요.');
      return;
    }
    if (selectedCrewType.notAvailable) {
      alert('선택한 병종은 현재 사용할 수 없습니다.');
      return;
    }
    if (amount < 1) {
      alert('병력은 1명 이상이어야 합니다.');
      return;
    }
    
    const totalCost = Math.ceil(amount * selectedCrewType.baseCost * goldCoeff);
    if (totalCost > gold) {
      alert(`자금이 부족합니다. 필요: ${totalCost.toLocaleString()}금, 보유: ${gold.toLocaleString()}금`);
      return;
    }

    onSubmit({
      crewType: selectedCrewType.id,
      amount: amount * 100 // 100명 단위로 변환
    });
  };

  const getTotalCost = () => {
    if (!selectedCrewType) return 0;
    return Math.ceil(amount * selectedCrewType.baseCost * goldCoeff);
  };

  const getTotalRice = () => {
    if (!selectedCrewType) return 0;
    return Math.ceil(amount * selectedCrewType.baseRice);
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
            현재 병력: {crew}명 | 자금: {gold.toLocaleString()}금
          </div>
        </div>

        {/* 병종 계열별 선택 */}
        <div className={crewStyles.armTypeList}>
          {armCrewTypes.map((armType) => (
            <div key={armType.armType} className={crewStyles.armTypeGroup}>
              <h3 className={crewStyles.armTypeTitle}>{armType.armName}</h3>
              <div className={crewStyles.crewTypeGrid}>
                {armType.values.map((crewType) => (
                  <div
                    key={crewType.id}
                    className={`${crewStyles.crewTypeItem} ${
                      selectedCrewType?.id === crewType.id ? crewStyles.selected : ''
                    } ${crewType.notAvailable ? crewStyles.notAvailable : ''}`}
                    onClick={() => {
                      if (!crewType.notAvailable) {
                        setSelectedCrewType(crewType);
                        if (crewType.id === currentCrewType) {
                          setAmount(Math.max(1, fullLeadership - Math.floor(crew / 100)));
                        } else {
                          setAmount(fullLeadership);
                        }
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
                  max={Math.floor(fullLeadership * 1.2)}
                  value={amount}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className={styles.textInput}
                />
                <span>00명</span>
              </div>

              <div className={crewStyles.costDisplay}>
                <div>
                  총 비용: <strong>{getTotalCost().toLocaleString()}금</strong>
                </div>
                <div>
                  총 군량: <strong>{getTotalRice().toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className={crewStyles.submitSection}>
              <button
                type="button"
                onClick={handleSubmit}
                className={styles.submitButton}
                disabled={selectedCrewType.notAvailable || getTotalCost() > gold}
              >
                {commandName}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



