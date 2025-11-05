'use client';

import React, { useState, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface DexInfo {
  amount: number;
  color: string;
  name: string;
}

interface OwnDexItem {
  armType: number;
  name: string;
  amount: number;
}

interface DexFullInfo {
  armType: number;
  name: string;
  amount: number;
  decreasedAmount: number;
  currentInfo: DexInfo;
  decreasedInfo: DexInfo;
  afterInfo: Map<number, DexInfo>;
}

interface ConvertMasteryCommandFormProps {
  commandName: string;
  ownDexList: OwnDexItem[];
  dexLevelList: DexInfo[];
  decreaseCoeff: number;
  convertCoeff: number;
  onSubmit: (args: { srcArmType: number; destArmType: number }) => void;
  onCancel: () => void;
}

export default function ConvertMasteryCommandForm({
  commandName,
  ownDexList,
  dexLevelList,
  decreaseCoeff,
  convertCoeff,
  onSubmit,
  onCancel
}: ConvertMasteryCommandFormProps) {
  // getDexCall 함수: 숙련도 값에 해당하는 등급 정보 반환
  const getDexCall = (dex: number): { color: string; name: string } => {
    if (dex < 0) {
      throw new Error(`올바르지 않은 수치: ${dex}`);
    }

    let color = '';
    let name = '';
    for (const nextDexLevel of dexLevelList) {
      if (dex < nextDexLevel.amount) {
        break;
      }
      color = nextDexLevel.color;
      name = nextDexLevel.name;
    }

    return { color, name };
  };

  // dexFullInfo 계산
  const dexFullInfo = useMemo(() => {
    const map = new Map<number, DexFullInfo>();

    // 각 병종별 현재 정보 계산
    for (const dexItem of ownDexList) {
      const amount = dexItem.amount;
      const currentInfo = { ...getDexCall(amount), amount };

      const decreasedAmount = amount * decreaseCoeff;
      const decreasedAfterAmount = amount - decreasedAmount;
      const decreasedInfo = {
        ...getDexCall(decreasedAfterAmount),
        amount: decreasedAfterAmount,
      };

      map.set(dexItem.armType, {
        ...dexItem,
        decreasedAmount,
        currentInfo,
        decreasedInfo,
        afterInfo: new Map(),
      });
    }

    // 전환 후 정보 계산
    for (const [armType, dexItem] of map.entries()) {
      for (const [fromArmType, fromDexItem] of map.entries()) {
        let afterAmount = fromDexItem.decreasedAmount * convertCoeff;
        if (armType !== fromArmType) {
          afterAmount += dexItem.amount;
        } else {
          afterAmount += dexItem.decreasedAmount;
        }

        dexItem.afterInfo.set(fromArmType, {
          amount: afterAmount,
          ...getDexCall(afterAmount),
        });
      }
    }

    return map;
  }, [ownDexList, dexLevelList, decreaseCoeff, convertCoeff]);

  const [srcArmTypeID, setSrcArmTypeID] = useState<number>(
    ownDexList.length > 0 ? ownDexList[0].armType : 0
  );
  const [destArmTypeID, setDestArmTypeID] = useState<number>(
    ownDexList.length > 0 ? ownDexList[0].armType : 0
  );

  const handleSubmit = () => {
    onSubmit({
      srcArmType: srcArmTypeID,
      destArmType: destArmTypeID,
    });
  };

  const formatNumber = (value: number): string => {
    return Math.floor(value).toLocaleString();
  };

  const srcDexInfo = dexFullInfo.get(srcArmTypeID);
  const destDexInfo = dexFullInfo.get(destArmTypeID);

  if (!srcDexInfo || !destDexInfo) {
    return (
      <div className={styles.container}>
        <TopBackBar title={commandName} onBack={onCancel} />
        <div className={styles.content}>
          <div className={styles.description}>데이터를 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          본인의 특정 병종 숙련을 40% 줄이고, 줄어든 숙련 중 9/10(90%p)를 다른 병종 숙련으로 전환합니다.
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>감소 대상 숙련:</label>
            <select
              className={styles.selectInput}
              value={srcArmTypeID}
              onChange={(e) => setSrcArmTypeID(Number(e.target.value))}
            >
              {Array.from(dexFullInfo.entries()).map(([armType, dexInfo]) => (
                <option key={armType} value={armType}>
                  {dexInfo.name} (
                  <span style={{ color: dexInfo.currentInfo.color }}>
                    {dexInfo.currentInfo.name}
                  </span>
                  )
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label>전환 대상 숙련:</label>
            <select
              className={styles.selectInput}
              value={destArmTypeID}
              onChange={(e) => setDestArmTypeID(Number(e.target.value))}
            >
              {Array.from(dexFullInfo.entries()).map(([armType, dexInfo]) => (
                <option key={armType} value={armType}>
                  {dexInfo.name} (
                  <span style={{ color: dexInfo.currentInfo.color }}>
                    {dexInfo.currentInfo.name}
                  </span>
                  )
                </option>
              ))}
            </select>
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

        {/* 감소 대상 숙련 변화 표시 */}
        <div className={styles.dexChangeInfo}>
          <div className={styles.dexChangeRow}>
            <div className={styles.dexChangeLabel}>{srcDexInfo.name}</div>
            <div className={styles.dexChangeValue}>
              [
              <span style={{ color: srcDexInfo.currentInfo.color }}>
                {srcDexInfo.currentInfo.name}
              </span>
              <span className={styles.dexAmount}>
                {formatNumber(srcDexInfo.currentInfo.amount)}
              </span>
              ]
            </div>
            <div className={styles.dexChangeArrow}>→</div>
            <div className={styles.dexChangeValue}>
              [
              <span style={{ color: srcDexInfo.decreasedInfo.color }}>
                {srcDexInfo.decreasedInfo.name}
              </span>
              <span className={styles.dexAmount}>
                {formatNumber(srcDexInfo.decreasedInfo.amount)}
              </span>
              ]
            </div>
          </div>

          {/* 전환 대상 숙련 변화 표시 */}
          <div className={styles.dexChangeRow}>
            <div className={styles.dexChangeLabel}>{destDexInfo.name}</div>
            <div className={styles.dexChangeValue}>
              [
              {srcArmTypeID === destArmTypeID ? (
                <>
                  <span style={{ color: destDexInfo.decreasedInfo.color }}>
                    {destDexInfo.decreasedInfo.name}
                  </span>
                  <span className={styles.dexAmount}>
                    {formatNumber(destDexInfo.decreasedInfo.amount)}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ color: destDexInfo.currentInfo.color }}>
                    {destDexInfo.currentInfo.name}
                  </span>
                  <span className={styles.dexAmount}>
                    {formatNumber(destDexInfo.currentInfo.amount)}
                  </span>
                </>
              )}
              ]
            </div>
            <div className={styles.dexChangeArrow}>→</div>
            <div className={styles.dexChangeValue}>
              [
              {destDexInfo.afterInfo.has(srcArmTypeID) && (
                <>
                  <span
                    style={{
                      color: destDexInfo.afterInfo.get(srcArmTypeID)!.color,
                    }}
                  >
                    {destDexInfo.afterInfo.get(srcArmTypeID)!.name}
                  </span>
                  <span className={styles.dexAmount}>
                    {formatNumber(destDexInfo.afterInfo.get(srcArmTypeID)!.amount)}
                  </span>
                </>
              )}
              ]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

