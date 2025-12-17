'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';

// ===== 정책 값 설명 =====
const POLICY_VALUE_LABELS: Record<string, { label: string; description: string; unit?: string }> = {
  reqNationGold: { label: '국가 최소 금', description: 'NPC가 행동하기 위한 국가 최소 금 보유량', unit: '금' },
  reqNationRice: { label: '국가 최소 쌀', description: 'NPC가 행동하기 위한 국가 최소 쌀 보유량', unit: '쌀' },
  reqHumanWarUrgentGold: { label: '유저 긴급출병 금', description: '유저장수에게 긴급 출병 포상 시 최소 금', unit: '금' },
  reqHumanWarUrgentRice: { label: '유저 긴급출병 쌀', description: '유저장수에게 긴급 출병 포상 시 최소 쌀', unit: '쌀' },
  reqHumanWarRecommandGold: { label: '유저 출병권장 금', description: '유저장수에게 출병 권장 포상 시 최소 금', unit: '금' },
  reqHumanWarRecommandRice: { label: '유저 출병권장 쌀', description: '유저장수에게 출병 권장 포상 시 최소 쌀', unit: '쌀' },
  reqHumanDevelGold: { label: '유저 내정 금', description: '유저장수에게 내정 포상 시 최소 금', unit: '금' },
  reqHumanDevelRice: { label: '유저 내정 쌀', description: '유저장수에게 내정 포상 시 최소 쌀', unit: '쌀' },
  reqNPCWarGold: { label: 'NPC 출병 금', description: 'NPC에게 출병 포상 시 최소 금', unit: '금' },
  reqNPCWarRice: { label: 'NPC 출병 쌀', description: 'NPC에게 출병 포상 시 최소 쌀', unit: '쌀' },
  reqNPCDevelGold: { label: 'NPC 내정 금', description: 'NPC에게 내정 포상 시 최소 금', unit: '금' },
  reqNPCDevelRice: { label: 'NPC 내정 쌀', description: 'NPC에게 내정 포상 시 최소 쌀', unit: '쌀' },
  minimumResourceActionAmount: { label: '최소 자원 지급량', description: '포상/몰수 시 최소 자원량', unit: '' },
  maximumResourceActionAmount: { label: '최대 자원 지급량', description: '포상/몰수 시 최대 자원량', unit: '' },
  minNPCWarLeadership: { label: 'NPC 출병 최소 통솔', description: 'NPC가 출병하기 위한 최소 통솔력', unit: '' },
  minWarCrew: { label: '최소 출병 병력', description: '출병하기 위한 최소 병력 수', unit: '명' },
  minNPCRecruitCityPopulation: { label: 'NPC 징병 최소 인구', description: 'NPC가 징병하기 위한 도시 최소 인구', unit: '명' },
  safeRecruitCityPopulationRatio: { label: '안전 징병 인구 비율', description: '도시 인구 대비 안전 징병 비율 (0~1)', unit: '' },
  properWarTrainAtmos: { label: '적정 훈련/사기', description: '출병 전 적정 훈련도/사기', unit: '%' },
  cureThreshold: { label: '치료 기준 부상', description: '이 수치 이상 부상 시 요양 명령', unit: '' },
};

