'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import { 
  RecruitCommandForm, 
  MoveCommandForm, 
  TradeRiceCommandForm,
  FoundNationCommandForm,
  GeneralAmountCommandForm,
  ConscriptCommandForm,
  TributeCommandForm,
  AbdicateCommandForm,
  JoinNationCommandForm,
  FollowGeneralJoinNationCommandForm,
  RandomFoundNationCommandForm,
  ConvertMasteryCommandForm,
  TradeEquipmentCommandForm,
  ChangeNationFlagCommandForm,
  ChangeNationNameCommandForm,
  MaterialAidCommandForm,
  AppointGeneralCommandForm
} from '@/components/processing/command-forms';
import type { ProcGeneralItem, ProcNationItem } from '@/components/processing/SelectGeneral';
import styles from './page.module.css';

interface CommandData {
  name: string;
  commandType: string;
  generals?: ProcGeneralItem[];
  nations?: ProcNationItem[];
  cities?: Map<number, { name: string; info?: string }>;
  minAmount?: number;
  maxAmount?: number;
  amountGuide?: number[];
  currentCity?: number;
  distanceList?: Record<number, number[]>;
  mapData?: any;
  available건국?: boolean;
  nationTypes?: Record<string, { type: string; name: string; pros: string; cons: string }>;
  colors?: string[];
  // 징병/모병 데이터
  relYear?: number;
  year?: number;
  tech?: number;
  techLevel?: number;
  startYear?: number;
  goldCoeff?: number;
  leadership?: number;
  fullLeadership?: number;
  armCrewTypes?: Array<{
    armType: number;
    armName: string;
    values: Array<{
      id: number;
      reqTech: number;
      reqYear: number;
      notAvailable?: boolean;
      baseRice: number;
      baseCost: number;
      name: string;
      attack: number;
      defence: number;
      speed: number;
      avoid: number;
      img: string;
      info: string[];
    }>;
  }>;
  currentCrewType?: number;
  crew?: number;
  gold?: number;
  [key: string]: any;
}

