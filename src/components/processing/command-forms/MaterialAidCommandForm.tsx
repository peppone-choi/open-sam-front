'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectNation from '@/components/processing/SelectNation';
import SelectAmount from '@/components/processing/SelectAmount';
import MapViewer from '@/components/game/MapViewer';
import { SammoAPI } from '@/lib/api/sammo';
import type { ProcNationItem } from '@/components/processing/SelectGeneral';
import type { GetMapResponse } from '@/lib/api/sammo';
import styles from './CommandForm.module.css';

interface LevelInfo {
  text: string;
  amount: number;
}

interface MaterialAidCommandFormProps {
  commandName: string;
  serverID?: string;
  nations: ProcNationItem[];
  currentNationLevel: number;
  levelInfo: Record<number, LevelInfo>;
  minAmount: number;
  maxAmount: number;
  amountGuide: number[];
  mapData?: GetMapResponse;
  onSubmit: (args: { amountList: [number, number]; destNationID: number }) => void;
  onCancel: () => void;
}

export default function MaterialAidCommandForm({
  commandName,
  serverID,
  nations: nationsArray,
  currentNationLevel,
  levelInfo,
  minAmount,
  maxAmount,
  amountGuide,
  mapData,
  onSubmit,
  onCancel
}: MaterialAidCommandFormProps) {
  const nationsMap = useMemo(() => {
    const map = new Map<number, ProcNationItem>();
    for (const nation of nationsArray) {
      map.set(nation.id, nation);
    }
    return map;
  }, [nationsArray]);

  const [selectedNationID, setSelectedNationID] = useState<number>(
    nationsArray.length > 0 ? nationsArray[0].id : 0
  );
  const [goldAmount, setGoldAmount] = useState(minAmount);
  const [riceAmount, setRiceAmount] = useState(minAmount);
  const [map, setMap] = useState<GetMapResponse | null>(mapData || null);

  useEffect(() => {
    if (mapData) {
      setMap(mapData);
    } else if (!map && serverID) {
      SammoAPI.GlobalGetMap({ serverID, neutralView: 0, showMe: 1 })
        .then((data) => {
          if (data.success && data.result) {
            setMap(data);
          }
        })
        .catch((error) => console.error('Failed to load map:', error));
    }
  }, [map, mapData, serverID]);

  const handleSubmit = () => {
    if (!selectedNationID) {
      alert('국가를 선택해주세요.');
      return;
    }

    onSubmit({
      amountList: [goldAmount, riceAmount],
      destNationID: selectedNationID,
    });
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        {map && serverID && (
          <div className={styles.mapContainer}>
            <MapViewer
              mapData={map}
              serverID={serverID}
              onCityClick={(cityId) => {
                // 도시 클릭 시 해당 도시의 국가 찾기
                if (map.cityList && map.nationList) {
                  const cityData = map.cityList.find((city: number[]) => city[0] === cityId);
                  if (cityData && cityData.length >= 4) {
                    const nationID = cityData[3]; // [city, level, state, nation, ...]
                    if (nationID > 0 && nationsMap.has(nationID)) {
                      setSelectedNationID(nationID);
                    }
                  }
                }
              }}
            />
          </div>
        )}

        <div className={styles.description}>
          타국에게 원조합니다.
          <br />
          작위별로 금액 제한이 있습니다.
          <br />
          <ul className={styles.levelInfoList}>
            {Object.entries(levelInfo).map(([level, info]) => (
              <li key={level}>
                <span
                  style={{
                    width: '4em',
                    display: 'inline-block',
                    ...(Number(level) !== currentNationLevel
                      ? {}
                      : {
                          textDecoration: 'underline',
                          fontWeight: 'bold',
                        }),
                  }}
                >
                  {info.text}
                </span>
                : {info.amount.toLocaleString()}
              </li>
            ))}
          </ul>
          <br />
          원조할 국가를 목록에서 선택하세요.
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

          <div className={styles.formField}>
            <label>금:</label>
            <SelectAmount
              value={goldAmount}
              amountGuide={amountGuide}
              maxAmount={maxAmount}
              minAmount={minAmount}
              onChange={setGoldAmount}
            />
          </div>

          <div className={styles.formField}>
            <label>쌀:</label>
            <SelectAmount
              value={riceAmount}
              amountGuide={amountGuide}
              maxAmount={maxAmount}
              minAmount={minAmount}
              onChange={setRiceAmount}
            />
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
    </div>
  );
}

