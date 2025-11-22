'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { JosaUtil } from '@/lib/utils/josaUtil';
import { cn } from '@/lib/utils';
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
  RaiseArmyCommandForm,
  ReassignUnitCommandForm,
  SimpleCommandForm
} from '@/components/processing/command-forms';
import type { ProcGeneralItem, ProcNationItem } from '@/components/processing/SelectGeneral';

// --- Type Definitions (Keep logic intact) ---
type UnitStackItem = {
  id: string;
  crewTypeId: number;
  crewTypeName?: string;
  unitSize?: number;
  stackCount?: number;
  troops: number;
  train: number;
  morale: number;
  updatedAt?: string;
};

type UnitStackGroup = {
  totalTroops?: number;
  stackCount?: number;
  stacks: UnitStackItem[];
} | null;

type TradeItemInfo = {
  id: string;
  name: string;
  reqSecu: number;
  cost: number;
  info: string;
  isBuyable: boolean;
};

type TradeItemList = Record<
  string,
  {
    typeName: string;
    values: TradeItemInfo[];
  }
>;

interface CommandProcessingClientProps {
  serverID: string;
  command: string;
  turnListParam?: string;
  isChief: boolean;
  generalIdParam?: number;
}

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
  generalStacks?: UnitStackItem[];
  cityStacks?: UnitStackGroup | UnitStackItem[];
  unitStacks?: UnitStackGroup | UnitStackItem[];
  currentCityId?: number;
  currentCityName?: string;
  availableCities?: Array<{ id: number; name: string }>;
  relYear?: number;
  year?: number;
  tech?: number;
  techLevel?: number;
  startYear?: number;
  minYear?: number;
  maxYear?: number;
  month?: number;
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
  ownDexList?: Array<{ armType: number; name: string; amount: number }>;
  dexLevelList?: Array<{ amount: number; color: string; name: string }>;
  decreaseCoeff?: number;
  convertCoeff?: number;
  citySecu?: number;
  itemList?: Record<string, { typeName?: string; values: Array<{ id: string; name: string; reqSecu: number; cost: number; info: string; isBuyable: boolean }> }>;
  ownItem?: Record<string, { id: string; name: string; reqSecu: number; cost: number; info: string; isBuyable: boolean }>;
  currentNationLevel?: number;
  levelInfo?: Record<number, { text: string; amount: number }>;
  delayCnt?: number;
  postReqTurn?: number;
  availableCommandTypeList?: Record<string, { name: string; remainTurn: number }>;
}

// --- Utility Functions ---
function normalizeUnitStackGroup(
  group: UnitStackGroup | UnitStackItem[] | null | undefined
): UnitStackGroup {
  if (!group) {
    return null;
  }
  if (Array.isArray(group)) {
    const totalTroops = group.reduce(
      (sum, stack) => sum + (typeof stack?.troops === 'number' ? stack.troops : 0),
      0
    );
    return {
      stacks: group,
      totalTroops,
      stackCount: group.length,
    };
  }
  if (typeof group === 'object' && Array.isArray(group.stacks)) {
    const totalTroops =
      typeof group.totalTroops === 'number'
        ? group.totalTroops
        : group.stacks.reduce(
            (sum, stack) => sum + (typeof stack?.troops === 'number' ? stack.troops : 0),
            0
          );
    const stackCount =
      typeof group.stackCount === 'number' ? group.stackCount : group.stacks.length;
    return {
      stacks: group.stacks,
      totalTroops,
      stackCount,
    };
  }
  return null;
}

function buildItemList(itemList?: CommandData['itemList']): TradeItemList {
  const result: TradeItemList = {};
  if (!itemList) {
    return result;
  }
  for (const [key, value] of Object.entries(itemList)) {
    result[key] = {
      typeName: value?.typeName || key,
      values: Array.isArray(value?.values) ? value!.values : [],
    };
  }
  return result;
}

function buildOwnItem(
  ownItem?: CommandData['ownItem']
): Record<string, TradeItemInfo> {
  const result: Record<string, TradeItemInfo> = {};
  if (!ownItem) {
    return result;
  }
  for (const [key, value] of Object.entries(ownItem)) {
    result[key] = {
      id: value?.id ?? 'None',
      name: value?.name ?? key,
      reqSecu: typeof value?.reqSecu === 'number' ? value!.reqSecu : 0,
      cost: typeof value?.cost === 'number' ? value!.cost : 0,
      info: value?.info ?? '',
      isBuyable: typeof value?.isBuyable === 'boolean' ? value!.isBuyable : false,
    };
  }
  return result;
}

