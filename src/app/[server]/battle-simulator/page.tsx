// @ts-nocheck
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { convertLog } from '@/utils/convertLog';

// ============ 상수 정의 ============

const NATION_TYPES = [
  { id: 'che_인', name: '인덕', pros: '상성', cons: '전투' },
  { id: 'che_천', name: '천명', pros: '내정', cons: '군사' },
  { id: 'che_패', name: '패권', pros: '전투', cons: '세금' },
  { id: 'che_왕', name: '왕도', pros: '성장', cons: '내정' },
  { id: 'che_도', name: '도적', pros: '급습', cons: '내정' },
];

const NATION_LEVELS = [
  { level: 0, name: '방랑군' },
  { level: 1, name: '호족' },
  { level: 2, name: '군벌' },
  { level: 3, name: '주자사' },
  { level: 4, name: '주목' },
  { level: 5, name: '공' },
  { level: 6, name: '왕' },
  { level: 7, name: '황제' },
];

const CITY_LEVELS = [
  { level: 1, name: '촌' },
  { level: 2, name: '소도시' },
  { level: 3, name: '중도시' },
  { level: 4, name: '대도시' },
  { level: 5, name: '도읍' },
  { level: 6, name: '거성' },
  { level: 7, name: '요새' },
  { level: 8, name: '주성' },
  { level: 9, name: '기성' },
];

const OFFICER_LEVELS = [
  { level: 1, name: '일반' },
  { level: 2, name: '종사' },
  { level: 3, name: '군사' },
  { level: 4, name: '성주' },
  { level: 9, name: '지장 수뇌' },
  { level: 10, name: '무장 수뇌' },
  { level: 11, name: '참모' },
  { level: 12, name: '군주' },
];

// 병종 기본 데이터 (API에서 로드 실패 시 사용)
const DEFAULT_CREW_TYPES = [
  { id: 1100, name: '도민병', armType: 'FOOTMAN' },
  { id: 1101, name: '창민병', armType: 'FOOTMAN' },
  { id: 1102, name: '정규보병', armType: 'FOOTMAN' },
  { id: 1103, name: '정규창병', armType: 'FOOTMAN' },
  { id: 1104, name: '정규극병', armType: 'FOOTMAN' },
  { id: 1105, name: '방패보병', armType: 'FOOTMAN' },
  { id: 1111, name: '수군', armType: 'FOOTMAN' },
  { id: 1200, name: '단궁병', armType: 'ARCHER' },
  { id: 1201, name: '장궁병', armType: 'ARCHER' },
  { id: 1202, name: '노병', armType: 'ARCHER' },
  { id: 1203, name: '연노병', armType: 'ARCHER' },
  { id: 1300, name: '경기병', armType: 'CAVALRY' },
  { id: 1301, name: '중기병', armType: 'CAVALRY' },
  { id: 1302, name: '창기병', armType: 'CAVALRY' },
  { id: 1303, name: '궁기병', armType: 'CAVALRY' },
  { id: 1400, name: '귀병', armType: 'WIZARD' },
  { id: 1500, name: '충차', armType: 'SIEGE' },
  { id: 1501, name: '벽력거', armType: 'SIEGE' },
];

// 병종 타입 한글 매핑
const ARM_TYPE_NAMES: Record<string, string> = {
  'CASTLE': '성',
  'FOOTMAN': '보병',
  'ARCHER': '궁병',
  'CAVALRY': '기병',
  'WIZARD': '귀병',
  'SIEGE': '차병',
};

interface CrewType {
  id: number;
  name: string;
  armType: string;
}

const DEX_LEVELS = [
  { amount: 0, name: 'E' },
  { amount: 500, name: 'D' },
  { amount: 3000, name: 'C' },
  { amount: 10000, name: 'B' },
  { amount: 30000, name: 'A' },
  { amount: 100000, name: 'S' },
];

const CHARACTERS = [
  { id: 'che_의', name: '의리' },
  { id: 'che_간', name: '간신' },
  { id: 'che_차', name: '차분' },
  { id: 'che_저', name: '저돌' },
  { id: 'che_무', name: '무식' },
  { id: 'che_냉', name: '냉정' },
  { id: 'che_도', name: '도적' },
  { id: 'che_명', name: '명석' },
];

