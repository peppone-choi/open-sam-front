// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SammoAPI } from "@/lib/api/sammo";
import TopBackBar from "@/components/common/TopBackBar";
import { isBrightColor } from "@/utils/isBrightColor";
import { cn } from "@/lib/utils";
import { 
  formatOfficerLevelText, 
  getOfficerTitle, 
  getNationLevelName as getNationLevelNameUtil, 
  getRulerTitle as getRulerTitleUtil,
  NATION_LEVELS 
} from "@/utils/formatOfficerLevelText";
import { useToast } from "@/contexts/ToastContext";

interface OfficerData {
  meLevel: number;
  nation: {
    nation: number;
    name: string;
    level: number;
    color: string;
    chief_set: number;
  };
  chiefMinLevel: number;
  levelMap: Record<number, {
    name: string;
    city: number;
    cityName: string;
    belong: number;
    picture: string;
    imgsvr: number;
  }>;
  tigers: Array<{ name: string; value: number }>;
  eagles: Array<{ name: string; value: number }>;
  cities: Array<{
    city: number;
    name: string;
    level: number;
    region: number;
    officer_set: number;
    officers: Record<number, {
      name: string;
      city: number;
      cityName: string;
      belong: number;
      npc: number;
    }>;
  }>;
  ambassadors?: Array<{ no: number; name: string; officerLevel: number }>;
  auditors?: Array<{ no: number; name: string; officerLevel: number }>;
  candidateAmbassadors?: Array<{ no: number; name: string; officerLevel: number; selected: boolean }>;
  candidateAuditors?: Array<{ no: number; name: string; officerLevel: number; selected: boolean }>;
}

interface CityAppointmentSelection {
  cityId: number;
  generalId: number;
}

const CITY_LEVELS = ["", "촌", "소", "중", "대", "도", "거", "요", "주", "기"];
const REGION_NAMES: Record<number, string> = {
  0: "중립",
  1: "유주",
  2: "기주",
  3: "청주",
  4: "서주",
  5: "연주",
  6: "예주",
  7: "양주",
  8: "형주",
  9: "익주",
  10: "옹주",
  11: "교주",
  12: "낙양",
  13: "장안",
};

const CHIEF_STAT_MIN = 70;

// 국가 레벨명과 군주 명칭은 @/utils/formatOfficerLevelText에서 import
function getNationLevelName(level: number): string {
  return getNationLevelNameUtil(level);
}

function getRulerTitle(level: number): string {
  return getRulerTitleUtil(level);
}

