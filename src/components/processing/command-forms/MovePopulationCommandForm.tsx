'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectCity from '@/components/processing/SelectCity';
import SelectAmount from '@/components/processing/SelectAmount';
import MapViewer from '@/components/game/MapViewer';
import { SammoAPI } from '@/lib/api/sammo';
import type { GetMapResponse } from '@/lib/api/sammo';
import styles from './CommandForm.module.css';

interface MovePopulationCommandFormProps {
  commandName: string;
  serverID?: string;
  cities: Array<[number, { name: string; info?: string }]>;
  currentCity?: number;
  minAmount: number;
  maxAmount: number;
  amountGuide: number[];
  mapData?: GetMapResponse;
  onSubmit: (args: { destCityID: number; amount: number }) => void;
  onCancel: () => void;
}

export default function MovePopulationCommandForm({
  commandName,
  serverID,
  cities: citiesArray,
  currentCity = 0,
  minAmount,
  maxAmount,
  amountGuide,
  mapData,
  onSubmit,
  onCancel
}: MovePopulationCommandFormProps) {
  const citiesMap = useMemo(() => {
    const map = new Map<number, { name: string; info?: string }>();
    for (const [id, data] of citiesArray) {
      map.set(id, data);
    }
    return map;
  }, [citiesArray]);

  const [selectedCityID, setSelectedCityID] = useState<number>(currentCity);
  const [amount, setAmount] = useState<number>(minAmount);
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
    if (!selectedCityID) {
      alert('도시를 선택해주세요.');
      return;
    }

    if (amount < minAmount || amount > maxAmount) {
      alert(`금액은 ${minAmount.toLocaleString()} ~ ${maxAmount.toLocaleString()} 사이여야 합니다.`);
      return;
    }

    onSubmit({
      destCityID: selectedCityID,
      amount,
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
                if (citiesMap.has(cityId)) {
                  setSelectedCityID(cityId);
                }
              }}
            />
          </div>
        )}

        <div className={styles.description}>
          현재 도시의 인구를 인접 도시로 이동합니다.
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>도시:</label>
            <SelectCity
              value={selectedCityID}
              cities={citiesMap}
              onChange={setSelectedCityID}
            />
          </div>

          <div className={styles.formField}>
            <label>금:</label>
            <SelectAmount
              value={amount}
              amountGuide={amountGuide}
              maxAmount={maxAmount}
              minAmount={minAmount}
              onChange={setAmount}
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