const SPECIAL_WARS = [
  { id: 'None', name: '없음' },
  { id: 'che_돌격', name: '돌격' },
  { id: 'che_기병돌격', name: '기병돌격' },
  { id: 'che_난전', name: '난전' },
  { id: 'che_저격', name: '저격' },
  { id: 'che_속공', name: '속공' },
  { id: 'che_필살', name: '필살' },
  { id: 'che_연사', name: '연사' },
  { id: 'che_반격', name: '반격' },
  { id: 'che_철벽', name: '철벽' },
  { id: 'che_위압', name: '위압' },
  { id: 'che_귀모', name: '귀모' },
  { id: 'che_보조', name: '보조' },
  { id: 'che_격노', name: '격노' },
];

const ITEMS = {
  horse: [
    { id: 'None', name: '-' },
    { id: 'item_적토마', name: '적토마' },
    { id: 'item_절영', name: '절영' },
    { id: 'item_적로', name: '적로' },
    { id: 'item_의란', name: '의란' },
    { id: 'item_백마', name: '백마' },
  ],
  weapon: [
    { id: 'None', name: '-' },
    { id: 'item_방천화극', name: '방천화극' },
    { id: 'item_청룡언월도', name: '청룡언월도' },
    { id: 'item_청강검', name: '청강검' },
    { id: 'item_장팔사모', name: '장팔사모' },
    { id: 'item_철척쌍고', name: '철척쌍고' },
    { id: 'item_쌍철극', name: '쌍철극' },
  ],
  book: [
    { id: 'None', name: '-' },
    { id: 'item_태평요술', name: '태평요술' },
    { id: 'item_둔갑천서', name: '둔갑천서' },
    { id: 'item_병법24편', name: '병법24편' },
    { id: 'item_손자병법', name: '손자병법' },
    { id: 'item_오자병법', name: '오자병법' },
  ],
  item: [
    { id: 'None', name: '-' },
    { id: 'item_칠성검', name: '칠성검' },
    { id: 'item_의천검', name: '의천검' },
    { id: 'item_고정도', name: '고정도' },
    { id: 'item_현철갑', name: '현철갑' },
    { id: 'item_등갑', name: '등갑' },
  ],
};

const DEFENCE_LEVELS = [
  { value: 90, name: '훈사 90' },
  { value: 80, name: '훈사 80' },
  { value: 60, name: '훈사 60' },
  { value: 40, name: '훈사 40' },
  { value: 999, name: '안함' },
];

// ============ 인터페이스 ============

interface NationConfig {
  type: string;
  tech: number;
  level: number;
  cityLevel: number;
  isCapital: boolean;
  def?: number;
  wall?: number;
}

interface GeneralConfig {
  id: number;
  name: string;
  officerLevel: number;
  expLevel: number;
  leadership: number;
  strength: number;
  intel: number;
  horse: string;
  weapon: string;
  book: string;
  item: string;
  injury: number;
  rice: number;
  crewType: number;
  crew: number;
  character: string;
  train: number;
  atmos: number;
  specialWar: string;
  dex1: number;
  dex2: number;
  dex3: number;
  dex4: number;
  dex5: number;
  defenceTrain: number;
  warnum: number;
  killnum: number;
  killcrew: number;
  warAvoidRatio: number;
  warCriticalRatio: number;
  warMagicTrialProb: number;
  opposeWarAvoidRatio: number;
  opposeWarCriticalRatio: number;
  opposeWarMagicTrialProb: number;
}

interface BattleResult {
  datetime: string;
  warcnt: number;
  phase: number;
  killed: number;
  dead: number;
  minKilled?: number;
  maxKilled?: number;
  minDead?: number;
  maxDead?: number;
  attackerRice: number;
  defenderRice: number;
  attackerSkills: string[];
  defenderSkills: string[][];
  battleLog: string;
  detailLog: string;
}

// ============ 기본값 ============

const defaultGeneral: GeneralConfig = {
  id: 0,
  name: '무명',
  officerLevel: 1,
  expLevel: 20,
  leadership: 50,
  strength: 50,
  intel: 50,
  horse: 'None',
  weapon: 'None',
  book: 'None',
  item: 'None',
  injury: 0,
  rice: 5000,
  crewType: 1100,  // 도민병 (기본 병종)
  crew: 7000,
  character: 'che_의',
  train: 100,
  atmos: 100,
  specialWar: 'None',
  dex1: 0,
  dex2: 0,
  dex3: 0,
  dex4: 0,
  dex5: 0,
  defenceTrain: 90,
  warnum: 0,
  killnum: 0,
  killcrew: 0,
  warAvoidRatio: 0,
  warCriticalRatio: 0,
  warMagicTrialProb: 0,
  opposeWarAvoidRatio: 0,
  opposeWarCriticalRatio: 0,
  opposeWarMagicTrialProb: 0,
};

