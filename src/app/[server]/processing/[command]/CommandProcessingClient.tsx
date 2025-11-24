'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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
  DeclareWarCommandForm,
  PiJangPaJangCommandForm,
  MovePopulationCommandForm,
  RaiseArmyCommandForm,
  ReassignUnitCommandForm,
  SimpleCommandForm,
  NationTargetCommandForm,
  GeneralTargetCommandForm
} from '@/components/processing/command-forms';
import HighRiskCommandConfirmModal from '@/components/processing/HighRiskCommandConfirmModal';
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

interface HighRiskConfirmState {
  open: boolean;
  title: string;
  brief: string;
  details: string[];
  args: any;
  requireInputLabel?: string;
  expectedInput?: string;
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
  rice?: number;
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      morale: group.averageMorale, // Optional: average morale for display
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      train: group.averageTrain
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

const HIGH_RISK_CITY_COMMANDS = new Set([
  '천도',
  'che_천도',
  '초토화',
  'che_초토화',
  '수몰',
  'che_수몰',
]);

const HIGH_RISK_POPULATION_COMMANDS = new Set([
  '인구이동',
  'che_인구이동',
  'movePopulation',
]);

const HIGH_RISK_MATERIAL_AID_COMMANDS = new Set([
  '물자원조',
  'che_물자원조',
  'materialAid',
]);

const HIGH_RISK_DECLARE_WAR_COMMANDS = new Set([
  '선전포고',
  'che_선전포고',
  'declareWar',
]);

const HIGH_RISK_DIPLOMACY_COMMANDS = new Set([
  '불가침제의',
  'che_불가침제의',
  'noAggressionProposal',
  '불가침파기제의',
  'che_불가침파기제의',
  '종전제의',
  'che_종전제의',
]);

const CITY_NAME_CONFIRM_COMMANDS = new Set([
  '천도',
  'che_천도',
  '초토화',
  'che_초토화',
  '수몰',
  'che_수몰',
]);

export default function CommandProcessingClient({
  serverID,
  command,
  turnListParam,
  isChief,
  generalIdParam
}: CommandProcessingClientProps) {
  const [loading, setLoading] = useState(true);
  const [commandData, setCommandData] = useState<CommandData | null>(null);
  const [highRiskConfirmState, setHighRiskConfirmState] = useState<HighRiskConfirmState | null>(
    null
  );
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

  function buildBrief(args: any): string {
    let brief = command;

    if (!commandData) {
      return brief;
    }

    const commandType = commandData.commandType || command;

    if (
      [
        '이동',
        '강행',
        '출병',
        '첩보',
        '화계',
        '탈취',
        '파괴',
        '선동',
        'che_이동',
        'che_강행',
        'che_출병',
        'che_첩보',
        'che_화계',
        'che_탈취',
        'che_파괴',
        'che_선동',
        '인구이동',
        'che_인구이동',
        '수몰',
        '백성동원',
        '천도',
        '허보',
        '초토화',
        '증축',
        '감축',
        'che_수몰',
        'che_백성동원',
        'che_천도',
        'che_허보',
        'che_초토화',
        'che_증축',
        'che_감축',
      ].includes(commandType)
    ) {
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
          brief = `${JosaUtil.attachJosa(cityName, '으로')} ${commandData.name || command}`;
          if (args.amount) {
            brief += ` (${args.amount.toLocaleString()})`;
          }
        }
      }
    } else if (
      ['등용', 'che_등용', 'che_장수대상임관', '장수대상임관', '부대탈퇴지시', 'che_부대탈퇴지시'].includes(
        commandType
      )
    ) {
      if (args.destGeneralID && commandData.generals) {
        const general = commandData.generals.find((g: any) => g.no === args.destGeneralID);
        if (general) {
          brief = `${JosaUtil.attachJosa(general.name, '을')} ${commandData.name || command}`;
        }
      }
    } else if (
      ['몰수', '포상', '증여', 'che_몰수', 'che_포상', 'che_증여'].includes(commandType)
    ) {
      if (args.destGeneralID && commandData.generals) {
        const general = commandData.generals.find((g: any) => g.no === args.destGeneralID);
        if (general) {
          const typeStr = args.isGold ? '금' : '쌀';
          const amountStr = args.amount?.toLocaleString() || '0';
          brief = `${JosaUtil.attachJosa(general.name, '에게')} ${typeStr} ${amountStr}을(를) ${
            commandData.name || command
          }`;
        }
      }
    } else if (['군량매매', 'che_군량매매'].includes(commandType)) {
      const amountStr = args.amount?.toLocaleString() || '0';
      brief = `쌀 ${amountStr} ${args.buyRice ? '매입' : '매각'}`;
    } else if (
      ['징병', '모병', 'che_징병', 'che_모병'].includes(commandType)
    ) {
      const crewType = args.crewType;
      let crewName = '병력';
      if (commandData.armCrewTypes) {
        for (const arm of commandData.armCrewTypes) {
          const found = arm.values.find((c) => c.id === crewType);
          if (found) {
            crewName = found.name;
            break;
          }
        }
      }
      brief = `${crewName} ${args.amount?.toLocaleString()} ${commandData.name || command}`;
    } else if (
      ['국기변경', 'che_국기변경', '국호변경', 'che_국호변경'].includes(commandType)
    ) {
      brief = commandData.name || command;
    } else if (
      [
        '급습',
        '불가침파기제의',
        '이호경식',
        '종전제의',
        'che_급습',
        'che_불가침파기제의',
        'che_이호경식',
        'che_종전제의',
      ].includes(commandType)
    ) {
      if (args.destNationID && commandData.nations) {
        const nation = commandData.nations.find((n) => n.id === args.destNationID);
        if (nation) {
          brief = `${JosaUtil.attachJosa(nation.name, '에')} ${commandData.name || command}`;
        }
      }
    }

