'use client';

import React, { useState, useEffect } from 'react';
import SelectCity from '../SelectCity';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface CityItem {
  name: string;
  info?: string;
}

interface MoveCommandFormProps {
  commandName: string;
  cities: Map<number, CityItem>;
  currentCity: number;
  distanceList?: Record<number, number[]>;
  mapData?: GetMapResponse;
  serverID?: string;
  onSubmit: (args: { destCityID: number }) => void;
  onCancel: () => void;
}

export default function MoveCommandForm({
  commandName,
  cities,
  currentCity,
  distanceList,
  mapData,
  serverID: propServerID,
  onSubmit,
  onCancel
}: MoveCommandFormProps) {
  const params = useParams();
  const serverID = propServerID || (params?.server as string) || '';
  const [selectedCityID, setSelectedCityID] = useState<number>(currentCity);
  const [mapDataState, setMapDataState] = useState<GetMapResponse | null>(mapData || null);
  const [loadingMap, setLoadingMap] = useState(!mapData);

  // 맵 데이터 로드
  useEffect(() => {
    if (!mapData && serverID) {
      loadMapData();
    }
  }, [mapData, serverID]);

  async function loadMapData() {
    try {
      setLoadingMap(true);
      const result = await SammoAPI.GetMap({ serverID });
      if (result.result && result.cityList) {
        setMapDataState(result);
      }
    } catch (err) {
      console.error('맵 데이터 로드 실패:', err);
    } finally {
      setLoadingMap(false);
    }
  }

  function handleCityClick(cityId: number) {
    if (cityId !== currentCity) {
      setSelectedCityID(cityId);
    }
  }

  const handleSubmit = () => {
    if (selectedCityID === 0 || selectedCityID === currentCity) {
      alert('다른 도시를 선택해주세요.');
      return;
    }
    onSubmit({ destCityID: selectedCityID });
  };

  const getDescription = () => {
    if (commandName === '강행') {
      return '선택된 도시로 강행합니다.\n최대 3칸내 도시로만 강행이 가능합니다.\n목록을 선택하거나 도시를 클릭하세요.';
    } else if (commandName === '이동') {
      return '선택된 도시로 이동합니다.\n인접 도시로만 이동이 가능합니다.\n목록을 선택하거나 도시를 클릭하세요.';
    } else if (commandName === '출병') {
      return '선택된 도시를 향해 침공을 합니다.\n침공 경로에 적군의 도시가 있다면 전투를 벌입니다.\n목록을 선택하거나 도시를 클릭하세요.';
    } else if (commandName === '첩보') {
      return '선택된 도시에 첩보를 실행합니다.\n인접도시일 경우 많은 정보를 얻을 수 있습니다.\n목록을 선택하거나 도시를 클릭하세요.';
    } else if (['화계', '탈취', '파괴', '선동'].includes(commandName)) {
      return `선택된 도시에 ${commandName}을(를) 실행합니다.\n목록을 선택하거나 도시를 클릭하세요.`;
    }
    return '도시를 선택하세요.';
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        {/* 맵 뷰어 */}
        {mapDataState && !loadingMap && (
          <div className={styles.mapContainer}>
            <MapViewer
              serverID={serverID}
              mapData={mapDataState}
              myCity={currentCity}
              onCityClick={handleCityClick}
            />
          </div>
        )}
        {loadingMap && (
          <div className={styles.loading}>맵 로딩 중...</div>
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
            <label>도시:</label>
            <SelectCity
              value={selectedCityID}
              cities={cities}
              onChange={setSelectedCityID}
            />
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={handleSubmit} className={styles.submitButton}>
              {commandName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