// ===== 장수 행동 타입 =====
const GENERAL_ACTION_TYPES = [
  { value: 'NPC사망대비', label: 'NPC 사망대비', description: '사망 전 후계자 지정' },
  { value: '귀환', label: '귀환', description: '본거지로 귀환' },
  { value: '금쌀구매', label: '금쌀 구매', description: '상인에게 자원 구매' },
  { value: '출병', label: '출병', description: '적 도시 공격 (필수)' },
  { value: '긴급내정', label: '긴급 내정', description: '민심 50% 이하 시 내정' },
  { value: '전투준비', label: '전투 준비', description: '훈련/사기 올리기' },
  { value: '전방워프', label: '전방 워프', description: '전선 도시로 이동' },
  { value: 'NPC헌납', label: 'NPC 헌납', description: '국고에 자원 헌납' },
  { value: '징병', label: '징병', description: '병사 모집' },
  { value: '후방워프', label: '후방 워프', description: '후방 도시로 이동' },
  { value: '전쟁내정', label: '전쟁 내정', description: '전시 내정 활동' },
  { value: '소집해제', label: '소집 해제', description: '병사 해산' },
  { value: '일반내정', label: '일반 내정', description: '평시 내정 활동 (필수)' },
  { value: '내정워프', label: '내정 워프', description: '내정 도시로 이동' },
  { value: '모병', label: '모병', description: '고급 병사 모집' },
  { value: '한계징병', label: '한계 징병', description: '최대한 징병' },
  { value: '고급병종', label: '고급 병종', description: '고급 병종 훈련' },
  { value: '상인무시', label: '상인 무시', description: '상인 거래 거부' },
  { value: '국가선택', label: '국가 선택', description: '재야 시 국가 가입' },
  { value: '집합', label: '집합', description: '특정 위치로 집합' },
  { value: '건국', label: '건국', description: '새 국가 건설' },
  { value: '선양', label: '선양', description: '군주 자리 양도' },
];

// ===== 국가 행동 타입 =====
const NATION_ACTION_TYPES = [
  { value: '불가침제의', label: '불가침 제의', description: '다른 국가에 불가침 제안' },
  { value: '선전포고', label: '선전 포고', description: '적국에 전쟁 선포' },
  { value: '천도', label: '천도', description: '수도 이전' },
  { value: '유저장긴급포상', label: '유저 긴급 포상', description: '유저장수에게 긴급 포상' },
  { value: '부대전방발령', label: '부대 전방 발령', description: '부대를 전선으로 이동' },
  { value: '유저장구출발령', label: '유저 구출 발령', description: '포로된 유저장수 구출' },
  { value: '유저장후방발령', label: '유저 후방 발령', description: '유저장수를 후방으로' },
  { value: '부대유저장후방발령', label: '부대 유저 후방', description: '부대의 유저장수를 후방으로' },
  { value: '유저장전방발령', label: '유저 전방 발령', description: '유저장수를 전선으로' },
  { value: '유저장포상', label: '유저 포상', description: '유저장수에게 포상' },
  { value: '부대구출발령', label: '부대 구출 발령', description: '포로된 부대원 구출' },
  { value: '부대후방발령', label: '부대 후방 발령', description: '부대를 후방으로 이동' },
  { value: 'NPC긴급포상', label: 'NPC 긴급 포상', description: 'NPC에게 긴급 포상' },
  { value: 'NPC구출발령', label: 'NPC 구출 발령', description: '포로된 NPC 구출' },
  { value: 'NPC후방발령', label: 'NPC 후방 발령', description: 'NPC를 후방으로' },
  { value: 'NPC포상', label: 'NPC 포상', description: 'NPC에게 포상' },
  { value: 'NPC전방발령', label: 'NPC 전방 발령', description: 'NPC를 전선으로' },
  { value: '유저장내정발령', label: '유저 내정 발령', description: '유저장수에게 내정 지시' },
  { value: 'NPC내정발령', label: 'NPC 내정 발령', description: 'NPC에게 내정 지시' },
  { value: 'NPC몰수', label: 'NPC 몰수', description: 'NPC에게서 자원 몰수' },
];

// ===== PHP 기본 우선순위 =====
const DEFAULT_GENERAL_PRIORITY = [
  'NPC사망대비', '귀환', '금쌀구매', '출병', '긴급내정', '전투준비', '전방워프',
  'NPC헌납', '징병', '후방워프', '전쟁내정', '소집해제', '일반내정', '내정워프'
];

const DEFAULT_NATION_PRIORITY = [
  '불가침제의', '선전포고', '천도', '유저장긴급포상', '부대전방발령', '유저장구출발령',
  '유저장후방발령', '부대유저장후방발령', '유저장전방발령', '유저장포상', '부대구출발령',
  '부대후방발령', 'NPC긴급포상', 'NPC구출발령', 'NPC후방발령', 'NPC포상', 'NPC전방발령',
  '유저장내정발령', 'NPC내정발령', 'NPC몰수'
];