    return brief;
  }

  function getCityName(destCityID?: number): string | undefined {
    if (!destCityID || !commandData?.cities) {
      return undefined;
    }

    const cities: any = commandData.cities;
    if (cities instanceof Map) {
      const cityData = cities.get(destCityID);
      return cityData?.name || cityData;
    }

    if (Array.isArray(cities)) {
      const cityData = cities.find(([id]: [number, any]) => id === destCityID);
      return cityData?.[1];
    }

    return undefined;
  }

  function getNationName(destNationID?: number): string | undefined {
    if (!destNationID || !commandData?.nations) {
      return undefined;
    }

    const nation = commandData.nations.find((n) => n.id === destNationID);
    return nation?.name;
  }

  function buildHighRiskConfirmState(args: any, brief: string): HighRiskConfirmState | null {
    if (!commandData) return null;

    const commandType = commandData.commandType || command;
    const commandName = commandData.name || command;
    const details: string[] = [];
    let requireInputLabel: string | undefined;
    let expectedInput: string | undefined;

    if (HIGH_RISK_CITY_COMMANDS.has(commandType)) {
      const cityName = getCityName(args.destCityID);
      if (cityName) {
        details.push(`대상 도시: ${cityName}`);
      }

      if (commandType.includes('천도')) {
        details.push('수도가 변경되며 국가 운영에 큰 영향을 줍니다.');
      } else if (commandType.includes('초토화')) {
        details.push('도시는 공백지가 되며 인구와 내정 수치가 사라집니다.');
        details.push('국가 수뇌의 명성이 감소하고 모든 장수의 배신 수치가 증가합니다.');
      } else if (commandType.includes('수몰')) {
        details.push('대상 도시에 큰 피해를 주는 공격 명령입니다.');
      }

      if (CITY_NAME_CONFIRM_COMMANDS.has(commandType) && cityName) {
        expectedInput = cityName;
        requireInputLabel = `안전을 위해 대상 도시 이름 "${cityName}"을(를) 정확히 입력해주세요.`;
      }
    } else if (HIGH_RISK_POPULATION_COMMANDS.has(commandType)) {
      const cityName = getCityName(args.destCityID);
      if (cityName) {
        details.push(`대상 도시: ${cityName}`);
      }
      if (typeof args.amount === 'number') {
        details.push(`이동 인구: ${args.amount.toLocaleString()} 명`);
      }
    } else if (HIGH_RISK_MATERIAL_AID_COMMANDS.has(commandType)) {
      const nationName = getNationName(args.destNationID);
      if (nationName) {
        details.push(`대상 국가: ${nationName}`);
      }
      if (Array.isArray(args.amountList) && args.amountList.length >= 2) {
        const [gold, rice] = args.amountList as [number, number];
        details.push(`금 원조: ${gold.toLocaleString()} 냥`);
        details.push(`쌀 원조: ${rice.toLocaleString()} 석`);
      }
    } else if (HIGH_RISK_DECLARE_WAR_COMMANDS.has(commandType)) {
      const nationName = getNationName(args.destNationID);
      if (nationName) {
        details.push(`대상 국가: ${nationName}`);
      }
      details.push('해당 국가와 전쟁 상태가 되며, 자동으로 되돌릴 수 없습니다.');
    } else if (HIGH_RISK_DIPLOMACY_COMMANDS.has(commandType)) {
      const nationName = getNationName(args.destNationID);
      if (nationName) {
        details.push(`대상 국가: ${nationName}`);
      }

      if (commandType.includes('불가침제의')) {
        if (typeof args.year === 'number' && typeof args.month === 'number') {
          details.push(`불가침 기간: ${args.year}년 ${args.month}월까지`);
        }
        details.push('해당 기간 동안 상호 공격이 제한됩니다.');
      } else if (commandType.includes('불가침파기제의')) {
        details.push('기존 불가침 조약을 파기하는 고위험 외교 명령입니다.');
      } else if (commandType.includes('종전제의')) {
        details.push('상대국과의 전쟁을 종료하기 위한 제의입니다.');
      }
    } else {
      return null;
    }

    details.push('이 명령은 실제 게임 진행에 큰 영향을 줄 수 있습니다.');

    return {
      open: true,
      title: commandName,
      brief,
      details,
      args,
      requireInputLabel,
      expectedInput,
    };
  }

  async function executeReserve(args: any, brief: string) {
    const turnList = turnListParam?.split('_').map(Number) || [0];

    let result: any;
    if (isChief) {
      result = await SammoAPI.NationCommandReserveCommand({
        serverID,
        action: command,
        turnList,
        arg: args,
      });
    } else {
      result = await SammoAPI.CommandReserveCommand({
        serverID,
        general_id: generalID,
        turn_idx: turnList.length > 0 ? turnList[0] : undefined,
        action: command,
        arg: args,
        brief,
      });
    }

    if (result.result ?? result.success) {
      router.push(`/${serverID}/${isChief ? 'chief' : 'game'}`);
    } else {
      alert(result.reason || result.message || '명령 등록에 실패했습니다.');
    }
  }

  async function handleSubmit(args: any, forceExecute = false) {
    if (!command) {
      alert('명령이 지정되지 않았습니다.');
      return;
    }

    const brief = buildBrief(args);

    try {
      const commandType = commandData?.commandType || command;

      if (!forceExecute && commandType) {
        const isHighRisk =
          HIGH_RISK_CITY_COMMANDS.has(commandType) ||
          HIGH_RISK_POPULATION_COMMANDS.has(commandType) ||
          HIGH_RISK_MATERIAL_AID_COMMANDS.has(commandType) ||
          HIGH_RISK_DECLARE_WAR_COMMANDS.has(commandType) ||
          HIGH_RISK_DIPLOMACY_COMMANDS.has(commandType);

        if (isHighRisk) {
          const confirmState = buildHighRiskConfirmState(args, brief);
          if (confirmState) {
            setHighRiskConfirmState(confirmState);
            return;
          }
        }
      }

      await executeReserve(args, brief);
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

    // Wrapper removed to avoid double TopBackBar and layout issues
    const FormWrapper = ({ children }: { children: React.ReactNode }) => (
      <>
        {children}
      </>
    );

    let Component: React.ReactNode = null;

    const submitWithConfirm = (args: any) => handleSubmit(args);
 
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
    } else if (
      [
        '이동',
        '강행',
        '출병',
        '첩보',
        '화계',
        '탈취',
        '파괴',
        '선동',
        'che_이동',
        'che_강행',
        'che_출병',
        'che_첩보',
        'che_화계',
        'che_탈취',
        'che_파괴',
        'che_선동',
        '수몰',
        '백성동원',
        '천도',
        '허보',
        '초토화',
        '증축',
        '감축',
        'che_수몰',
        'che_백성동원',
        'che_천도',
        'che_허보',
        'che_초토화',
        'che_증축',
        'che_감축',
      ].includes(commandType)
    ) {
      const citiesArray = commandData.cities || [];
      const citiesMap = new Map<number, { name: string; info?: string }>();
      for (const [cityId, cityName] of citiesArray) {
        citiesMap.set(cityId, { name: String(cityName) });
      }
      const currentCity = commandData.currentCity || 0;
      const useConfirm = HIGH_RISK_CITY_COMMANDS.has(commandType);
      Component = (
        <MoveCommandForm
          commandName={commandName}
          cities={citiesMap}
          currentCity={currentCity}
          distanceList={commandData.distanceList}
          mapData={commandData.mapData}
          serverID={serverID}
          onSubmit={useConfirm ? submitWithConfirm : handleSubmit}
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
      const useConfirm = HIGH_RISK_MATERIAL_AID_COMMANDS.has(commandType);
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
          onSubmit={useConfirm ? submitWithConfirm : handleSubmit}
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
    } else if (['선전포고', 'che_선전포고', 'declareWar'].includes(commandType)) {
      const useConfirm = HIGH_RISK_DECLARE_WAR_COMMANDS.has(commandType);
      Component = (
        <DeclareWarCommandForm
          commandName={commandName}
          serverID={serverID}
          nations={commandData.nations || []}
          mapData={commandData.mapData}
          onSubmit={useConfirm ? submitWithConfirm : handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (['불가침제의', 'che_불가침제의', 'noAggressionProposal'].includes(commandType)) {
      const useConfirm = HIGH_RISK_DIPLOMACY_COMMANDS.has(commandType);
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
          onSubmit={useConfirm ? submitWithConfirm : handleSubmit}
          onCancel={handleCancel}
        />
      );
    } else if (
      [
        '급습',
        '불가침파기제의',
        '이호경식',
        '종전제의',
        'che_급습',
        'che_불가침파기제의',
        'che_이호경식',
        'che_종전제의',
      ].includes(commandType)
    ) {
      const useConfirm = HIGH_RISK_DIPLOMACY_COMMANDS.has(commandType);
      Component = (
        <NationTargetCommandForm
          commandName={commandName}
          serverID={serverID}
          nations={commandData.nations || []}
          mapData={commandData.mapData}
          onSubmit={useConfirm ? submitWithConfirm : handleSubmit}
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
      const useConfirm = HIGH_RISK_POPULATION_COMMANDS.has(commandType);
      Component = (
        <MovePopulationCommandForm
          commandName={commandName}
          cities={Array.from(citiesMap.entries())}
          minAmount={commandData.minAmount || 0}
          maxAmount={commandData.maxAmount || 0}
          amountGuide={commandData.amountGuide || [100, 500, 1000, 2000, 5000, 10000]}
          onSubmit={useConfirm ? submitWithConfirm : handleSubmit}
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
    } else if (['부대탈퇴지시', 'che_부대탈퇴지시'].includes(commandType)) {
      Component = (
        <GeneralTargetCommandForm
          commandName={commandName}
          generals={commandData.generals || []}
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

  const form = renderCommandForm();

  return (
    <>
      {form}
      {highRiskConfirmState && (
        <HighRiskCommandConfirmModal
          isOpen={highRiskConfirmState.open}
          title={highRiskConfirmState.title}
          brief={highRiskConfirmState.brief}
          details={highRiskConfirmState.details}
          requireInputLabel={highRiskConfirmState.requireInputLabel}
          expectedInput={highRiskConfirmState.expectedInput}
          onCancel={() => setHighRiskConfirmState(null)}
          onConfirm={async () => {
            const state = highRiskConfirmState;
            if (!state) return;
            setHighRiskConfirmState(null);
            await handleSubmit(state.args, true);
          }}
        />
      )}
    </>
  );
}