const defaultNation: NationConfig = {
  type: 'che_패',
  tech: 1,
  level: 3,
  cityLevel: 5,
  isCapital: false,
  def: 1000,
  wall: 1000,
};

// ============ 컴포넌트 ============

function NationSettingCard({
  title,
  nation,
  onChange,
  isDefender = false,
}: {
  title: string;
  nation: NationConfig;
  onChange: (nation: NationConfig) => void;
  isDefender?: boolean;
}) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
      <div className={cn(
        "py-2 px-4 font-bold text-white text-center",
        isDefender ? "bg-blue-600/80" : "bg-red-600/80"
      )}>
        {title}
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">국가 성향</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
              value={nation.type}
              onChange={(e) => onChange({ ...nation, type: e.target.value })}
            >
              {NATION_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.pros}/{t.cons})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">기술 등급</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
              value={nation.tech}
              min={0}
              max={12}
              onChange={(e) => onChange({ ...nation, tech: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">국가 위상</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
              value={nation.level}
              onChange={(e) => onChange({ ...nation, level: Number(e.target.value) })}
            >
              {NATION_LEVELS.map((l) => (
                <option key={l.level} value={l.level}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">도시 규모</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
              value={nation.cityLevel}
              onChange={(e) => onChange({ ...nation, cityLevel: Number(e.target.value) })}
            >
              {CITY_LEVELS.map((l) => (
                <option key={l.level} value={l.level}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">수도 여부</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={cn(
                  "flex-1 py-1.5 text-sm font-bold rounded border",
                  nation.isCapital
                    ? "bg-yellow-600 border-yellow-500 text-white"
                    : "bg-black/40 border-white/10 text-gray-400"
                )}
                onClick={() => onChange({ ...nation, isCapital: true })}
              >
                Y
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 py-1.5 text-sm font-bold rounded border",
                  !nation.isCapital
                    ? "bg-gray-600 border-gray-500 text-white"
                    : "bg-black/40 border-white/10 text-gray-400"
                )}
                onClick={() => onChange({ ...nation, isCapital: false })}
              >
                N
              </button>
            </div>
          </div>
        </div>
        {isDefender && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">수비</label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
                value={nation.def || 1000}
                min={10}
                step={10}
                onChange={(e) => onChange({ ...nation, def: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">성벽</label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
                value={nation.wall || 1000}
                min={0}
                step={10}
                onChange={(e) => onChange({ ...nation, wall: Number(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GeneralSettingCard({
  title,
  general,
  onChange,
  onDelete,
  onCopy,
  onImport,
  isDefender = false,
  canDelete = false,
  crewTypes,
}: {
  title: string;
  general: GeneralConfig;
  onChange: (general: GeneralConfig) => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onImport?: () => void;
  isDefender?: boolean;
  canDelete?: boolean;
  crewTypes: CrewType[];
}) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
      <div className={cn(
        "py-2 px-4 font-bold text-white flex justify-between items-center",
        isDefender ? "bg-blue-600/80" : "bg-red-600/80"
      )}>
        <span>{title}</span>
        <div className="flex gap-1">
          {onImport && (
            <button
              type="button"
              onClick={onImport}
              className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 rounded"
            >
              서버에서 가져오기
            </button>
          )}
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 rounded"
            >
              복제
            </button>
          )}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 rounded"
            >
              제거
            </button>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3 text-sm">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">이름</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.name}
              onChange={(e) => onChange({ ...general, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">직위</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.officerLevel}
              onChange={(e) => onChange({ ...general, officerLevel: Number(e.target.value) })}
            >
              {OFFICER_LEVELS.map((l) => (
                <option key={l.level} value={l.level}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">레벨</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.expLevel}
              min={0}
              max={300}
              onChange={(e) => onChange({ ...general, expLevel: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* 능력치 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">통솔</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.leadership}
              min={1}
              max={300}
              onChange={(e) => onChange({ ...general, leadership: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">무력</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.strength}
              min={1}
              max={300}
              onChange={(e) => onChange({ ...general, strength: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">지력</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.intel}
              min={1}
              max={300}
              onChange={(e) => onChange({ ...general, intel: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* 아이템 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">명마</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.horse}
              onChange={(e) => onChange({ ...general, horse: e.target.value })}
            >
              {ITEMS.horse.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">무기</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.weapon}
              onChange={(e) => onChange({ ...general, weapon: e.target.value })}
            >
              {ITEMS.weapon.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">서적</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.book}
              onChange={(e) => onChange({ ...general, book: e.target.value })}
            >
              {ITEMS.book.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">도구</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.item}
              onChange={(e) => onChange({ ...general, item: e.target.value })}
            >
              {ITEMS.item.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 부상, 군량 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">부상 %</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.injury}
              min={0}
              max={80}
              onChange={(e) => onChange({ ...general, injury: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">군량</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.rice}
              min={50}
              max={40000}
              step={50}
              onChange={(e) => onChange({ ...general, rice: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* 병종, 병사, 성격 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">병종</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.crewType}
              onChange={(e) => onChange({ ...general, crewType: Number(e.target.value) })}
            >
              {crewTypes.map((c) => (
                <option key={c.id} value={c.id}>
                  [{ARM_TYPE_NAMES[c.armType] || c.armType}] {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">병사</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.crew}
              min={100}
              step={100}
              onChange={(e) => onChange({ ...general, crew: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">성격</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.character}
              onChange={(e) => onChange({ ...general, character: e.target.value })}
            >
              {CHARACTERS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 훈련, 사기, 전특 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">훈련</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.train}
              min={40}
              max={150}
              onChange={(e) => onChange({ ...general, train: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">사기</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.atmos}
              min={40}
              max={150}
              onChange={(e) => onChange({ ...general, atmos: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">전특</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.specialWar}
              onChange={(e) => onChange({ ...general, specialWar: e.target.value })}
            >
              {SPECIAL_WARS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 숙련 */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { key: 'dex1', label: '보병' },
            { key: 'dex2', label: '궁병' },
            { key: 'dex3', label: '기병' },
            { key: 'dex4', label: '귀병' },
            { key: 'dex5', label: '차병' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-gray-400">{label}</label>
              <select
                className="w-full bg-black/40 border border-white/10 rounded px-1 py-1.5 text-xs"
                value={(general as any)[key]}
                onChange={(e) => onChange({ ...general, [key]: Number(e.target.value) })}
              >
                {DEX_LEVELS.map((d) => (
                  <option key={d.amount} value={d.amount}>{d.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* 수비자 전용: 수비 여부 */}
        {isDefender && (
          <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">수비 여부</label>
              <select
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
                value={general.defenceTrain}
                onChange={(e) => onChange({ ...general, defenceTrain: Number(e.target.value) })}
              >
                {DEFENCE_LEVELS.map((d) => (
                  <option key={d.value} value={d.value}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 전투 통계 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">전투 수</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.warnum}
              onChange={(e) => onChange({ ...general, warnum: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">승리 수</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.killnum}
              onChange={(e) => onChange({ ...general, killnum: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">사살 수</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
              value={general.killcrew}
              onChange={(e) => onChange({ ...general, killcrew: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* 확률 보정 */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="text-xs text-gray-500">자신 확률 보정</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">회피</label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
                value={general.warAvoidRatio}
                min={0}
                max={5}
                onChange={(e) => onChange({ ...general, warAvoidRatio: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">필살</label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
                value={general.warCriticalRatio}
                min={0}
                max={5}
                onChange={(e) => onChange({ ...general, warCriticalRatio: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">계략</label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
                value={general.warMagicTrialProb}
                min={0}
                max={5}
                onChange={(e) => onChange({ ...general, warMagicTrialProb: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">상대 확률 보정</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">회피</label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
                value={general.opposeWarAvoidRatio}
                min={0}
                max={5}
                onChange={(e) => onChange({ ...general, opposeWarAvoidRatio: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">필살</label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
                value={general.opposeWarCriticalRatio}
                min={0}
                max={5}
                onChange={(e) => onChange({ ...general, opposeWarCriticalRatio: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">계략</label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
                value={general.opposeWarMagicTrialProb}
                min={0}
                max={5}
                onChange={(e) => onChange({ ...general, opposeWarMagicTrialProb: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ 메인 컴포넌트 ============

export default function BattleSimulatorPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  // 전역 설정
  const [year, setYear] = useState(200);
  const [month, setMonth] = useState(1);
  const [seed, setSeed] = useState('');
  const [repeatCount, setRepeatCount] = useState(1);

  // 국가 설정
  const [attackerNation, setAttackerNation] = useState<NationConfig>({ ...defaultNation });
  const [defenderNation, setDefenderNation] = useState<NationConfig>({ ...defaultNation, def: 1000, wall: 1000 });

  // 장수 설정
  const [attacker, setAttacker] = useState<GeneralConfig>({ ...defaultGeneral, id: 1 });
  const [defenders, setDefenders] = useState<GeneralConfig[]>([{ ...defaultGeneral, id: 2 }]);

  // 결과
  const [result, setResult] = useState<BattleResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // 병종 데이터
  const [crewTypes, setCrewTypes] = useState<CrewType[]>(DEFAULT_CREW_TYPES);

  // 서버 정보 및 병종 데이터 로드
  useEffect(() => {
    if (serverID) {
      // 서버 기본 정보 로드
      SammoAPI.GetServerBasicInfo({ session_id: serverID }).then((res) => {
        if (res.result && res.game) {
          setYear(res.game.year || 200);
        }
      }).catch(() => {});

      // 병종 데이터 로드
      SammoAPI.GlobalGetConst().then((res) => {
        if (res.result && res.data?.gameUnitConst) {
          const units = res.data.gameUnitConst;
          const loadedCrewTypes: CrewType[] = [];
          
          // units 객체를 순회하여 병종 목록 구성
          for (const [idStr, unitData] of Object.entries(units)) {
            const id = Number(idStr);
            if (!Number.isFinite(id)) continue;
            
            const unit = unitData as any;
            // 성벽(CASTLE)은 제외
            if (unit.type === 'CASTLE') continue;
            
            loadedCrewTypes.push({
              id,
              name: unit.name || `병종 ${id}`,
              armType: unit.type || 'FOOTMAN',
            });
          }
          
          // ID순 정렬
          loadedCrewTypes.sort((a, b) => a.id - b.id);
          
          if (loadedCrewTypes.length > 0) {
            setCrewTypes(loadedCrewTypes);
          }
        }
      }).catch((err) => {
        console.warn('병종 데이터 로드 실패, 기본 데이터 사용:', err);
      });
    }
  }, [serverID]);

  // 수비자 추가
  const addDefender = useCallback(() => {
    const newId = Math.max(...defenders.map(d => d.id), 1) + 1;
    setDefenders([...defenders, { ...defaultGeneral, id: newId }]);
  }, [defenders]);

  // 수비자 제거
  const removeDefender = useCallback((id: number) => {
    if (defenders.length > 1) {
      setDefenders(defenders.filter(d => d.id !== id));
    }
  }, [defenders]);

  // 수비자 복제
  const copyDefender = useCallback((id: number) => {
    const target = defenders.find(d => d.id === id);
    if (target) {
      const newId = Math.max(...defenders.map(d => d.id), 1) + 1;
      setDefenders([...defenders, { ...target, id: newId }]);
    }
  }, [defenders]);

  // 수비자 업데이트
  const updateDefender = useCallback((id: number, data: GeneralConfig) => {
    setDefenders(defenders.map(d => d.id === id ? data : d));
  }, [defenders]);

  // 전투 실행
  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    try {
      // 백엔드가 기대하는 units 배열 형식으로 변환
      const units = [
        {
          id: `attacker-${attacker.id}`,
          type: 'attacker' as const,
          name: attacker.name,
          crew: attacker.crew,
          crewType: attacker.crewType,
          leadership: attacker.leadership,
          strength: attacker.strength,
          intel: attacker.intel,
          train: attacker.train,
          atmos: attacker.atmos,
          officerLevel: attacker.officerLevel,
          expLevel: attacker.expLevel,
          horse: attacker.horse,
          weapon: attacker.weapon,
          book: attacker.book,
          item: attacker.item,
          injury: attacker.injury,
          rice: attacker.rice,
          character: attacker.character,
          specialWar: attacker.specialWar,
          dex1: attacker.dex1,
          dex2: attacker.dex2,
          dex3: attacker.dex3,
          dex4: attacker.dex4,
          dex5: attacker.dex5,
          warnum: attacker.warnum,
          killnum: attacker.killnum,
          killcrew: attacker.killcrew,
          // 국가 정보
          nationLevel: attackerNation.level,
          nationTech: attackerNation.tech,
          nationTypeId: attackerNation.type,
          cityLevel: attackerNation.cityLevel,
          isCapital: attackerNation.isCapital,
        },
        ...defenders.map((d, idx) => ({
          id: `defender-${d.id}`,
          type: 'defender' as const,
          name: d.name,
          crew: d.crew,
          crewType: d.crewType,
          leadership: d.leadership,
          strength: d.strength,
          intel: d.intel,
          train: d.train,
          atmos: d.atmos,
          officerLevel: d.officerLevel,
          expLevel: d.expLevel,
          horse: d.horse,
          weapon: d.weapon,
          book: d.book,
          item: d.item,
          injury: d.injury,
          rice: d.rice,
          character: d.character,
          specialWar: d.specialWar,
          dex1: d.dex1,
          dex2: d.dex2,
          dex3: d.dex3,
          dex4: d.dex4,
          dex5: d.dex5,
          defenceTrain: d.defenceTrain,
          warnum: d.warnum,
          killnum: d.killnum,
          killcrew: d.killcrew,
          // 국가 정보
          nationLevel: defenderNation.level,
          nationTech: defenderNation.tech,
          nationTypeId: defenderNation.type,
          cityLevel: defenderNation.cityLevel,
          isCapital: defenderNation.isCapital,
          cityDef: defenderNation.def,
          cityWall: defenderNation.wall,
        })),
      ];

      const response = await SammoAPI.SimulateBattle({
        year,
        month,
        seed: seed || undefined,
        repeatCount,
        units,
      });

      if (response.result && response.simulation) {
        const battleLog = Array.isArray(response.simulation.battleLog) 
          ? response.simulation.battleLog.join('<br>') 
          : response.simulation.battleLog;
        const detailLog = Array.isArray(response.simulation.detailLog)
          ? response.simulation.detailLog.join('<br>')
          : response.simulation.detailLog;

        setResult({
          datetime: `${year}년 ${month}월`,
          warcnt: response.simulation.warcnt || 1,
          phase: response.simulation.phase || 0,
          killed: response.simulation.killed || 0,
          dead: response.simulation.dead || 0,
          minKilled: response.simulation.minKilled,
          maxKilled: response.simulation.maxKilled,
          minDead: response.simulation.minDead,
          maxDead: response.simulation.maxDead,
          attackerRice: response.simulation.attackerRice || 0,
          defenderRice: response.simulation.defenderRice || 0,
          attackerSkills: response.simulation.attackerSkills || [],
          defenderSkills: response.simulation.defenderSkills || [],
          battleLog: battleLog || '',
          detailLog: detailLog || '',
        });
        showToast('시뮬레이션 완료', 'success');
      } else {
        showToast(response.reason || '시뮬레이션 실패', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('시뮬레이션 중 오류 발생', 'error');
    } finally {
      setIsSimulating(false);
    }
  }, [year, month, seed, repeatCount, attackerNation, attacker, defenders, defenderNation, showToast]);

  // 저장
  const saveConfig = useCallback(() => {
    const config = {
      year,
      month,
      seed,
      repeatCount,
      attackerNation,
      attacker,
      defenderNation,
      defenders,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battle_config_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('설정 저장 완료', 'success');
  }, [year, month, seed, repeatCount, attackerNation, attacker, defenderNation, defenders, showToast]);

  // 불러오기
  const loadConfig = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        if (config.year) setYear(config.year);
        if (config.month) setMonth(config.month);
        if (config.seed) setSeed(config.seed);
        if (config.repeatCount) setRepeatCount(config.repeatCount);
        if (config.attackerNation) setAttackerNation(config.attackerNation);
        if (config.attacker) setAttacker(config.attacker);
        if (config.defenderNation) setDefenderNation(config.defenderNation);
        if (config.defenders) setDefenders(config.defenders);
        showToast('설정 불러오기 완료', 'success');
      } catch (err) {
        showToast('파일 형식 오류', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showToast]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <TopBackBar title="전투 시뮬레이터" />

        {/* 전역 설정 */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg">
          <div className="text-sm font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">전역 설정</div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">연도</label>
              <input
                type="number"
                className="w-24 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">월</label>
              <input
                type="number"
                className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
                value={month}
                min={1}
                max={12}
                onChange={(e) => setMonth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">시드</label>
              <input
                type="text"
                className="w-32 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
                placeholder="랜덤"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">반복 횟수</label>
              <select
                className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
                value={repeatCount}
                onChange={(e) => setRepeatCount(Number(e.target.value))}
              >
                <option value={1}>1회 (로그 표기)</option>
                <option value={1000}>1000회 (요약 표기)</option>
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={runSimulation}
                disabled={isSimulating}
                className={cn(
                  "px-6 py-2 text-sm font-bold rounded shadow-lg transition-colors",
                  isSimulating
                    ? "bg-gray-700 text-gray-400"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20"
                )}
              >
                {isSimulating ? "처리 중..." : "전투"}
              </button>
              <button
                type="button"
                onClick={saveConfig}
                className="px-4 py-2 text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded shadow-lg transition-colors"
              >
                저장
              </button>
              <label className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded shadow-lg transition-colors cursor-pointer">
                불러오기
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={loadConfig}
                />
              </label>
            </div>
          </div>
        </div>

        {/* 출병/수비 설정 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 출병국 */}
          <div className="space-y-4">
            <NationSettingCard
              title="출병국 설정"
              nation={attackerNation}
              onChange={setAttackerNation}
            />
            <GeneralSettingCard
              title="출병자 설정"
              general={attacker}
              onChange={setAttacker}
              crewTypes={crewTypes}
            />
          </div>

          {/* 수비국 */}
          <div className="space-y-4">
            <NationSettingCard
              title="수비국 설정"
              nation={defenderNation}
              onChange={setDefenderNation}
              isDefender
            />
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden">
              <div className="py-2 px-4 font-bold text-white bg-blue-600/80 flex justify-between items-center">
                <span>수비자 설정</span>
                <button
                  type="button"
                  onClick={addDefender}
                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 rounded"
                >
                  + 추가
                </button>
              </div>
            </div>
            {defenders.map((defender, idx) => (
              <GeneralSettingCard
                key={defender.id}
                title={`수비자 ${idx + 1}`}
                general={defender}
                onChange={(data) => updateDefender(defender.id, data)}
                onDelete={() => removeDefender(defender.id)}
                onCopy={() => copyDefender(defender.id)}
                isDefender
                canDelete={defenders.length > 1}
                crewTypes={crewTypes}
              />
            ))}
          </div>
        </div>

        {/* 전투 결과 */}
        {result && (
          <>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
              <div className="py-2 px-4 font-bold text-white bg-purple-600/80">전투 요약</div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-400 w-40">전투 일시</th>
                      <td className="py-2 px-3">{result.datetime}</td>
                    </tr>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-400">전투 횟수</th>
                      <td className="py-2 px-3">{result.warcnt}회</td>
                    </tr>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-400">전투 페이즈</th>
                      <td className="py-2 px-3">{result.phase}</td>
                    </tr>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-400">준 피해</th>
                      <td className="py-2 px-3 text-red-400 font-bold">
                        {result.killed.toLocaleString()}
                        {result.minKilled !== undefined && (
                          <span className="text-gray-500 font-normal">
                            {' '}({result.minKilled.toLocaleString()} ~ {result.maxKilled?.toLocaleString()})
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-400">받은 피해</th>
                      <td className="py-2 px-3 text-blue-400 font-bold">
                        {result.dead.toLocaleString()}
                        {result.minDead !== undefined && (
                          <span className="text-gray-500 font-normal">
                            {' '}({result.minDead.toLocaleString()} ~ {result.maxDead?.toLocaleString()})
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-400">출병자 군량 소모</th>
                      <td className="py-2 px-3">{result.attackerRice.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-400">수비자 군량 소모</th>
                      <td className="py-2 px-3">{result.defenderRice.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-400">공격자 스킬</th>
                      <td className="py-2 px-3">{result.attackerSkills.join(', ') || '-'}</td>
                    </tr>
                    {result.defenderSkills.map((skills, idx) => (
                      <tr key={idx}>
                        <th className="py-2 px-3 text-left text-gray-400">수비자{idx + 1} 스킬</th>
                        <td className="py-2 px-3">{skills.join(', ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
                <div className="py-2 px-4 font-bold text-white bg-orange-600/80">마지막 전투 로그</div>
                <div
                  className="p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar"
                  dangerouslySetInnerHTML={{ __html: convertLog(result.battleLog) || '로그 없음' }}
                />
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
                <div className="py-2 px-4 font-bold text-white bg-teal-600/80">마지막 전투 상세 로그</div>
                <div
                  className="p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar"
                  dangerouslySetInnerHTML={{ __html: convertLog(result.detailLog) || '상세 로그 없음' }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
