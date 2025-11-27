'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import type { GetMapResponse } from '@/lib/api/sammo';
import SelectCity from '../SelectCity';
import CitiesBasedOnDistance from '../CitiesBasedOnDistance';
import MapViewer from '@/components/game/MapViewer';
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
  const [error, setError] = useState<string | null>(null);


  // 맵 데이터 로드
  useEffect(() => {
    if (!mapData && serverID) {
      loadMapData();
    }
  }, [mapData, serverID]);

  async function loadMapData() {
    try {
      setLoadingMap(true);
      const result = await SammoAPI.GlobalGetMap({ serverID, neutralView: 0, showMe: 1 });
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
      if (error) {
        setError(null);
      }
    }
  }


  const handleSubmit = () => {
    // 천도, 증축 등은 현재 도시 선택 불가가 아닐 수 있음.
    // 그러나 MoveCommandForm은 기본적으로 "이동"이라 대상이 필요함.
    // 증축/감축은 현재 도시 대상일 수 있음.
    // 하지만 processing에 왔다는 건 대상 선택이 필요하다는 뜻?
    // 만약 증축이 "현재 도시"라면 processing 없이 바로 실행되어야 함 (reqArg=0).
    // 만약 "다른 도시"를 증축해주는거라면 선택 필요.
    // 일반적으로 증축/감축은 "현재 도시"임.
    // 따라서 processing에 안 올 것임. 만약 온다면 선택 가능한 것.
    // 수몰, 초토화는 "선택된 도시"임.
    
    if (selectedCityID === 0) {
      setError('도시를 선택해주세요.');
      return;
    }
    
    if (['강행', '이동', '천도'].includes(commandName) && selectedCityID === currentCity) {
      setError('다른 도시를 선택해주세요.');
      return;
    }
    
    setError(null);
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
    } else if (commandName === '수몰') {
      return '선택된 도시에 수몰을 발동합니다.\n전쟁중인 상대국 도시만 가능합니다.\n목록을 선택하거나 도시를 클릭하세요.';
    } else if (commandName === '백성동원') {
      return '선택된 도시에 백성을 동원해 성벽을 쌓습니다.\n아국 도시만 가능합니다.\n목록을 선택하거나 도시를 클릭하세요.';
    } else if (commandName === '천도') {
      return '선택된 도시로 천도합니다.\n현재 수도에서 연결된 도시만 가능하며, 1+2×거리만큼의 턴이 필요합니다.\n목록을 선택하거나 도시를 클릭하세요.';
    } else if (commandName === '허보') {
      return '선택된 도시에 허보를 발동합니다.\n선포, 전쟁중인 상대국 도시만 가능합니다.\n목록을 선택하거나 도시를 클릭하세요.';
    } else if (commandName === '초토화') {
      return '선택된 도시를 초토화 시킵니다.\n도시가 공백지가 되며, 도시의 인구, 내정 상태에 따라 상당량의 국고가 확보됩니다.\n국가의 수뇌들은 명성을 잃고, 모든 장수들은 배신 수치가 1 증가합니다.\n목록을 선택하거나 도시를 클릭하세요.';
    } else if (commandName === '증축') {
      return '선택된 도시를 증축합니다.\n목록을 선택하거나 도시를 클릭하세요.';
    } else if (commandName === '감축') {
      return '선택된 도시를 감축합니다.\n목록을 선택하거나 도시를 클릭하세요.';
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
               onChange={(value) => {
                 setSelectedCityID(value);
                 if (error) {
                   setError(null);
                 }
               }}
             />
           </div>
           {error && (
             <p className={styles.errorMessage} role="alert" aria-live="assertive">
               {error}
             </p>
           )}
           <div className={styles.formActions}>

            <button type="button" onClick={handleSubmit} className={styles.submitButton}>
              {commandName}
            </button>
          </div>
        </div>

        {/* 거리별 도시 목록 */}
        {distanceList && Object.keys(distanceList).length > 0 && (
          <CitiesBasedOnDistance
            distanceList={distanceList}
            citiesMap={cities}
            onSelect={(cityId) => {
              setSelectedCityID(cityId);
              if (error) {
                setError(null);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