// ===== 프리셋 정의 =====
const PRESETS = {
  default: {
    name: '📋 PHP 기본값',
    description: 'PHP 버전과 동일한 기본 설정',
    generalPriority: [...DEFAULT_GENERAL_PRIORITY],
    nationPriority: [...DEFAULT_NATION_PRIORITY],
    values: {},
  },
  aggressive: {
    name: '🗡️ 공격적',
    description: '출병과 전투를 우선시합니다',
    generalPriority: ['NPC사망대비', '귀환', '출병', '전투준비', '전방워프', '징병', '긴급내정', '일반내정', '내정워프'],
    nationPriority: ['선전포고', '부대전방발령', 'NPC전방발령', '유저장전방발령', '부대구출발령', 'NPC긴급포상', 'NPC포상', '불가침제의'],
    values: { minWarCrew: 1000, properWarTrainAtmos: 80, minNPCWarLeadership: 30 },
  },
  defensive: {
    name: '🛡️ 방어적',
    description: '내정과 도시 발전을 우선시합니다',
    generalPriority: ['NPC사망대비', '귀환', '긴급내정', '전쟁내정', '일반내정', '징병', '전투준비', '출병', '후방워프', '내정워프'],
    nationPriority: ['불가침제의', '부대후방발령', 'NPC후방발령', 'NPC내정발령', '유저장내정발령', 'NPC포상', '부대전방발령'],
    values: { minWarCrew: 3000, properWarTrainAtmos: 95, minNPCWarLeadership: 60 },
  },
  economic: {
    name: '💰 경제 우선',
    description: '자원 확보와 내정에 집중합니다',
    generalPriority: ['NPC사망대비', '금쌀구매', '긴급내정', '일반내정', '전쟁내정', '징병', 'NPC헌납', '출병', '내정워프'],
    nationPriority: ['NPC내정발령', '유저장내정발령', '불가침제의', 'NPC포상', '유저장포상', '부대후방발령', 'NPC후방발령'],
    values: { reqNationGold: 5000, reqNationRice: 5000, reqNPCDevelRice: 1000 },
  },
};

interface NPCControlState {
  nationPolicy?: { values: Record<string, any>; priority: string[] };
  generalPolicy?: { priority: string[] };
}

