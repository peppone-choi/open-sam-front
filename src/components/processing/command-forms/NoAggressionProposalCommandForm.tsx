'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectNation from '@/components/processing/SelectNation';
import MapViewer from '@/components/game/MapViewer';
import { SammoAPI } from '@/lib/api/sammo';
import type { ProcNationItem } from '@/components/processing/SelectGeneral';
import type { GetMapResponse } from '@/lib/api/sammo';
import styles from './CommandForm.module.css';

interface NoAggressionProposalCommandFormProps {
  commandName: string;
  serverID?: string;
  nations: ProcNationItem[];
  startYear: number;
  minYear: number;
  maxYear: number;
  month: number;
  mapData?: GetMapResponse;
  onSubmit: (args: { destNationID: number; year: number; month: number }) => void;
  onCancel: () => void;
}

export default function NoAggressionProposalCommandForm({
  commandName,
  serverID,
  nations: nationsArray,
  startYear,
  minYear,
  maxYear,
  month,
  mapData,
  onSubmit,
  onCancel
}: NoAggressionProposalCommandFormProps) {
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
  const [selectedYear, setSelectedYear] = useState<number>(minYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(month);
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
      destNationID: selectedNationID,
      year: selectedYear,
      month: selectedMonth,
    });
  };

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

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
                if (map.cityList && map.nationList) {
                  const cityData = map.cityList.find((city: number[]) => city[0] === cityId);
                  if (cityData && cityData.length >= 4) {
                    const nationID = cityData[3];
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
          타국에게 불가침을 제의합니다.
          <br />
          제의할 국가를 목록에서 선택하세요.
          <br />
          불가침 기한 다음 달부터 선포 가능합니다.
          <br />
          현재 제의가 불가능한 국가는 <span style={{ color: 'red' }}>붉은색</span>으로 표시됩니다.
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
            <label>기간:</label>
            <div className={styles.dateSelect}>
              <select
                className={styles.yearSelect}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className={styles.dateLabel}>년</span>
              <select
                className={styles.monthSelect}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className={styles.dateLabel}>월</span>
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
    </div>
  );
}