export default function PersonnelPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [nationData, setNationData] = useState<any>(null);
  const [officerData, setOfficerData] = useState<OfficerData | null>(null);
  const [cityConstMap, setCityConstMap] = useState<any>(null);
  const [generals, setGenerals] = useState<any[]>([]);
  const [chiefSelections, setChiefSelections] = useState<Record<number, number>>({});
  const [appointingLevels, setAppointingLevels] = useState<Record<number, boolean>>({});
  
  // 도시 관직 임명 상태
  const [cityAppointments, setCityAppointments] = useState<Record<number, CityAppointmentSelection>>({
    4: { cityId: 0, generalId: 0 },
    3: { cityId: 0, generalId: 0 },
    2: { cityId: 0, generalId: 0 },
  });
  const [appointingCityLevels, setAppointingCityLevels] = useState<Record<number, boolean>>({});
  
  // 추방 상태
  const [kickTargetId, setKickTargetId] = useState<number>(0);
  const [isKicking, setIsKicking] = useState(false);
  
  // 외교권자/조언자 상태
  const [selectedAmbassadors, setSelectedAmbassadors] = useState<number[]>([]);
  const [selectedAuditors, setSelectedAuditors] = useState<number[]>([]);
  const [isSettingPermission, setIsSettingPermission] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!serverID) {
      setOfficerData(null);
      setNationData(null);
      setCityConstMap(null);
      setGenerals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const frontInfoResult = await SammoAPI.GeneralGetFrontInfo({
        serverID: serverID || "",
        lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace("T", " "),
        lastGeneralRecordID: 0,
        lastGlobalHistoryID: 0,
      }).catch(() => null);

      if (frontInfoResult?.result && frontInfoResult.nation) {
        setNationData(frontInfoResult.nation);
      } else {
        setNationData(null);
      }
      setCityConstMap(frontInfoResult?.cityConstMap ?? null);

      const officerResult = await SammoAPI.GetOfficerInfo({
        session_id: serverID,
      }).catch(() => null);

      setOfficerData(officerResult?.result ? officerResult.officer : null);
      
      // 외교권자/조언자 선택 초기화
      if (officerResult?.result && officerResult.officer) {
        const ambassadorIds = (officerResult.officer.ambassadors || []).map((a: any) => a.no);
        const auditorIds = (officerResult.officer.auditors || []).map((a: any) => a.no);
        setSelectedAmbassadors(ambassadorIds);
        setSelectedAuditors(auditorIds);
      }

      const generalsResult = await SammoAPI.NationGetGenerals({ serverID }).catch(() => null);
      if (generalsResult?.result) {
        setGenerals(generalsResult.generals ?? generalsResult.list ?? []);
      } else {
        setGenerals([]);
      }
      setAppointingLevels({});
    } catch (err) {
      console.error(err);
      showToast("인사부 정보를 불러오는데 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  useEffect(() => {
    if (!serverID) {
      return;
    }
    void loadAllData();
  }, [serverID, loadAllData]);

  const handleChiefSelectionChange = useCallback((level: number, generalId: number) => {
    setChiefSelections((prev) => ({
      ...prev,
      [level]: generalId,
    }));
  }, []);

  const handleChiefAppoint = useCallback(
    async (level: number, options?: { cityId?: number }) => {
      if (!serverID) {
        return;
      }

      const selectedGeneral = chiefSelections[level] ?? 0;
      const officerLevelText = formatOfficerLevelText(
        level,
        officerData?.nation.level ?? nationData?.level ?? 0,
        cityConstMap?.officerTitles
      );

      if (level >= 5) {
        if (!selectedGeneral) {
          if (!window.confirm(`${officerLevelText} 직을 비우시겠습니까?`)) {
            return;
          }
        } else {
          const target = generals.find((gen) => (gen.no ?? gen.id ?? gen.generalNo) === selectedGeneral);
          const generalName = target?.name ?? "선택된 장수";
          if (!window.confirm(`${generalName}을 ${officerLevelText} 직에 임명하시겠습니까?`)) {
            return;
          }
        }
      }

      setAppointingLevels((prev) => ({ ...prev, [level]: true }));
      try {
        const result = await SammoAPI.OfficerAppoint({
          serverID,
          officerLevel: level,
          destGeneralID: selectedGeneral,
          destCityID: options?.cityId,
        });
        if (!result?.result) {
          showToast(result?.reason ?? "임명에 실패했습니다.", "error");
          return;
        }
        await loadAllData();
      } catch (err) {
        console.error(err);
        showToast("임명 요청 중 오류가 발생했습니다.", "error");
      } finally {
        setAppointingLevels((prev) => ({ ...prev, [level]: false }));
      }
    },
    [chiefSelections, cityConstMap?.officerTitles, generals, officerData?.nation.level, loadAllData, nationData?.level, serverID]
  );

  // 도시 관직 임명 핸들러
  const handleCityAppointmentChange = useCallback((level: number, field: 'cityId' | 'generalId', value: number) => {
    setCityAppointments((prev) => ({
      ...prev,
      [level]: { ...prev[level], [field]: value },
    }));
  }, []);

  const handleCityAppoint = useCallback(
    async (level: number) => {
      if (!serverID) return;

      const { cityId, generalId } = cityAppointments[level] || {};
      if (!cityId) {
        showToast("도시를 선택해주세요.", "warning");
        return;
      }

      const officerLevelText = formatOfficerLevelText(
        level,
        officerData?.nation.level ?? nationData?.level ?? 0,
        cityConstMap?.officerTitles
      );

      const cityName = officerData?.cities.find((c) => c.city === cityId)?.name ?? `도시 ${cityId}`;

      if (generalId) {
        const target = generals.find((gen) => (gen.no ?? gen.id ?? gen.generalNo) === generalId);
        const generalName = target?.name ?? "선택된 장수";
        if (!window.confirm(`${generalName}을(를) ${cityName}의 ${officerLevelText}로 임명하시겠습니까?`)) {
          return;
        }
      } else {
        if (!window.confirm(`${cityName}의 ${officerLevelText} 직을 비우시겠습니까?`)) {
          return;
        }
      }

      setAppointingCityLevels((prev) => ({ ...prev, [level]: true }));
      try {
        const result = await SammoAPI.OfficerAppoint({
          serverID,
          officerLevel: level,
          destGeneralID: generalId || 0,
          destCityID: cityId,
        });
        if (!result?.result) {
          showToast(result?.reason ?? "임명에 실패했습니다.", "error");
          return;
        }
        showToast("임명에 성공했습니다.", "success");
        await loadAllData();
      } catch (err) {
        console.error(err);
        showToast("임명 요청 중 오류가 발생했습니다.", "error");
      } finally {
        setAppointingCityLevels((prev) => ({ ...prev, [level]: false }));
      }
    },
    [cityAppointments, cityConstMap?.officerTitles, generals, loadAllData, nationData?.level, officerData?.cities, officerData?.nation.level, serverID, showToast]
  );

  // 추방 핸들러
  const handleKick = useCallback(async () => {
    if (!serverID || !kickTargetId) {
      showToast("추방할 장수를 선택해주세요.", "warning");
      return;
    }

    const target = generals.find((gen) => (gen.no ?? gen.id ?? gen.generalNo) === kickTargetId);
    const generalName = target?.name ?? "선택된 장수";

    if (!window.confirm(`정말 ${generalName}을(를) 추방하시겠습니까?\n추방된 장수는 재야가 되며, 금/쌀의 일부가 국고로 귀속됩니다.`)) {
      return;
    }

    setIsKicking(true);
    try {
      const result = await SammoAPI.KickGeneral({
        serverID,
        destGeneralID: kickTargetId,
      });
      if (!result?.result) {
        showToast(result?.reason ?? "추방에 실패했습니다.", "error");
        return;
      }
      showToast(`${generalName}을(를) 추방했습니다.`, "success");
      setKickTargetId(0);
      await loadAllData();
    } catch (err) {
      console.error(err);
      showToast("추방 요청 중 오류가 발생했습니다.", "error");
    } finally {
      setIsKicking(false);
    }
  }, [generals, kickTargetId, loadAllData, serverID, showToast]);

  // 외교권자/조언자 임명 핸들러
  const handleSetPermission = useCallback(async (type: 'ambassador' | 'auditor') => {
    if (!serverID) return;

    const selectedIds = type === 'ambassador' ? selectedAmbassadors : selectedAuditors;
    const typeName = type === 'ambassador' ? '외교권자' : '조언자';

    if (!window.confirm(`선택한 장수들을 ${typeName}로 임명하시겠습니까?`)) {
      return;
    }

    setIsSettingPermission(true);
    try {
      const result = await SammoAPI.SetGeneralPermission({
        session_id: serverID,
        isAmbassador: type === 'ambassador',
        genlist: selectedIds,
      });
      if (!result?.result) {
        showToast(result?.reason ?? `${typeName} 임명에 실패했습니다.`, "error");
        return;
      }
      showToast(`${typeName} 임명에 성공했습니다.`, "success");
      await loadAllData();
    } catch (err) {
      console.error(err);
      showToast(`${typeName} 임명 요청 중 오류가 발생했습니다.`, "error");
    } finally {
      setIsSettingPermission(false);
    }
  }, [loadAllData, selectedAmbassadors, selectedAuditors, serverID, showToast]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="인 사 부" reloadable onReload={loadAllData} />

      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-8">
          <PersonnelTables
            officerData={officerData}
            officerTitles={cityConstMap?.officerTitles}
            generals={generals}
            canAppointChief={Boolean(officerData && officerData.meLevel >= 5)}
            chiefSelections={chiefSelections}
            onChangeSelection={handleChiefSelectionChange}
            onAppoint={handleChiefAppoint}
            appointingLevels={appointingLevels}
            cityAppointments={cityAppointments}
            onChangeCityAppointment={handleCityAppointmentChange}
            onCityAppoint={handleCityAppoint}
            appointingCityLevels={appointingCityLevels}
            kickTargetId={kickTargetId}
            onKickTargetChange={setKickTargetId}
            onKick={handleKick}
            isKicking={isKicking}
            selectedAmbassadors={selectedAmbassadors}
            onAmbassadorsChange={setSelectedAmbassadors}
            selectedAuditors={selectedAuditors}
            onAuditorsChange={setSelectedAuditors}
            onSetPermission={handleSetPermission}
            isSettingPermission={isSettingPermission}
          />
        </div>
      )}
    </div>
  );
}

