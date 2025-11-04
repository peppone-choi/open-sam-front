'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectNation from '@/components/processing/SelectNation';
import MapViewer from '@/components/game/MapViewer';
import { SammoAPI } from '@/lib/api/sammo';
import type { ProcNationItem } from '@/components/processing/SelectGeneral';
import type { GetMapResponse } from '@/lib/api/sammo';
import styles from './CommandForm.module.css';

interface CommandTypeInfo {
  name: string;
  remainTurn: number;
}

interface PiJangPaJangCommandFormProps {
  commandName: string;
  serverID?: string;
  nations: ProcNationItem[];
  delayCnt: number;
  postReqTurn: number;
  availableCommandTypeList: Record<string, CommandTypeInfo>;
  mapData?: GetMapResponse;
  onSubmit: (args: { destNationID: number; commandType: string }) => void;
  onCancel: () => void;
}

export default function PiJangPaJangCommandForm({
  commandName,
  serverID,
  nations: nationsArray,
  delayCnt,
  postReqTurn,
  availableCommandTypeList,
  mapData,
  onSubmit,
  onCancel
}: PiJangPaJangCommandFormProps) {
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
  const [selectedCommandID, setSelectedCommandID] = useState<string>(
    Object.keys(availableCommandTypeList)[0] || ''
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

    if (!selectedCommandID) {
      alert('전략을 선택해주세요.');
      return;
    }

    onSubmit({
      destNationID: selectedNationID,
      commandType: selectedCommandID,
    });
  };

  const selectedCommand = availableCommandTypeList[selectedCommandID];
  const isCommandDisabled = selectedCommand?.remainTurn > 0;

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
          선택된 국가에 피장파장을 발동합니다.
          <br />
          지정한 전략을 상대국이 {delayCnt}턴 동안 사용할 수 없게됩니다.
          <br />
          대신 아국은 지정한 전략을 {postReqTurn}턴 동안 사용할 수 없습니다.
          <br />
          선포, 전쟁중인 상대국에만 가능합니다.
          <br />
          상대 국가를 목록에서 선택하세요.
          <br />
          현재 피장파장이 불가능한 국가는 <span style={{ color: 'red' }}>붉은색</span>으로 표시됩니다.
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
            <label>전략:</label>
            <select
              className={styles.select}
              value={selectedCommandID}
              onChange={(e) => setSelectedCommandID(e.target.value)}
              style={{
                color: isCommandDisabled ? 'red' : undefined,
              }}
            >
              {Object.entries(availableCommandTypeList).map(([commandRawName, command]) => (
                <option
                  key={commandRawName}
                  value={commandRawName}
                  style={{
                    color: command.remainTurn > 0 ? 'red' : 'black',
                  }}
                >
                  {command.name} {command.remainTurn > 0 ? `(불가, ${command.remainTurn}턴)` : ''}
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
      </div>
    </div>
  );
}

