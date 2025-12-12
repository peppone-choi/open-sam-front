'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectNation from '@/components/processing/SelectNation';
import MapViewer from '@/components/game/MapViewer';
import { SammoAPI } from '@/lib/api/sammo';
import type { ProcNationItem } from '@/components/processing/SelectGeneral';
import type { GetMapResponse } from '@/lib/api/sammo';
import styles from './CommandForm.module.css';

interface NationTargetCommandFormProps {
  commandName: string;
  serverID?: string;
  nations: ProcNationItem[];
  mapData?: GetMapResponse;
  onSubmit: (args: { destNationID: number }) => void;
  onCancel: () => void;
}

export default function NationTargetCommandForm({
  commandName,
  serverID,
  nations: nationsArray,
  mapData,
  onSubmit,
  onCancel
}: NationTargetCommandFormProps) {
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

  const getDescription = () => {
    if (commandName === '급습') {
      return '선택된 국가에 급습을 발동합니다.\n선포, 전쟁중인 상대국에만 가능합니다.\n상대 국가를 목록에서 선택하세요.\n현재 급습이 불가능한 국가는 붉은색으로 표시됩니다.';
    } else if (commandName === '불가침파기제의' || commandName === '불가침 파기 제의') {
      return '불가침중인 국가에 조약 파기를 제의합니다.\n제의할 국가를 목록에서 선택하세요.\n현재 제의가 불가능한 국가는 붉은색으로 표시됩니다.';
    } else if (commandName === '이호경식') {
      return '선택된 국가에 이호경식을 발동합니다.\n선포, 전쟁중인 상대국에만 가능합니다.\n상대 국가를 목록에서 선택하세요.\n현재 이호경식이 불가능한 국가는 붉은색으로 표시됩니다.';
    } else if (commandName === '종전제의' || commandName === '종전 제의') {
      return '전쟁중인 국가에 종전을 제의합니다.\n제의할 국가를 목록에서 선택하세요.\n현재 제의가 불가능한 국가는 붉은색으로 표시됩니다.';
    } else if (commandName === '선전포고') {
      return '타국에게 선전 포고합니다.\n선전 포고할 국가를 목록에서 선택하세요.\n고립되지 않은 아국 도시에서 인접한 국가에 선포 가능합니다.\n현재 선포가 불가능한 국가는 붉은색으로 표시됩니다.';
    }
    return '국가를 선택하세요.';
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
          {getDescription().split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))}
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