export default function CommandProcessingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const command = params?.command as string;
  const turnList = searchParams?.get('turnList')?.split('_').map(Number) || [0];
  const isChief = searchParams?.get('is_chief') === 'true';

  const [loading, setLoading] = useState(true);
  const [commandData, setCommandData] = useState<CommandData | null>(null);

  useEffect(() => {
    loadCommandData();
  }, [serverID, command, turnList, isChief]);

  const router = useRouter();

  async function loadCommandData() {
    if (!command) return;

    try {
      setLoading(true);
      const result = await SammoAPI.GetCommandData({
        command,
        turnList,
        isChief,
      });

      if (result.result && result.commandData) {
        setCommandData(result.commandData);
      } else {
        alert('명령 데이터를 불러오는데 실패했습니다.');
        router.push(`/${serverID}/${isChief ? 'chief' : 'game'}`);
      }
    } catch (err) {
      console.error(err);
      alert('명령 데이터를 불러오는데 실패했습니다.');
      router.push(`/${serverID}/${isChief ? 'chief' : 'game'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(args: any) {
    if (!command) {
      alert('명령이 지정되지 않았습니다.');
      return;
    }

    try {
      const result = await SammoAPI.CommandReserveCommand({
        action: command,
        turnList,
        arg: args,
      });

      if (result.result) {
        alert('명령이 등록되었습니다.');
        router.push(`/${serverID}/${isChief ? 'chief' : 'game'}`);
      } else {
        alert(result.reason || '명령 등록에 실패했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || '명령 등록에 실패했습니다.');
    }
  }

  function handleCancel() {
    router.push(`/${serverID}/${isChief ? 'chief' : 'game'}`);
  }

  // 커맨드 타입에 따른 폼 렌더링
  function renderCommandForm() {
    if (!commandData) return null;

    const commandName = commandData.name || command;
    const commandType = commandData.commandType || command;

    // 등용 커맨드
    if (commandType === '등용' || commandType === 'che_등용') {
      const generals = commandData.generals || [];
      const nationsMap = new Map<number, ProcNationItem>();
      if (commandData.nations) {
        for (const nation of commandData.nations) {
          nationsMap.set(nation.id, nation);
        }
      }

      return (
        <RecruitCommandForm
          commandName={commandName}
          generals={generals}
          nations={nationsMap}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 이동, 강행, 출병, 첩보, 화계, 탈취, 파괴, 선동 등 도시 선택 커맨드
    if (['이동', '강행', '출병', '첩보', '화계', '탈취', '파괴', '선동', 
         'che_이동', 'che_강행', 'che_출병', 'che_첩보', 'che_화계', 'che_탈취', 'che_파괴', 'che_선동'].includes(commandType)) {
      // 백엔드에서 배열로 오는 것을 Map으로 변환
      const citiesArray = commandData.cities || [];
      const citiesMap = new Map<number, { name: string; info?: string }>();
      for (const [cityId, cityName] of citiesArray) {
        citiesMap.set(cityId, { name: cityName });
      }
      const currentCity = commandData.currentCity || 0;

      return (
        <MoveCommandForm
          commandName={commandName}
          cities={citiesMap}
          currentCity={currentCity}
          distanceList={commandData.distanceList}
          mapData={commandData.mapData}
          serverID={serverID}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 군량매매 커맨드
    if (commandType === '군량매매' || commandType === 'che_군량매매') {
      return (
        <TradeRiceCommandForm
          commandName={commandName}
          minAmount={commandData.minAmount || 0}
          maxAmount={commandData.maxAmount || 999999}
          amountGuide={commandData.amountGuide || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 건국 커맨드
    if (commandType === '건국' || commandType === 'che_건국' || commandType === 'foundNation') {
      return (
        <FoundNationCommandForm
          commandName={commandName}
          available건국={commandData.available건국 !== false}
          nationTypes={commandData.nationTypes || {}}
          colors={commandData.colors || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 몰수/포상/증여 커맨드
    if (['몰수', '포상', '증여', 'che_몰수', 'che_포상', 'che_증여', 
         'confiscate', 'reward', 'donate'].includes(commandType)) {
      const generals = commandData.generals || [];
      
      return (
        <GeneralAmountCommandForm
          commandName={commandName}
          generals={generals}
          minAmount={commandData.minAmount || 100}
          maxAmount={commandData.maxAmount || 100000}
          amountGuide={commandData.amountGuide || [100, 500, 1000, 2000, 5000, 10000]}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 징병/모병 커맨드
    if (['징병', '모병', 'che_징병', 'che_모병', 'conscript', 'recruitSoldiers'].includes(commandType)) {
      return (
        <ConscriptCommandForm
          commandName={commandName}
          relYear={commandData.relYear || 0}
          year={commandData.year || 1}
          tech={commandData.tech || 0}
          techLevel={commandData.techLevel || 0}
          startYear={commandData.startYear || 1}
          goldCoeff={commandData.goldCoeff || 1}
          leadership={commandData.leadership || 0}
          fullLeadership={commandData.fullLeadership || 0}
          armCrewTypes={commandData.armCrewTypes || []}
          currentCrewType={commandData.currentCrewType || 1100}
          crew={commandData.crew || 0}
          gold={commandData.gold || 0}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 헌납 커맨드
    if (commandType === '헌납' || commandType === 'che_헌납' || commandType === 'tribute') {
      return (
        <TributeCommandForm
          commandName={commandName}
          minAmount={commandData.minAmount || 100}
          maxAmount={commandData.maxAmount || 999999}
          amountGuide={commandData.amountGuide || [100, 500, 1000, 2000, 5000, 10000]}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 선양 커맨드
    if (commandType === '선양' || commandType === 'che_선양' || commandType === 'abdicate') {
      const generals = commandData.generals || [];
      const nationsMap = new Map<number, ProcNationItem>();
      if (commandData.nations) {
        for (const nation of commandData.nations) {
          nationsMap.set(nation.id, nation);
        }
      }

      return (
        <AbdicateCommandForm
          commandName={commandName}
          generals={generals}
          nations={nationsMap}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 임관 커맨드
    if (commandType === '임관' || commandType === 'che_임관' || commandType === 'joinNation') {
      const nations = commandData.nations || [];

      return (
        <JoinNationCommandForm
          commandName={commandName}
          nations={nations}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 장수대상임관 커맨드
    if (commandType === '장수대상임관' || commandType === 'che_장수대상임관' || commandType === 'followGeneralJoinNation') {
      const generals = commandData.generals || [];
      const nations = commandData.nations || [];

      return (
        <FollowGeneralJoinNationCommandForm
          commandName={commandName}
          generals={generals}
          nations={nations}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 무작위건국 커맨드
    if (commandType === '무작위건국' || commandType === 'che_무작위건국' || commandType === 'randomFoundNation') {
      return (
        <RandomFoundNationCommandForm
          commandName={commandName}
          available건국={commandData.available건국 !== false}
          nationTypes={commandData.nationTypes || {}}
          colors={commandData.colors || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 숙련전환 커맨드
    if (commandType === '숙련전환' || commandType === 'che_숙련전환' || commandType === 'convertMastery') {
      return (
        <ConvertMasteryCommandForm
          commandName={commandName}
          ownDexList={commandData.ownDexList || []}
          dexLevelList={commandData.dexLevelList || []}
          decreaseCoeff={commandData.decreaseCoeff ?? 0.4}
          convertCoeff={commandData.convertCoeff ?? 0.9}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 장비매매 커맨드
    if (commandType === '장비매매' || commandType === 'che_장비매매' || commandType === 'tradeEquipment') {
      return (
        <TradeEquipmentCommandForm
          commandName={commandName}
          citySecu={commandData.citySecu ?? 0}
          gold={commandData.gold ?? 0}
          itemList={commandData.itemList || {}}
          ownItem={commandData.ownItem || {}}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 국기변경 커맨드 (Nation)
    if (commandType === '국기변경' || commandType === 'che_국기변경' || commandType === 'changeNationFlag') {
      return (
        <ChangeNationFlagCommandForm
          commandName={commandName}
          colors={commandData.colors || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 국호변경 커맨드 (Nation)
    if (commandType === '국호변경' || commandType === 'che_국호변경' || commandType === 'changeNationName') {
      return (
        <ChangeNationNameCommandForm
          commandName={commandName}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 물자원조 커맨드 (Nation)
    if (commandType === '물자원조' || commandType === 'che_물자원조' || commandType === 'materialAid') {
      return (
        <MaterialAidCommandForm
          commandName={commandName}
          serverID={serverID}
          nations={commandData.nations || []}
          currentNationLevel={commandData.currentNationLevel ?? 0}
          levelInfo={commandData.levelInfo || {}}
          minAmount={commandData.minAmount ?? 0}
          maxAmount={commandData.maxAmount ?? 0}
          amountGuide={commandData.amountGuide || []}
          mapData={commandData.mapData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 발령 커맨드 (Nation)
    if (commandType === '발령' || commandType === 'che_발령' || commandType === 'appointGeneral') {
      return (
        <AppointGeneralCommandForm
          commandName={commandName}
          serverID={serverID}
          generals={commandData.generals || []}
          cities={commandData.cities || []}
          troops={commandData.troops || {}}
          currentCity={commandData.currentCity}
          mapData={commandData.mapData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 기본 폼 (아직 구현되지 않은 커맨드)
    return (
      <div className={styles.container}>
        <TopBackBar title={commandName} onBack={handleCancel} />
        <div className={styles.content}>
          <div className={styles.commandInfo}>
            <div>명령: {command}</div>
            <div>턴: {turnList.join(', ')}</div>
            <div>형태: {isChief ? '수뇌부' : '일반'}</div>
          </div>
          <div className={styles.commandForm}>
            <h2>명령 입력</h2>
            <p>이 커맨드 폼은 아직 구현 중입니다.</p>
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      </div>
    );
  }

  return renderCommandForm();
}


