'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { JosaUtil } from '@/lib/utils/josaUtil';
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
  AppointGeneralCommandForm,
  NoAggressionProposalCommandForm,
  PiJangPaJangCommandForm,
  MovePopulationCommandForm,
  RaiseArmyCommandForm
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
  const rawCommand = params?.command as string;
  const command = rawCommand ? decodeURIComponent(rawCommand) : '';
  const turnListParam = searchParams?.get('turnList');
  const isChief = searchParams?.get('is_chief') === 'true';
  const generalID = searchParams?.get('general_id') ? Number(searchParams.get('general_id')) : undefined;

  const [loading, setLoading] = useState(true);
  const [commandData, setCommandData] = useState<CommandData | null>(null);

  useEffect(() => {
    loadCommandData();
  }, [serverID, command, turnListParam, isChief]);

  const router = useRouter();

  async function loadCommandData() {
    if (!command) return;

    try {
      setLoading(true);
      const turnList = turnListParam?.split('_').map(Number) || [0];
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
      const turnList = turnListParam?.split('_').map(Number) || [0];
      
      // brief 생성
      let brief = command;
      if (commandData) {
        // 이동 계열 명령 (도시 선택)
        if (args.destCityID && commandData.cities) {
          const citiesArray = commandData.cities || [];
          const cityName = citiesArray.find(([id]: [number, string]) => id === args.destCityID)?.[1];
          if (cityName) {
            brief = `${JosaUtil.attachJosa(cityName, '으로')} ${command}`;
          }
        }
        // 등용, 선양 등 (장수 선택) - destGeneralID 또는 targetGeneralID
        else if ((args.destGeneralID || args.targetGeneralID) && commandData.generals) {
          const generalID = args.destGeneralID || args.targetGeneralID;
          const general = commandData.generals.find((g: any) => g.no === generalID || g.id === generalID);
          if (general) {
            brief = `${JosaUtil.attachJosa(general.name, '을')} ${command}`;
          }
        }
        // 몰수, 포상, 증여 등 (장수 + 금액)
        else if (args.generalID && args.amount && commandData.generals) {
          const general = commandData.generals.find((g: any) => g.id === args.generalID);
          const amountStr = args.amount.toLocaleString();
          if (general) {
            brief = `${JosaUtil.attachJosa(general.name, '에게')} ${JosaUtil.attachJosa(amountStr, '을')} ${command}`;
          }
        }
        // 장수대상임관 (장수 + 국가)
        else if (args.targetGeneralID && args.nationID && commandData.generals && commandData.nations) {
          const general = commandData.generals.find((g: any) => g.id === args.targetGeneralID);
          const nation = commandData.nations.find((n: any) => n.id === args.nationID);
          if (general && nation) {
            brief = `${JosaUtil.attachJosa(general.name, '을')} ${JosaUtil.attachJosa(nation.name, '에')} ${command}`;
          }
        }
        // 임관 (국가 선택)
        else if (args.nationID && commandData.nations) {
          const nation = commandData.nations.find((n: any) => n.id === args.nationID);
          if (nation) {
            brief = `${JosaUtil.attachJosa(nation.name, '에')} ${command}`;
          }
        }
        // 건국 (국가 이름 + 타입)
        else if (args.nationName && (args.colorType !== undefined || args.nationType)) {
          brief = `${JosaUtil.attachJosa(args.nationName, '을')} ${command}`;
        }
        // 국호변경
        else if (args.newName) {
          brief = `${JosaUtil.attachJosa(args.newName, '으로')} ${command}`;
        }
        // 물자원조, 발령, 인구이동 등 (도시 + 금액/인구)
        else if (args.destCityID && args.amount) {
          const citiesArray = commandData.cities || [];
          const cityName = citiesArray.find(([id]: [number, string]) => id === args.destCityID)?.[1];
          const amountStr = args.amount.toLocaleString();
          if (cityName) {
            brief = `${JosaUtil.attachJosa(cityName, '으로')} ${JosaUtil.attachJosa(amountStr, '을')} ${command}`;
          }
        }
        // 군량매매, 헌납 등 (금액만)
        else if (args.amount) {
          const amountStr = args.amount.toLocaleString();
          brief = `${JosaUtil.attachJosa(amountStr, '을')} ${command}`;
        }
      }
      
      console.log('명령 제출:', {
        serverID,
        general_id: generalID,
        turn_idx: turnList.length > 0 ? turnList[0] : undefined,
        action: command,
        arg: args,
        brief,
      });
      
      const result = await SammoAPI.CommandReserveCommand({
        serverID,
        general_id: generalID,
        turn_idx: turnList.length > 0 ? turnList[0] : undefined,
        action: command,
        arg: args,
        brief,
      });

      console.log('명령 제출 결과:', result);

      if (result.result) {
        alert('명령이 등록되었습니다.');
        router.push(`/${serverID}/${isChief ? 'chief' : 'game'}`);
      } else {
        alert(result.reason || result.message || '명령 등록에 실패했습니다.');
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

    // 거병 커맨드
    if (commandType === '거병' || commandType === 'che_거병' || commandType === 'raiseArmy') {
      return (
        <RaiseArmyCommandForm
          serverID={serverID}
          onComplete={() => router.push(`/${serverID}/game`)}
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

    // 불가침제의 커맨드 (Nation)
    if (commandType === '불가침제의' || commandType === 'che_불가침제의' || commandType === 'noAggressionProposal') {
      return (
        <NoAggressionProposalCommandForm
          commandName={commandName}
          serverID={serverID}
          nations={commandData.nations || []}
          startYear={commandData.startYear ?? 180}
          minYear={commandData.minYear ?? 180}
          maxYear={commandData.maxYear ?? 200}
          month={commandData.month ?? 1}
          mapData={commandData.mapData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 피장파장 커맨드 (Nation)
    if (commandType === '피장파장' || commandType === 'che_피장파장' || commandType === 'piJangPaJang') {
      return (
        <PiJangPaJangCommandForm
          commandName={commandName}
          serverID={serverID}
          nations={commandData.nations || []}
          delayCnt={commandData.delayCnt ?? 0}
          postReqTurn={commandData.postReqTurn ?? 0}
          availableCommandTypeList={commandData.availableCommandTypeList || {}}
          mapData={commandData.mapData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 인구이동 커맨드 (Nation)
    if (commandType === '인구이동' || commandType === 'cr_인구이동' || commandType === 'movePopulation') {
      return (
        <MovePopulationCommandForm
          commandName={commandName}
          serverID={serverID}
          cities={commandData.cities || []}
          currentCity={commandData.currentCity}
          minAmount={commandData.minAmount ?? 100}
          maxAmount={commandData.maxAmount ?? 100000}
          amountGuide={commandData.amountGuide || [5000, 10000, 20000, 30000, 50000, 100000]}
          mapData={commandData.mapData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    // 기본 폼 (아직 구현되지 않은 커맨드)
    const turnList = turnListParam?.split('_').map(Number) || [0];
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