export default function CommandProcessingClient({
  serverID,
  command,
  turnListParam,
  isChief,
  generalIdParam
}: CommandProcessingClientProps) {
  const [loading, setLoading] = useState(true);
  const [commandData, setCommandData] = useState<CommandData | null>(null);
  const router = useRouter();
  const generalID = generalIdParam;

  useEffect(() => {
    loadCommandData();
  }, [serverID, command, turnListParam, isChief]);

  async function loadCommandData() {
    if (!command) return;

    try {
      setLoading(true);
      const turnList = turnListParam?.split('_').map(Number) || [0];
      const result = await SammoAPI.GetCommandData({
        command,
        turnList,
        isChief,
        serverID,
        general_id: generalID
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

      let brief = command;
      if (commandData) {
        // ... (Logic for generating brief description - kept as is)
        if (args.destCityID && commandData.cities) {
          const cities: any = commandData.cities;
          let cityName: string | undefined;

          if (cities instanceof Map) {
            const cityData = cities.get(args.destCityID);
            cityName = cityData?.name || cityData;
          } else if (Array.isArray(cities)) {
            const cityData = cities.find(([id]: [number, any]) => id === args.destCityID);
            cityName = cityData?.[1];
          }

          if (cityName) {
            brief = `${JosaUtil.attachJosa(cityName, '으로')} ${command}`;
          }
        } else if ((args.destGeneralID || args.targetGeneralID) && commandData.generals) {
          const targetGeneralId = args.destGeneralID || args.targetGeneralID;
          const general = commandData.generals.find((g: any) => g.no === targetGeneralId || g.id === targetGeneralId);
          if (general) {
            brief = `${JosaUtil.attachJosa(general.name, '을')} ${command}`;
          }
        } else if (args.generalID && args.amount && commandData.generals) {
          const general = commandData.generals.find((g: any) => g.id === args.generalID);
          const amountStr = args.amount.toLocaleString();
          if (general) {
            brief = `${JosaUtil.attachJosa(general.name, '에게')} ${JosaUtil.attachJosa(amountStr, '을')} ${command}`;
          }
        } else if (args.targetGeneralID && args.nationID && commandData.generals && commandData.nations) {
          const general = commandData.generals.find((g: any) => g.id === args.targetGeneralID);
          const nation = commandData.nations.find((n: any) => n.id === args.nationID);
          if (general && nation) {
            brief = `${JosaUtil.attachJosa(general.name, '을')} ${JosaUtil.attachJosa(nation.name, '에')} ${command}`;
          }
        } else if (args.nationID && commandData.nations) {
          const nation = commandData.nations.find((n: any) => n.id === args.nationID);
          if (nation) {
            brief = `${JosaUtil.attachJosa(nation.name, '에')} ${command}`;
          }
        } else if (args.nationName && (args.colorType !== undefined || args.nationType)) {
          brief = `${JosaUtil.attachJosa(args.nationName, '을')} ${command}`;
        } else if (args.newName) {
          brief = `${JosaUtil.attachJosa(args.newName, '으로')} ${command}`;
        } else if (args.destCityID && args.amount) {
          const cities: any = commandData.cities || [];
          let cityName: string | undefined;

          if (cities instanceof Map) {
            const cityData = cities.get(args.destCityID);
            cityName = cityData?.name || cityData;
          } else if (Array.isArray(cities)) {
            const cityData = cities.find(([id]: [number, any]) => id === args.destCityID);
            cityName = cityData?.[1];
          }

          const amountStr = args.amount.toLocaleString();
          if (cityName) {
            brief = `${JosaUtil.attachJosa(cityName, '으로')} ${JosaUtil.attachJosa(amountStr, '을')} ${command}`;
          }
        } else if (args.amount) {
          const amountStr = args.amount.toLocaleString();
          brief = `${JosaUtil.attachJosa(amountStr, '을')} ${command}`;
        }
      }

      let result: any;
      if (isChief) {
        result = await SammoAPI.NationCommandReserveCommand({
          serverID,
          action: command,
          turnList,
          arg: args
        });
      } else {
        result = await SammoAPI.CommandReserveCommand({
          serverID,
          general_id: generalID,
          turn_idx: turnList.length > 0 ? turnList[0] : undefined,
          action: command,
          arg: args,
          brief
        });
      }

      if (result.result ?? result.success) {
        // alert('명령이 등록되었습니다.'); // Optional: remove alert for smoother UX
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

  function renderCommandForm() {
    if (!commandData) return null;

    const commandName = commandData.name || command;
    const commandType = commandData.commandType || command;
    const unitStacksGroup = normalizeUnitStackGroup(commandData.unitStacks);
    const cityStacksGroup = normalizeUnitStackGroup(commandData.cityStacks);
    const tradeItemList = buildItemList(commandData.itemList);
    const tradeOwnItem = buildOwnItem(commandData.ownItem);
    const generalStacksList = (commandData.generalStacks || []).map((stack) => ({
      ...stack,
      unitSize: typeof stack.unitSize === 'number' ? stack.unitSize : (stack as any).unitSize ?? 0,
      stackCount: typeof stack.stackCount === 'number' ? stack.stackCount : 1,
    }));
    const cityStacksList = (cityStacksGroup?.stacks || []).map((stack) => ({
      ...stack,
      unitSize: typeof stack.unitSize === 'number' ? stack.unitSize : 0,
      stackCount: typeof stack.stackCount === 'number' ? stack.stackCount : 1,
    }));

    // Wrapper for unified styling
    const FormWrapper = ({ children }: { children: React.ReactNode }) => (
      <div className="min-h-screen bg-background-main flex flex-col items-center p-4 font-sans selection:bg-primary selection:text-white">
        <div className="fixed inset-0 bg-hero-pattern opacity-20 pointer-events-none" />
        <div className="w-full max-w-3xl relative z-10">
          <TopBackBar title={`${commandName}`} onBack={handleCancel} />
          <div className="mt-4 bg-background-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <span className="w-2 h-8 rounded-full bg-primary"></span>
                  <div>
                     <h2 className="text-xl font-bold text-white">{commandName}</h2>
                     <p className="text-xs text-foreground-muted">턴 {turnListParam?.split('_').join(', ')} 실행 예정</p>
                  </div>
               </div>
               {isChief && (
                  <span className="px-2 py-1 rounded bg-secondary/20 text-secondary text-xs font-bold border border-secondary/30">수뇌부 명령</span>
               )}
            </div>
            <div className="p-6">
               {children}
            </div>
          </div>
        </div>
      </div>
    );

    let Component: React.ReactNode = null;

    if (commandType === '등용' || commandType === 'che_등용') {
      const generals = commandData.generals || [];
      const nationsMap = new Map<number, ProcNationItem>();
      if (commandData.nations) {
        for (const nation of commandData.nations) {
          nationsMap.set(nation.id, nation);
        }
      }
      Component = (
        <RecruitCommandForm
          commandName={commandName}
          generals={generals}
          nations={nationsMap}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['이동', '강행', '출병', '첩보', '화계', '탈취', '파괴', '선동', 'che_이동', 'che_강행', 'che_출병', 'che_첩보', 'che_화계', 'che_탈취', 'che_파괴', 'che_선동'].includes(commandType)) {
      const citiesArray = commandData.cities || [];
      const citiesMap = new Map<number, { name: string; info?: string }>();
      for (const [cityId, cityName] of citiesArray) {
        citiesMap.set(cityId, { name: String(cityName) });
      }
      const currentCity = commandData.currentCity || 0;
      Component = (
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
    } else if (commandType === '군량매매' || commandType === 'che_군량매매') {
      Component = (
        <TradeRiceCommandForm
          commandName={commandName}
          minAmount={commandData.minAmount || 0}
          maxAmount={commandData.maxAmount || 999999}
          amountGuide={commandData.amountGuide || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['거병', 'che_거병', 'raiseArmy'].includes(commandType)) {
      Component = <RaiseArmyCommandForm serverID={serverID} onComplete={() => router.push(`/${serverID}/game`)} />;
    } else if (['건국', 'che_건국', 'foundNation'].includes(commandType)) {
      Component = (
        <FoundNationCommandForm
          commandName={commandName}
          available건국={commandData.available건국 !== false}
          nationTypes={commandData.nationTypes || {}}
          colors={commandData.colors || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['몰수', '포상', '증여', 'che_몰수', 'che_포상', 'che_증여', 'confiscate', 'reward', 'donate'].includes(commandType)) {
      const generals = commandData.generals || [];
      Component = (
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
    } else if (['징병', '모병', 'che_징병', 'che_모병', 'conscript', 'recruitSoldiers'].includes(commandType)) {
      Component = (
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
          currentCrewType={commandData.currentCrewType || 0}
          crew={commandData.crew || 0}
          gold={commandData.gold || 0}
          rice={commandData.rice || 0}
          unitStacks={unitStacksGroup}
          cityStacks={cityStacksGroup}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['조공', 'che_조공', 'tribute'].includes(commandType)) {
      Component = (
        <TributeCommandForm
          commandName={commandName}
          minAmount={commandData.minAmount || 0}
          maxAmount={commandData.maxAmount || 0}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['선양', 'che_선양'].includes(commandType)) {
      Component = (
        <AbdicateCommandForm
          commandName={commandName}
          generals={commandData.generals || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['임관', 'che_임관', 'joinNation', 'che_장수대상임관', '장수대상임관', 'followGeneralJoinNation'].includes(commandType)) {
      const generals = commandData.generals || [];
      const nations = commandData.nations || [];
      const onSubmit = commandType.includes('followGeneral') ? handleSubmit : handleSubmit;
      Component = commandType.includes('followGeneral') ? (
        <FollowGeneralJoinNationCommandForm
          commandName={commandName}
          generals={generals}
          nations={nations}
          onSubmit={onSubmit}
          onCancel={handleCancel}
        />
      ) : (
        <JoinNationCommandForm
          commandName={commandName}
          nations={nations}
          onSubmit={onSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['무작위건국', 'che_무작위건국', 'randomFoundNation'].includes(commandType)) {
      Component = (
        <RandomFoundNationCommandForm
          commandName={commandName}
          available건국={commandData.available건국 !== false}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['수련변환', 'che_수련변환', 'convertMastery'].includes(commandType)) {
      Component = (
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
    } else if (['장비거래', 'che_장비거래', 'tradeEquipment', '재정거래', 'che_재정거래'].includes(commandType)) {
      Component = (
        <TradeEquipmentCommandForm
          commandName={commandName}
          citySecu={commandData.citySecu || 0}
          gold={commandData.gold || 0}
          itemList={tradeItemList}
          ownItem={tradeOwnItem}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['국기변경', 'che_국기변경', 'changeNationFlag'].includes(commandType)) {
      Component = (
        <ChangeNationFlagCommandForm
          commandName={commandName}
          colors={commandData.colors || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['국호변경', 'che_국호변경', 'changeNationName'].includes(commandType)) {
      Component = (
        <ChangeNationNameCommandForm
          commandName={commandName}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['물자원조', 'che_물자원조', 'materialAid'].includes(commandType)) {
      Component = (
        <MaterialAidCommandForm
          commandName={commandName}
          serverID={serverID}
          nations={commandData.nations || []}
          currentNationLevel={commandData.currentNationLevel || 0}
          levelInfo={commandData.levelInfo || {}}
          minAmount={commandData.minAmount || 0}
          maxAmount={commandData.maxAmount || 0}
          amountGuide={commandData.amountGuide || [100, 500, 1000, 2000, 5000, 10000]}
          mapData={commandData.mapData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['임명', 'che_임명', 'appointGeneral'].includes(commandType)) {
      const citiesArray =
        commandData.cities instanceof Map
          ? Array.from(commandData.cities.entries())
          : Array.isArray(commandData.cities)
            ? commandData.cities
            : [];
      Component = (
        <AppointGeneralCommandForm
          commandName={commandName}
          serverID={serverID}
          generals={commandData.generals || []}
          cities={citiesArray}
          troops={commandData.troops || {}}
          currentCity={commandData.currentCity || 0}
          mapData={commandData.mapData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['불가침제의', 'che_불가침제의', 'noAggressionProposal'].includes(commandType)) {
      Component = (
        <NoAggressionProposalCommandForm
          commandName={commandName}
          serverID={serverID}
          nations={commandData.nations || []}
          startYear={commandData.startYear || 1}
          minYear={commandData.minYear ?? commandData.year ?? 1}
          maxYear={commandData.maxYear ?? (commandData.year ?? 1)}
          month={commandData.month || 1}
          mapData={commandData.mapData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['피장파장', 'che_피장파장', 'piJangPaJang'].includes(commandType)) {
      Component = (
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
    } else if (['인구이동', 'che_인구이동', 'movePopulation'].includes(commandType)) {
      const citiesArray = commandData.cities || [];
      const citiesMap = new Map<number, { name: string; info?: string }>();
      for (const [cityId, cityName] of citiesArray) {
        citiesMap.set(cityId, { name: String(cityName) });
      }
      Component = (
        <MovePopulationCommandForm
          commandName={commandName}
          cities={Array.from(citiesMap.entries())}
          minAmount={commandData.minAmount || 0}
          maxAmount={commandData.maxAmount || 0}
          amountGuide={commandData.amountGuide || [100, 500, 1000, 2000, 5000, 10000]}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['부대재편성', 'che_부대재편성', 'reassignUnit'].includes(commandType)) {
      Component = (
        <ReassignUnitCommandForm
          commandName={commandName}
          generalStacks={generalStacksList}
          cityStacks={cityStacksList}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else {
      // Default simple commands
      Component = (
        <SimpleCommandForm
          commandName={commandName}
          description={`${commandName} 명령을 실행합니다.`}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
    }

    return <FormWrapper>{Component}</FormWrapper>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main text-white">
        <div className="animate-pulse flex flex-col items-center">
           <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
           <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  return renderCommandForm();
}