export default function NPCControlPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [control, setControl] = useState<NPCControlState | null>(null);
  const [nationPolicyValues, setNationPolicyValues] = useState<Record<string, any>>({});
  const [generalPriority, setGeneralPriority] = useState<string[]>([]);
  const [nationPriority, setNationPriority] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'values' | 'general' | 'nation'>('values');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadNPCData();
  }, [serverID]);

  async function loadNPCData() {
    try {
      setLoading(true);
      setErrorMessage(null);
      const result = await SammoAPI.GetNPCControl({ serverID });
      if (!result.result) {
        setErrorMessage(result.reason || 'NPC 정책 정보를 불러올 수 없습니다.');
        setControl(null);
        return;
      }

      const controlData: NPCControlState | null = result.control || result.npcControl || null;
      if (!controlData) {
        setErrorMessage('NPC 정책 정보가 비어 있습니다.');
        setControl(null);
        return;
      }

      setControl(controlData);
      setNationPolicyValues(controlData.nationPolicy?.values || {});
      setGeneralPriority(controlData.generalPolicy?.priority || []);
      setNationPriority(controlData.nationPolicy?.priority || []);
    } catch (err) {
      console.error(err);
      setErrorMessage('NPC 정책 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const handlePolicyNumberChange = (key: string, value: string) => {
    setNationPolicyValues((prev) => ({
      ...prev,
      [key]: value === '' ? 0 : Number(value),
    }));
  };

  const handleSaveNationPolicy = async () => {
    setSavingSection('nationPolicy');
    try {
      const result = await SammoAPI.SetNPCControl({
        type: 'nationPolicy',
        control: nationPolicyValues,
        serverID,
      });
      if (result.result) {
        showToast('국가 정책을 저장했습니다.', 'success');
        await loadNPCData();
      } else {
        showToast(result.reason || '저장 실패', 'error');
      }
    } catch (err) {
      showToast('저장 중 오류 발생', 'error');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePriority = async (type: 'generalPriority' | 'nationPriority') => {
    const priorityList = type === 'generalPriority' ? generalPriority : nationPriority;
    if (priorityList.length === 0) {
      showToast('최소 한 개 이상의 명령을 선택하세요.', 'warning');
      return;
    }

    setSavingSection(type);
    try {
      const result = await SammoAPI.SetNPCControl({ type, control: priorityList, serverID });
      if (result.result) {
        showToast('우선순위를 저장했습니다.', 'success');
        await loadNPCData();
      } else {
        showToast(result.reason || '저장 실패', 'error');
      }
    } catch (err) {
      showToast('저장 중 오류 발생', 'error');
    } finally {
      setSavingSection(null);
    }
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setGeneralPriority(preset.generalPriority);
    setNationPriority(preset.nationPriority);
    setNationPolicyValues((prev) => ({ ...prev, ...preset.values }));
    showToast(`${preset.name} 프리셋 적용됨`, 'success');
  };

  const movePriority = (type: 'general' | 'nation', index: number, direction: 'up' | 'down') => {
    const list = type === 'general' ? [...generalPriority] : [...nationPriority];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    type === 'general' ? setGeneralPriority(list) : setNationPriority(list);
  };

  const addToPriority = (type: 'general' | 'nation', value: string) => {
    if (type === 'general') {
      if (!generalPriority.includes(value)) {
        setGeneralPriority([...generalPriority, value]);
      }
    } else {
      if (!nationPriority.includes(value)) {
        setNationPriority([...nationPriority, value]);
      }
    }
  };

  const removeFromPriority = (type: 'general' | 'nation', value: string) => {
    if (type === 'general') {
      setGeneralPriority(generalPriority.filter((v) => v !== value));
    } else {
      setNationPriority(nationPriority.filter((v) => v !== value));
    }
  };

  const numericPolicyEntries = useMemo(() => {
    return Object.entries(nationPolicyValues).filter(
      ([key, value]) => typeof value === 'number' && !['CombatForce', 'SupportForce', 'DevelopForce'].includes(key)
    );
  }, [nationPolicyValues]);

  const PriorityEditor = ({
    type,
    items,
    allItems,
    onMove,
    onAdd,
    onRemove,
  }: {
    type: 'general' | 'nation';
    items: string[];
    allItems: { value: string; label: string; description: string }[];
    onMove: (index: number, direction: 'up' | 'down') => void;
    onAdd: (value: string) => void;
    onRemove: (value: string) => void;
  }) => {
    const availableItems = allItems.filter((item) => !items.includes(item.value));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 현재 우선순위 */}
        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-2xl">📋</span> 현재 우선순위 ({items.length}개)
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">명령을 추가하세요</p>
            ) : (
              items.map((item, index) => {
                const info = allItems.find((a) => a.value === item);
                return (
                  <div
                    key={item}
                    className="flex items-center gap-2 bg-white/5 rounded-lg p-2 group hover:bg-white/10 transition-colors"
                  >
                    <span className="text-gray-500 w-6 text-center text-sm">{index + 1}</span>
                    <div className="flex-1">
                      <span className="text-white font-medium">{info?.label || item}</span>
                      <p className="text-xs text-gray-500">{info?.description}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => onMove(index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => onRemove(item)}
                        className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 추가 가능한 명령 */}
        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-2xl">➕</span> 추가 가능한 명령
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {availableItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">모든 명령이 추가됨</p>
            ) : (
              availableItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => onAdd(item.value)}
                  className="w-full text-left flex items-center gap-2 bg-white/5 rounded-lg p-2 hover:bg-green-500/20 transition-colors group"
                >
                  <span className="text-green-400 group-hover:scale-125 transition-transform">+</span>
                  <div className="flex-1">
                    <span className="text-gray-300 group-hover:text-white">{item.label}</span>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-4 md:p-6 font-sans">
      <TopBackBar title="NPC 정책 설정" reloadable onReload={loadNPCData} />

      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : errorMessage ? (
        <div className="flex flex-col justify-center items-center h-[50vh] text-red-400">
          <span className="text-4xl mb-4">⚠️</span>
          {errorMessage}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 프리셋 선택 */}
          <div className="bg-gray-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🎯</span> 빠른 프리셋
              </h2>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {showHelp ? '도움말 닫기' : '❓ 도움말'}
              </button>
            </div>

            {showHelp && (
              <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-blue-200">
                <p className="font-semibold mb-2">💡 NPC 정책이란?</p>
                <p>국가 소속 NPC 장수들이 어떤 행동을 우선할지 설정합니다.</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-blue-300">
                  <li><strong>정책 값</strong>: 최소 병력, 출병 조건 등 수치 설정</li>
                  <li><strong>장수 우선순위</strong>: NPC 장수 개인 행동 순서</li>
                  <li><strong>국가 우선순위</strong>: 수뇌/군주의 국가 명령 순서</li>
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as keyof typeof PRESETS)}
                  className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all text-left group"
                >
                  <div className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {preset.name}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex gap-2 border-b border-white/10 pb-2">
            {[
              { key: 'values', label: '📊 정책 값', color: 'blue' },
              { key: 'general', label: '🎖️ 장수 우선순위', color: 'purple' },
              { key: 'nation', label: '🏰 국가 우선순위', color: 'green' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? `bg-${tab.color}-500/20 text-${tab.color}-400 border-b-2 border-${tab.color}-500`
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 정책 값 탭 */}
          {activeTab === 'values' && (
            <div className="bg-gray-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-2xl">📊</span> 국가 정책 값
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {numericPolicyEntries.map(([key, value]) => {
                  const info = POLICY_VALUE_LABELS[key] || { label: key, description: '' };
                  return (
                    <div key={key} className="bg-black/30 rounded-xl p-4 border border-white/5">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {info.label}
                        {info.unit && <span className="text-gray-500 ml-1">({info.unit})</span>}
                      </label>
                      <p className="text-xs text-gray-500 mb-2">{info.description}</p>
                      <input
                        type="number"
                        value={value ?? 0}
                        onChange={(e) => handlePolicyNumberChange(key, e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={handleSaveNationPolicy}
                  disabled={savingSection === 'nationPolicy'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  {savingSection === 'nationPolicy' ? '저장 중...' : '💾 정책 값 저장'}
                </button>
              </div>
            </div>
          )}

          {/* 장수 우선순위 탭 */}
          {activeTab === 'general' && (
            <div className="bg-gray-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-2xl">🎖️</span> 장수 행동 우선순위
                <span className="text-sm font-normal text-gray-400 ml-2">
                  (⚠️ &quot;출병&quot;과 &quot;일반내정&quot;은 필수)
                </span>
              </h2>

              <PriorityEditor
                type="general"
                items={generalPriority}
                allItems={GENERAL_ACTION_TYPES}
                onMove={(idx, dir) => movePriority('general', idx, dir)}
                onAdd={(val) => addToPriority('general', val)}
                onRemove={(val) => removeFromPriority('general', val)}
              />

              <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleSavePriority('generalPriority')}
                  disabled={savingSection === 'generalPriority'}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  {savingSection === 'generalPriority' ? '저장 중...' : '💾 장수 우선순위 저장'}
                </button>
              </div>
            </div>
          )}

          {/* 국가 우선순위 탭 */}
          {activeTab === 'nation' && (
            <div className="bg-gray-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-2xl">🏰</span> 국가 행동 우선순위
                <span className="text-sm font-normal text-gray-400 ml-2">(수뇌/군주 명령)</span>
              </h2>

              <PriorityEditor
                type="nation"
                items={nationPriority}
                allItems={NATION_ACTION_TYPES}
                onMove={(idx, dir) => movePriority('nation', idx, dir)}
                onAdd={(val) => addToPriority('nation', val)}
                onRemove={(val) => removeFromPriority('nation', val)}
              />

              <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleSavePriority('nationPriority')}
                  disabled={savingSection === 'nationPriority'}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  {savingSection === 'nationPriority' ? '저장 중...' : '💾 국가 우선순위 저장'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
