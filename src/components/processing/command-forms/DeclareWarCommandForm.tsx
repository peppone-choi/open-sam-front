'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectNation from '@/components/processing/SelectNation';
import MapViewer from '@/components/game/MapViewer';
import { SammoAPI } from '@/lib/api/sammo';
import type { ProcNationItem } from '@/components/processing/SelectGeneral';
import type { GetMapResponse } from '@/lib/api/sammo';
import styles from './CommandForm.module.css';

interface DeclareWarCommandFormProps {
  commandName: string;
  serverID?: string;
  nations: ProcNationItem[];
  mapData?: GetMapResponse;
  onSubmit: (args: { destNationID: number }) => void;
  onCancel: () => void;
}

export default function DeclareWarCommandForm({
  commandName,
  serverID,
  nations: nationsArray,
  mapData,
  onSubmit,
  onCancel
}: DeclareWarCommandFormProps) {
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
          타국에게 선전포고를 합니다.
          <br />
          선전포고할 국가를 목록에서 선택하세요.
          <br />
          현재 선전포고가 불가능한 국가는 <span style={{ color: 'red' }}>붉은색</span>으로 표시됩니다.
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>국가:</label>
            <SelectNation
              value={selectedNationID}
              nations={nationsMap}
              onChange={setSelectedNationID}
              searchable={false}
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