function PersonnelTables({
  officerData,
  officerTitles,
  generals,
  canAppointChief,
  chiefSelections,
  onChangeSelection,
  onAppoint,
  appointingLevels,
  cityAppointments,
  onChangeCityAppointment,
  onCityAppoint,
  appointingCityLevels,
  kickTargetId,
  onKickTargetChange,
  onKick,
  isKicking,
  selectedAmbassadors,
  onAmbassadorsChange,
  selectedAuditors,
  onAuditorsChange,
  onSetPermission,
  isSettingPermission,
}: {
  officerData: OfficerData | null;
  officerTitles?: Record<string, Record<string, string>>;
  generals: any[];
  canAppointChief: boolean;
  chiefSelections: Record<number, number>;
  onChangeSelection: (level: number, generalId: number) => void;
  onAppoint: (level: number) => void | Promise<void>;
  appointingLevels: Record<number, boolean>;
  cityAppointments: Record<number, CityAppointmentSelection>;
  onChangeCityAppointment: (level: number, field: 'cityId' | 'generalId', value: number) => void;
  onCityAppoint: (level: number) => void | Promise<void>;
  appointingCityLevels: Record<number, boolean>;
  kickTargetId: number;
  onKickTargetChange: (id: number) => void;
  onKick: () => void | Promise<void>;
  isKicking: boolean;
  selectedAmbassadors: number[];
  onAmbassadorsChange: (ids: number[]) => void;
  selectedAuditors: number[];
  onAuditorsChange: (ids: number[]) => void;
  onSetPermission: (type: 'ambassador' | 'auditor') => void | Promise<void>;
  isSettingPermission: boolean;
  selectedAmbassadors: number[];
  onAmbassadorsChange: (ids: number[]) => void;
  selectedAuditors: number[];
  onAuditorsChange: (ids: number[]) => void;
  onSetPermission: (type: 'ambassador' | 'auditor') => void | Promise<void>;
  isSettingPermission: boolean;
}) {
  const cityNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (officerData?.cities ?? []).forEach((city) => {
      map.set(city.city, city.name);
    });
    return map;
  }, [officerData?.cities]);

  const normalizedGenerals = useMemo(
    () =>
      (generals || []).map((gen) => ({
        no: gen.no ?? gen.id ?? gen.generalNo,
        name: gen.name,
        city: gen.city ?? gen.cityID ?? 0,
        strength: gen.strength ?? 0,
        intel: gen.intel ?? 0,
        leadership: gen.leadership ?? 0,
        politics: gen.politics ?? 0,
        charm: gen.charm ?? 0,
        officer_level: gen.officer_level ?? gen.officerLevel ?? 0,
        npc: gen.npc ?? 0,
      })),
    [generals]
  );

  const candidateAny = useMemo(() => normalizedGenerals.filter((gen) => gen.no && gen.officer_level !== 12), [normalizedGenerals]);
  const candidateStrength = useMemo(
    () => candidateAny.filter((gen) => (gen.strength ?? 0) >= CHIEF_STAT_MIN),
    [candidateAny]
  );
  const candidateIntel = useMemo(
    () => candidateAny.filter((gen) => (gen.intel ?? 0) >= CHIEF_STAT_MIN),
    [candidateAny]
  );

  if (!officerData) {
    return (
      <div className="bg-gray-900/50 border border-white/5 rounded-xl p-6 text-center text-gray-400">
        관직 정보를 불러올 수 없습니다.
      </div>
    );
  }

  const { nation, levelMap, tigers, eagles, cities, chiefMinLevel } = officerData;
  const displayColor = nation.color;
  const textColor = isBrightColor(displayColor) ? "#111827" : "#ffffff";
  const chiefSet = nation.chief_set || 0;

  const getCandidatesForLevel = (level: number) => {
    if (level === 11) return candidateAny;
    return level % 2 === 0 ? candidateStrength : candidateIntel;
  };

  const getOfficerTitle = (level: number) => formatOfficerLevelText(level, nation.level, officerTitles);

  const renderChiefCell = (level: number, info?: any) => {
    const isLocked = (chiefSet & (1 << level)) !== 0;
    const candidates = getCandidatesForLevel(level);
    const selectionValue = chiefSelections[level] ?? 0;
    const isProcessing = appointingLevels[level];

    // 군주(level 12)는 자신의 직위를 수정할 수 없음
    const isMonarchPosition = level === 12 && officerData.meLevel === 12;

    return (
      <div className="flex flex-col gap-2">
        {info?.name ? (
          <span className="text-white">
            {info.name}
            <span className="text-gray-500 text-xs">
              ({info.belong}년)
              {info.cityName ? ` 【${info.cityName}】` : ""}
            </span>
          </span>
        ) : (
          <span className="text-gray-500">-</span>
        )}
        {canAppointChief && !isMonarchPosition && (
          isLocked ? (
            <span className="text-xs text-amber-400">이번 턴에는 이미 임명했습니다.</span>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                className="bg-black/60 border border-white/10 rounded px-2 py-1 text-sm"
                value={selectionValue}
                onChange={(e) => onChangeSelection(level, Number(e.target.value))}
              >
                <option value={0}>공석으로 변경</option>
                {candidates.map((gen) => {
                  const candidateCityName = gen.city ? cityNameMap.get(gen.city) || `도시 ${gen.city}` : '';
                  return (
                    <option key={gen.no} value={gen.no}>
                      {gen.name}
                      {gen.city ? ` 【${candidateCityName}】` : ""} ({gen.leadership}/{gen.strength}/{gen.intel}/{gen.politics}/{gen.charm})
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors border border-white/10 ${isProcessing ? "bg-gray-700 text-gray-400" : "bg-blue-600 hover:bg-blue-500"
                  }`}
                onClick={() => onAppoint(level)}
                disabled={isProcessing}
              >
                {isProcessing ? "처리 중" : "임명"}
              </button>
            </div>
          )
        )}
      </div>
    );
  };

  const officerRows: React.ReactElement[] = [];
  for (let i = 12; i >= chiefMinLevel; i -= 2) {
    const i1 = i;
    const i2 = i - 1;
    const officer1 = levelMap[i1] || { name: "-", belong: "-" };
    const officer2 = levelMap[i2] || { name: "-", belong: "-" };
    officerRows.push(
      <tr key={i} className="border-b border-white/5">
        <td className="py-2 px-4 font-bold text-blue-300 bg-black/20">
          {getOfficerTitle(i1)}
        </td>
        <td className="py-2 px-4">{renderChiefCell(i1, officer1)}</td>
        <td className="py-2 px-4 font-bold text-blue-300 bg-black/20 border-l border-white/5">
          {getOfficerTitle(i2)}
        </td>
        <td className="py-2 px-4">{renderChiefCell(i2, officer2)}</td>
      </tr>
    );
  }

  const groupedCities: Record<number, typeof cities> = {};
  cities.forEach((city) => {
    if (!groupedCities[city.region]) {
      groupedCities[city.region] = [];
    }
    groupedCities[city.region].push(city);
  });

  const sortedRegions = Object.keys(groupedCities)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
        <div
          className="py-4 px-6 text-center font-bold text-xl"
          style={{ backgroundColor: displayColor, color: textColor }}
        >
          【 {nation.name} 】 중앙 관직
        </div>
        <div className="py-2 px-4 text-xs text-center bg-black/30 text-gray-400 border-b border-white/5">
          국가 작위: <span className="text-yellow-400 font-bold">{getNationLevelName(nation.level)}</span> | 
          군주 칭호: <span className="text-purple-400 font-bold">{getRulerTitle(nation.level)}</span> | 
          임명 가능 관직: <span className="text-cyan-400">{getOfficerTitle(chiefMinLevel)} ~ {getRulerTitle(nation.level)}</span> (레벨 {chiefMinLevel}~12)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <tbody>
              {officerRows}
              <tr className="bg-black/30 border-t border-white/10">
                <td className="py-3 px-4 font-bold text-yellow-500 whitespace-nowrap">오호장군【승전】</td>
                <td colSpan={3} className="py-3 px-4 text-gray-300">
                  {tigers.length > 0
                    ? tigers.map((t, i) => (
                      <span key={`${t.name}-${i}`}>
                        {t.name}
                        <span className="text-gray-500">【{t.value.toLocaleString()}】</span>
                        {i < tigers.length - 1 ? ", " : ""}
                      </span>
                    ))
                    : "-"}
                </td>
              </tr>
              <tr className="bg-black/30 border-t border-white/5">
                <td className="py-3 px-4 font-bold text-green-500 whitespace-nowrap">건안칠자【계략】</td>
                <td colSpan={3} className="py-3 px-4 text-gray-300">
                  {eagles.length > 0
                    ? eagles.map((e, i) => (
                      <span key={`${e.name}-${i}`}>
                        {e.name}
                        <span className="text-gray-500">【{e.value.toLocaleString()}】</span>
                        {i < eagles.length - 1 ? ", " : ""}
                      </span>
                    ))
                    : "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 외교권자/조언자 임명 섹션 (군주 전용) */}
      {officerData.meLevel === 12 && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
          <div className="py-3 px-6 text-center font-bold bg-purple-600/80 text-white">
            외 교 권 자 임 명
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 외교권자 */}
              <div className="flex-1 p-3 bg-black/20 rounded-lg border border-white/5">
                <div className="text-sm font-bold text-purple-300 mb-2">외교권자 (최대 2명)</div>
                <select
                  multiple
                  className="w-full h-32 bg-black/60 border border-white/10 rounded px-3 py-2 text-sm"
                  value={selectedAmbassadors.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                    if (selected.length <= 2) {
                      onAmbassadorsChange(selected);
                    }
                  }}
                >
                  {(officerData.candidateAmbassadors || []).map((gen) => (
                    <option 
                      key={gen.no} 
                      value={gen.no}
                      style={{ color: gen.selected ? '#a855f7' : 'inherit' }}
                    >
                      {gen.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={cn(
                    "w-full mt-2 px-4 py-2 text-sm font-bold rounded transition-colors border border-white/10",
                    isSettingPermission ? "bg-gray-700 text-gray-400" : "bg-purple-600 hover:bg-purple-500 text-white"
                  )}
                  onClick={() => onSetPermission('ambassador')}
                  disabled={isSettingPermission}
                >
                  {isSettingPermission ? "처리 중" : "임명"}
                </button>
              </div>
              
              {/* 조언자 */}
              <div className="flex-1 p-3 bg-black/20 rounded-lg border border-white/5">
                <div className="text-sm font-bold text-purple-300 mb-2">조언자</div>
                <select
                  multiple
                  className="w-full h-32 bg-black/60 border border-white/10 rounded px-3 py-2 text-sm"
                  value={selectedAuditors.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                    onAuditorsChange(selected);
                  }}
                >
                  {(officerData.candidateAuditors || []).map((gen) => (
                    <option 
                      key={gen.no} 
                      value={gen.no}
                      style={{ color: gen.selected ? '#a855f7' : 'inherit' }}
                    >
                      {gen.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={cn(
                    "w-full mt-2 px-4 py-2 text-sm font-bold rounded transition-colors border border-white/10",
                    isSettingPermission ? "bg-gray-700 text-gray-400" : "bg-purple-600 hover:bg-purple-500 text-white"
                  )}
                  onClick={() => onSetPermission('auditor')}
                  disabled={isSettingPermission}
                >
                  {isSettingPermission ? "처리 중" : "임명"}
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              ※ <span className="text-purple-400">보라색</span>은 현재 임명된 장수입니다. 외교권자는 사관 24개월 이상, 조언자는 사관 12개월 이상이어야 합니다.
            </div>
          </div>
        </div>
      )}

      {/* 도시 관직 임명 섹션 */}
      {canAppointChief && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
          <div className="py-3 px-6 text-center font-bold bg-orange-600/80 text-white">
            도 시 관 직 임 명
          </div>
          <div className="p-4 space-y-4">
            {[4, 3, 2].map((level) => {
              const officerTitle = getOfficerTitle(level);
              const candidates = level === 4 ? candidateStrength : level === 3 ? candidateIntel : candidateAny;
              const selection = cityAppointments[level] || { cityId: 0, generalId: 0 };
              const isProcessing = appointingCityLevels[level];
              
              // 임명 가능한 도시 (officer_set에서 해당 레벨이 설정되지 않은 도시)
              const availableCities = cities.filter((city) => {
                const mask = 1 << level;
                return ((city.officer_set || 0) & mask) === 0;
              });

              return (
                <div key={level} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                  <div className="w-24 text-sm font-bold text-orange-300 flex-shrink-0">
                    {officerTitle} 임명
                  </div>
                  <div className="flex flex-col sm:flex-row flex-1 gap-2">
                    <select
                      className="flex-1 bg-black/60 border border-white/10 rounded px-3 py-2 text-sm"
                      value={selection.cityId}
                      onChange={(e) => onChangeCityAppointment(level, 'cityId', Number(e.target.value))}
                    >
                      <option value={0}>도시 선택...</option>
                      {sortedRegions.map((region) => (
                        <optgroup key={region} label={`【 ${REGION_NAMES[region] || "기타"} 】`}>
                          {(groupedCities[region] || [])
                            .filter((city) => availableCities.some((ac) => ac.city === city.city))
                            .map((city) => (
                              <option key={city.city} value={city.city}>
                                {city.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                    <select
                      className="flex-1 bg-black/60 border border-white/10 rounded px-3 py-2 text-sm"
                      value={selection.generalId}
                      onChange={(e) => onChangeCityAppointment(level, 'generalId', Number(e.target.value))}
                    >
                      <option value={0}>____공석____</option>
                      {candidates.map((gen) => {
                        const isCurrentOfficer = gen.officer_level === level;
                        const isOtherOfficer = gen.officer_level > 1;
                        const genCityName = gen.city ? cityNameMap.get(gen.city) || `도시 ${gen.city}` : '';
                        return (
                          <option
                            key={gen.no}
                            value={gen.no}
                            style={{ color: isCurrentOfficer ? '#ef4444' : isOtherOfficer ? '#f97316' : 'inherit' }}
                          >
                            {gen.name}
                            {gen.city ? ` 【${genCityName}】` : ''} ({gen.leadership}/{gen.strength}/{gen.intel}/{gen.politics}/{gen.charm})
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      className={cn(
                        "px-4 py-2 text-sm font-bold rounded transition-colors border border-white/10 flex-shrink-0",
                        isProcessing ? "bg-gray-700 text-gray-400" : "bg-orange-600 hover:bg-orange-500 text-white"
                      )}
                      onClick={() => onCityAppoint(level)}
                      disabled={isProcessing || !selection.cityId}
                    >
                      {isProcessing ? "처리 중" : "임명"}
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-gray-500 text-center mt-2">
              ※ <span className="text-red-400">빨간색</span>은 현재 임명중인 장수, <span className="text-orange-400">노란색</span>은 다른 관직에 임명된 장수, 흰색은 일반 장수를 뜻합니다.
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-800/80 text-gray-300 border-b border-white/10">
                <th className="py-3 px-4 whitespace-nowrap" colSpan={2}>
                  도시
                </th>
                <th className="py-3 px-4 whitespace-nowrap">성 주 (사관) 【현재도시】</th>
                <th className="py-3 px-4 whitespace-nowrap">군 사 (사관) 【현재도시】</th>
                <th className="py-3 px-4 whitespace-nowrap">종 사 (사관) 【현재도시】</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedRegions.map((region) => {
                const regionCities = groupedCities[region];
                return (
                  <React.Fragment key={region}>
                    <tr className="bg-gray-800/30">
                      <td colSpan={5} className="py-2 px-4 font-bold text-blue-400 border-b border-white/5">
                        【 {REGION_NAMES[region] || "기타"} 】
                      </td>
                    </tr>
                    {regionCities.map((city) => {
                      const officer4 = city.officers[4];
                      const officer3 = city.officers[3];
                      const officer2 = city.officers[2];

                      const isOfficerSet = (level: number) => {
                        const mask = 1 << level;
                        return ((city.officer_set || 0) & mask) !== 0;
                      };

                      return (
                        <tr key={city.city} className="hover:bg-white/5">
                          <td
                            className="py-3 px-4 text-center w-12 font-bold"
                            style={{ backgroundColor: displayColor, color: textColor }}
                          >
                            {CITY_LEVELS[city.level] || "-"}
                          </td>
                          <td
                            className="py-3 px-4 font-medium"
                            style={{ backgroundColor: displayColor, color: textColor }}
                          >
                            {city.name}
                          </td>
                          <td className={cn("py-3 px-4", isOfficerSet(4) ? "text-orange-400" : "text-gray-300")}>
                            {officer4
                              ? `${officer4.name}(${officer4.belong}년) 【${officer4.cityName}】`
                              : "-"}
                          </td>
                          <td className={cn("py-3 px-4", isOfficerSet(3) ? "text-orange-400" : "text-gray-300")}>
                            {officer3
                              ? `${officer3.name}(${officer3.belong}년) 【${officer3.cityName}】`
                              : "-"}
                          </td>
                          <td className={cn("py-3 px-4", isOfficerSet(2) ? "text-orange-400" : "text-gray-300")}>
                            {officer2
                              ? `${officer2.name}(${officer2.belong}년) 【${officer2.cityName}】`
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-black/20 text-xs text-center border-t border-white/5">
          <span className="text-orange-400">※ 노란색</span>은 변경 불가능, <span className="text-gray-400">회색</span>은 변경 가능 관직입니다.
        </div>
      </div>

      {/* 추방 섹션 */}
      {canAppointChief && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
          <div className="py-3 px-6 text-center font-bold bg-red-600/80 text-white">
            추 방
          </div>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
              <div className="w-24 text-sm font-bold text-red-300 flex-shrink-0">
                대상 장수
              </div>
              <div className="flex flex-col sm:flex-row flex-1 gap-2">
                <select
                  className="flex-1 bg-black/60 border border-white/10 rounded px-3 py-2 text-sm"
                  value={kickTargetId}
                  onChange={(e) => onKickTargetChange(Number(e.target.value))}
                >
                  <option value={0}>장수 선택...</option>
                  {candidateAny
                    .filter((gen) => gen.officer_level !== 12) // 군주는 추방 불가
                    .map((gen) => {
                      const genCityName = gen.city ? cityNameMap.get(gen.city) || `도시 ${gen.city}` : '';
                      return (
                        <option key={gen.no} value={gen.no}>
                          {gen.name}
                          {gen.city ? ` 【${genCityName}】` : ''} ({gen.leadership}/{gen.strength}/{gen.intel}/{gen.politics}/{gen.charm})
                        </option>
                      );
                    })}
                </select>
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 text-sm font-bold rounded transition-colors border border-white/10 flex-shrink-0",
                    isKicking ? "bg-gray-700 text-gray-400" : "bg-red-600 hover:bg-red-500 text-white"
                  )}
                  onClick={onKick}
                  disabled={isKicking || !kickTargetId}
                >
                  {isKicking ? "처리 중" : "추방"}
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center mt-3">
              ※ 추방된 장수는 재야가 되며, 금/쌀의 일부가 국고로 귀속됩니다. 초반 3년간은 군주에게 부상이 증가합니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
