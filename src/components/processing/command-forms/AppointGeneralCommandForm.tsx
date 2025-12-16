'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectGeneral from '@/components/processing/SelectGeneral';
import SelectCity from '@/components/processing/SelectCity';
import MapViewer from '@/components/game/MapViewer';
import { SammoAPI } from '@/lib/api/sammo';
import { getNPCColor } from '@/lib/utils/game/getNPCColor';
import type { GetMapResponse } from '@/lib/api/sammo';
import type { ProcGeneralItem } from '@/components/processing/SelectGeneral';
import styles from './CommandForm.module.css';

interface AppointGeneralCommandFormProps {
  commandName: string;
  serverID?: string;
  generals: ProcGeneralItem[];
  cities: Array<[number, { name: string; info?: string }]>;
  troops?: Record<number, { troop_leader: number; nation: number; name: string }>;
  currentCity?: number;
  mapData?: GetMapResponse;
  onSubmit: (args: { destCityID: number; destGeneralID: number }) => void;
  onCancel: () => void;
}

export default function AppointGeneralCommandForm({
  commandName,
  serverID,
  generals,
  cities: citiesArray,
  troops = {},
  currentCity = 0,
  mapData,
  onSubmit,
  onCancel
}: AppointGeneralCommandFormProps) {
  const citiesMap = useMemo(() => {
    const map = new Map<number, { name: string; info?: string }>();
    for (const [id, data] of citiesArray) {
      map.set(id, data);
    }
    return map;
  }, [citiesArray]);

  const [selectedGeneralID, setSelectedGeneralID] = useState<number>(
    generals.length > 0 ? generals[0].no : 0
  );
  const [selectedCityID, setSelectedCityID] = useState<number>(currentCity);
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
    if (!selectedGeneralID) {
      alert('장수를 선택해주세요.');
      return;
    }

    if (!selectedCityID) {
      alert('도시를 선택해주세요.');
      return;
    }

    onSubmit({
      destCityID: selectedCityID,
      destGeneralID: selectedGeneralID,
    });
  };

  const textHelper = (gen: ProcGeneralItem): string => {
    const troopInfo = gen.troopID && troops[gen.troopID];
    const troopName = troopInfo ? troopInfo.name : '';
    const troopText = troopName
      ? gen.no === gen.troopID
        ? `,<span style="text-decoration: underline;">${troopName}</span>`
        : `,${troopName}`
      : '';

    const nameColor = getNPCColor(gen.npc);
    const name = nameColor
      ? `<span style="color:${nameColor}">${gen.name}</span>`
      : gen.name;

    const cityName = citiesMap.get(gen.cityID || 0)?.name || '';

    return `${name} [${cityName}${troopText}] (${gen.leadership}/${gen.strength}/${gen.intel}/${gen.politics}/${gen.charm}) <병${(gen.crew || 0).toLocaleString()}/훈${gen.train}/사${gen.atmos}>`;
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
                // 도시 클릭 시 해당 도시 선택
                if (citiesMap.has(cityId)) {
                  setSelectedCityID(cityId);
                }
              }}
            />
          </div>
        )}

        <div className={styles.description}>
          선택된 도시로 아국 장수를 발령합니다.
          <br />
          아국 도시로만 발령이 가능합니다.
          <br />
          목록을 선택하거나 도시를 클릭하세요.
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>장수:</label>
            <SelectGeneral
              value={selectedGeneralID}
              generals={generals}
              textHelper={textHelper}
              troops={troops}
              onChange={setSelectedGeneralID}
            />
          </div>

          <div className={styles.formField}>
            <label>도시:</label>
            <SelectCity
              value={selectedCityID}
              cities={citiesMap}
              onChange={setSelectedCityID}
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

