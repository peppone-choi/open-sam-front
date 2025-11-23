'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './PartialReservedCommand.module.css';
import CommandSelectDialog from './CommandSelectDialog';
import type { ColorSystem } from '@/types/colorSystem';

interface ChiefReservedCommandProps {
  serverID: string;
  colorSystem?: ColorSystem;
  maxChiefTurn?: number;
}

interface ChiefTurnCommand {
  action: string;
  brief: string;
  arg: any;
  year?: number;
  month?: number;
  time?: string;
}

interface CommandItem {
  value: string;
  simpleName: string;
  reqArg: number;
  possible: boolean;
  compensation: number;
  title: string;
}

interface CommandTableCategory {
  category: string;
  values: CommandItem[];
}

interface StoredMacroAction {
  offsets: number[];
  action: string;
  arg: any;
  brief: string;
}

interface StoredMacro {
  name: string;
  actions: StoredMacroAction[];
  length: number;
}

interface ChiefRosterEntry {
  level: number;
  title: string;
  name: string | null;
  npcType: number | null;
  turnPreview: Array<{ time: string; brief: string }>;
  isSelf: boolean;
}

const DEFAULT_MAX_CHIEF_TURN = 2;
const MACRO_STORAGE_PREFIX = 'nation-chief-macro';

function buildMacroStorageKey(
  serverId: string,
  mapName?: string | null,
  unitSet?: string | null,
  officerLevel?: number | null,
) {
  const safeServer = serverId || 'session';
  const safeMap = mapName || 'map';
  const safeUnit = unitSet || 'unit';
  const safeLevel = typeof officerLevel === 'number' ? officerLevel.toString() : 'all';
  return [MACRO_STORAGE_PREFIX, safeServer, safeMap, safeUnit, safeLevel].join(':');
}

export default function ChiefReservedCommand({ serverID, colorSystem, maxChiefTurn: maxChiefTurnProp }: ChiefReservedCommandProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChiefTurnCommand[]>([]);
  const [officerLevel, setOfficerLevel] = useState<number | null>(null);
  const [isChief, setIsChief] = useState(false);
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [maxChiefTurn, setMaxChiefTurn] = useState<number>(maxChiefTurnProp ?? DEFAULT_MAX_CHIEF_TURN);

  const [generalId, setGeneralId] = useState<number | null>(null);
  const [commandTable, setCommandTable] = useState<CommandTableCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurnIndex, setEditingTurnIndex] = useState<number | null>(null);
  const [selectedTurns, setSelectedTurns] = useState<Set<number>>(new Set());
  const [lastSelectedTurn, setLastSelectedTurn] = useState<number | null>(null);
  const [dragState, setDragState] = useState<{ active: boolean; mode: 'add' | 'remove' }>({
    active: false,
    mode: 'add',
  });
  const selectedTurnList = useMemo(() => Array.from(selectedTurns).sort((a, b) => a - b), [selectedTurns]);
  const [stepInterval, setStepInterval] = useState(3);
  const [stepStart, setStepStart] = useState(1);
  const [repeatAmount, setRepeatAmount] = useState(1);
  const [shiftAmount, setShiftAmount] = useState(1);
  const [isRepeatPending, setIsRepeatPending] = useState(false);
  const [isShiftPending, setIsShiftPending] = useState(false);
  const [isMacroSaving, setIsMacroSaving] = useState(false);
  const [isMacroApplying, setIsMacroApplying] = useState(false);
  const [macroNameInput, setMacroNameInput] = useState('');
  const [storedMacros, setStoredMacros] = useState<StoredMacro[]>([]);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [chiefRoster, setChiefRoster] = useState<ChiefRosterEntry[]>([]);

  const macroNameHint = useMemo(() => {
    if (selectedTurnList.length === 0) {
      return '';
    }
    const fragments = selectedTurnList
      .map((idx) => turns[idx])
      .filter((turn) => turn && turn.action && turn.action !== '휴식')
      .map((turn) => {
        const raw = typeof turn?.brief === 'string' ? turn.brief : turn?.action || '';
        return raw.trim();
      })
      .filter(Boolean)
      .map((text) => text[0]?.toUpperCase() || '')
      .filter(Boolean)
      .slice(0, 6)
      .join('');
    return fragments || '새 매크로';
  }, [selectedTurnList, turns]);

  useEffect(() => {
    if (typeof maxChiefTurnProp === 'number' && maxChiefTurnProp > 0) {
      setMaxChiefTurn(maxChiefTurnProp);
    }
  }, [maxChiefTurnProp]);

  useEffect(() => {
    const limit = Math.max(1, maxChiefTurn);
    setRepeatAmount((prev) => {
      if (!Number.isFinite(prev) || prev < 1) {
        return 1;
      }
      return Math.min(limit, Math.max(1, Math.floor(prev)));
    });
    setShiftAmount((prev) => {
      if (!Number.isFinite(prev)) {
        return 1;
      }
      if (prev === 0) {
        return 0;
      }
      if (prev > 0) {
        return Math.min(limit, Math.max(1, Math.floor(prev)));
      }
      return Math.max(-limit, Math.min(-1, Math.ceil(prev)));
    });
  }, [maxChiefTurn]);

  useEffect(() => {
    if (!dragState.active) return;
    const stopDrag = () => setDragState((prev) => ({ ...prev, active: false }));
    window.addEventListener('mouseup', stopDrag);
    return () => window.removeEventListener('mouseup', stopDrag);
  }, [dragState.active]);

  useEffect(() => {
    if (!storageKey) {
      setStoredMacros([]);
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setStoredMacros([]);
        return;
      }
      const parsed = JSON.parse(raw) as StoredMacro[];
      if (Array.isArray(parsed)) {
        setStoredMacros(parsed);
      } else {
        setStoredMacros([]);
      }
    } catch (error) {
      console.error('[ChiefReservedCommand] failed to load stored macros', error);
      setStoredMacros([]);
    }
  }, [storageKey]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 국가/사령턴 정보
      const nationTurnPromise = SammoAPI.NationCommandGetReservedCommand({ serverID });
      // 내 기본 정보 (장수 ID, 수뇌 여부)
      const basicInfoPromise = SammoAPI.GetBasicInfo({ session_id: serverID });

      const [nationTurn, basicInfo] = await Promise.all([nationTurnPromise, basicInfoPromise]);

      if (!basicInfo.result) {
        throw new Error('게임 정보를 불러오는데 실패했습니다.');
      }

      setIsChief(basicInfo.isChief);
      setOfficerLevel(basicInfo.officerLevel ?? null);
      setGeneralId(basicInfo.generalID ?? null);

      if (!nationTurn.success || !nationTurn.result) {
        setError(nationTurn.message || '사령턴 정보를 불러오는데 실패했습니다.');
        setTurns([]);
      } else {
        setServerTime(new Date(nationTurn.date || new Date()));

        let targetChief: any = null;
        if (nationTurn.chiefList) {
          if (nationTurn.officerLevel && nationTurn.chiefList[nationTurn.officerLevel]) {
            targetChief = nationTurn.chiefList[nationTurn.officerLevel];
          } else {
            const levels = Object.keys(nationTurn.chiefList);
            if (levels.length > 0) {
              targetChief = nationTurn.chiefList[Number(levels[0])];
            }
          }
        }

        const baseTime = new Date(nationTurn.lastExecute || new Date());
        const termMinutes = nationTurn.turnTerm || 60;
        const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        const fallbackSlots = maxChiefTurnProp ?? DEFAULT_MAX_CHIEF_TURN;
        const slotCount = nationTurn.maxChiefTurn ?? fallbackSlots;
        setMaxChiefTurn(slotCount);
        const cmds: ChiefTurnCommand[] = [];
        const timeLabels: string[] = [];

        for (let idx = 0; idx < slotCount; idx++) {
          const turnObj = targetChief?.turn?.[idx] || {
            action: '휴식',
            brief: '휴식',
            arg: {},
          };

          const turnTime = new Date(baseTime.getTime() + (idx + 1) * termMinutes * 60 * 1000);
          const timeStr = kstFormatter.format(turnTime);
          timeLabels.push(timeStr);

          cmds.push({
            ...turnObj,
            year: nationTurn.year,
            month: nationTurn.month,
            time: timeStr,
          });
        }

        setTurns(cmds);
        setStorageKey(buildMacroStorageKey(serverID, nationTurn.mapName, nationTurn.unitSet, nationTurn.officerLevel));

        const rosterEntries: ChiefRosterEntry[] = Object.entries(nationTurn.chiefList || {})
          .map(([level, officer]) => {
            const turnsArray = Array.isArray(officer.turn)
              ? officer.turn
              : Object.values(officer.turn || {});
            const preview = turnsArray.slice(0, 4).map((turn, idx) => ({
              time: timeLabels[idx] || '',
              brief:
                typeof turn?.brief === 'string'
                  ? turn.brief
                  : turn?.brief
                  ? String(turn.brief)
                  : turn?.action || '휴식',
            }));
            return {
              level: Number(level),
              title: officer.officerLevelText,
              name: officer.name,
              npcType: officer.npcType,
              turnPreview: preview,
              isSelf: Number(level) === nationTurn.officerLevel,
            };
          })
          .sort((a, b) => b.level - a.level);
        setChiefRoster(rosterEntries);
      }

      // 사령부 전용 명령 테이블 (NationCommand의 commandList 사용)
      if (nationTurn.commandList && Array.isArray(nationTurn.commandList)) {
        setCommandTable(nationTurn.commandList as CommandTableCategory[]);
      } else {
        setCommandTable([]);
      }
    } catch (err: any) {
      console.error('[ChiefReservedCommand] loadData error:', err);
      setError(err.message || '사령턴 정보를 불러오는데 실패했습니다.');
      setTurns([]);
      setCommandTable([]);
    } finally {
      setLoading(false);
    }
  }, [serverID, maxChiefTurnProp]);

  const persistMacros = useCallback(
    (next: StoredMacro[]) => {
      if (!storageKey || typeof window === 'undefined') {
        return;
      }
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (error) {
        console.error('[ChiefReservedCommand] failed to persist macros', error);
      }
    },
    [storageKey],
  );

  useEffect(() => {
    if (!serverID) return;
    loadData();
  }, [loadData]);

  const clearSelection = useCallback(() => {
    setSelectedTurns(new Set());
    setLastSelectedTurn(null);
  }, []);

  const selectAllTurns = useCallback(() => {
    const next = new Set<number>();
    for (let i = 0; i < maxChiefTurn; i += 1) {
      next.add(i);
    }
    setSelectedTurns(next);
  }, [maxChiefTurn]);

  const selectOddTurns = useCallback(() => {
    const next = new Set<number>();
    for (let i = 0; i < maxChiefTurn; i += 1) {
      if ((i + 1) % 2 === 1) {
        next.add(i);
      }
    }
    setSelectedTurns(next);
  }, [maxChiefTurn]);

  const selectEvenTurns = useCallback(() => {
    const next = new Set<number>();
    for (let i = 0; i < maxChiefTurn; i += 1) {
      if ((i + 1) % 2 === 0) {
        next.add(i);
      }
    }
    setSelectedTurns(next);
  }, [maxChiefTurn]);

  const applyStepSelection = useCallback(() => {
    if (stepInterval < 1 || stepInterval > maxChiefTurn) {
      alert(`간격은 1~${maxChiefTurn} 사이여야 합니다.`);
      return;
    }
    const normalizedStart = Math.max(1, Math.min(stepStart, stepInterval));
    const zeroBasedStart = normalizedStart - 1;
    const next = new Set<number>();
    for (let i = zeroBasedStart; i < maxChiefTurn; i += stepInterval) {
      next.add(i);
    }
    setSelectedTurns(next);
  }, [maxChiefTurn, stepInterval, stepStart]);

  const buildMacroActionsFromSelection = useCallback((): StoredMacroAction[] => {
    if (selectedTurnList.length === 0) {
      return [];
    }
    const minIdx = selectedTurnList[0];
    const grouped = new Map<string, StoredMacroAction>();
    selectedTurnList.forEach((turnIdx) => {
      const turn = turns[turnIdx];
      if (!turn || !turn.action || turn.action === '휴식') {
        return;
      }
      const key = JSON.stringify([turn.action, turn.arg ?? {}]);
      const entry = grouped.get(key);
      const offset = turnIdx - minIdx;
      const brief = typeof turn.brief === 'string' ? turn.brief : turn.brief ? String(turn.brief) : turn.action;
      if (entry) {
        entry.offsets.push(offset);
      } else {
        grouped.set(key, {
          offsets: [offset],
          action: turn.action,
          arg: turn.arg ?? {},
          brief,
        });
      }
    });
    return Array.from(grouped.values()).map((entry) => ({
      ...entry,
      offsets: [...entry.offsets].sort((a, b) => a - b),
    }));
  }, [selectedTurnList, turns]);

  const handleSaveMacro = useCallback(() => {
    if (!isChief) {
      alert('사령턴 편집 권한이 없습니다.');
      return;
    }
    const actions = buildMacroActionsFromSelection();
    if (actions.length === 0) {
      alert('저장할 명령이 없습니다. 휴식 외 명령을 선택하세요.');
      return;
    }
    const name = (macroNameInput || macroNameHint).trim();
    if (!name) {
      alert('매크로 이름을 입력하세요.');
      return;
    }
    const length = actions.reduce((max, action) => {
      const offsetsMax = action.offsets.length ? Math.max(...action.offsets) : 0;
      return Math.max(max, offsetsMax);
    }, 0) + 1;
    const macro: StoredMacro = { name, actions, length };
    setIsMacroSaving(true);
    try {
      setStoredMacros((prev) => {
        const next = [...prev.filter((entry) => entry.name !== name), macro].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        persistMacros(next);
        return next;
      });
      setMacroNameInput('');
      setSelectedTurns(new Set());
      alert(`'${name}' 매크로를 저장했습니다.`);
    } finally {
      setIsMacroSaving(false);
    }
  }, [isChief, buildMacroActionsFromSelection, macroNameInput, macroNameHint, persistMacros]);

  const handleDeleteMacro = useCallback(
    (name: string) => {
      setStoredMacros((prev) => {
        const next = prev.filter((macro) => macro.name !== name);
        persistMacros(next);
        return next;
      });
    },
    [persistMacros],
  );

  const handleApplyMacro = useCallback(
    async (name: string) => {
      if (!isChief) {
        alert('사령턴 편집 권한이 없습니다.');
        return;
      }
      const macro = storedMacros.find((entry) => entry.name === name);
      if (!macro) {
        return;
      }
      if (selectedTurnList.length === 0) {
        alert('매크로를 적용할 턴을 선택하세요.');
        return;
      }
      const patternLength = Math.max(1, macro.length || 1);
      const startPositions: number[] = [];
      selectedTurnList.forEach((turnIdx) => {
        if (startPositions.length === 0) {
          startPositions.push(turnIdx);
          return;
        }
        const last = startPositions[startPositions.length - 1];
        if (turnIdx >= last + patternLength) {
          startPositions.push(turnIdx);
        }
      });
      if (startPositions.length === 0) {
        startPositions.push(selectedTurnList[0]);
      }
      const commandsPayload = macro.actions
        .map((actionEntry) => {
          const turnSet = new Set<number>();
          actionEntry.offsets.forEach((offset) => {
            startPositions.forEach((start) => {
              const target = start + offset;
              if (target < maxChiefTurn) {
                turnSet.add(target);
              }
            });
          });
          if (turnSet.size === 0) {
            return null;
          }
          return {
            turnList: Array.from(turnSet).sort((a, b) => a - b),
            action: actionEntry.action,
            arg: actionEntry.arg ?? {},
          };
        })
        .filter(Boolean) as Array<{ turnList: number[]; action: string; arg: any }>;

      if (commandsPayload.length === 0) {
        alert('적용 가능한 턴이 없습니다. 선택 범위를 확인하세요.');
        return;
      }

      setIsMacroApplying(true);
      try {
        const result = await SammoAPI.NationCommandReserveBulkCommand({
          serverID,
          commands: commandsPayload,
        });
        if (result.success && result.result) {
          await loadData();
          setSelectedTurns(new Set());
        } else {
          alert(result.reason || result.message || '사령턴 등록에 실패했습니다.');
        }
      } catch (err: any) {
        console.error('[ChiefReservedCommand] apply macro error', err);
        alert(err.message || '사령턴 등록에 실패했습니다.');
      } finally {
        setIsMacroApplying(false);
      }
    },
    [isChief, storedMacros, selectedTurnList, maxChiefTurn, serverID, loadData],
  );

  const handleApplyRepeat = useCallback(async () => {
    if (!isChief) {
      alert('사령턴 편집 권한이 없습니다.');
      return;
    }
    const limit = Math.max(1, maxChiefTurn);
    const amount = Math.min(limit, Math.max(1, Math.floor(repeatAmount)));
    setIsRepeatPending(true);
    try {
      const result = await SammoAPI.NationCommandRepeatCommand({
        serverID,
        amount,
      });
      if (result.success) {
        await loadData();
      } else {
        alert(result.message || '반복 적용에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('[ChiefReservedCommand] repeat error', err);
      alert(err.message || '반복 적용에 실패했습니다.');
    } finally {
      setIsRepeatPending(false);
    }
  }, [isChief, repeatAmount, maxChiefTurn, serverID, loadData]);

  const handleApplyShift = useCallback(async () => {
    if (!isChief) {
      alert('사령턴 편집 권한이 없습니다.');
      return;
    }
    if (shiftAmount === 0) {
      alert('0턴 이동은 지원하지 않습니다. 방향을 선택하세요.');
      return;
    }
    const limit = Math.max(1, maxChiefTurn);
    let amount = Math.floor(shiftAmount);
    amount = amount > 0 ? Math.min(limit, amount) : Math.max(-limit, amount);
    if (amount === 0) {
      amount = shiftAmount > 0 ? 1 : -1;
    }
    setIsShiftPending(true);
    try {
      const result = await SammoAPI.NationCommandPushCommand({
        serverID,
        amount,
      });
      if (result.success) {
        await loadData();
      } else {
        alert(result.message || '당기기/미루기에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('[ChiefReservedCommand] shift error', err);
      alert(err.message || '당기기/미루기에 실패했습니다.');
    } finally {
      setIsShiftPending(false);
    }
  }, [isChief, shiftAmount, maxChiefTurn, serverID, loadData]);

  const adjustShiftAmount = useCallback(
    (delta: number) => {
      setShiftAmount((prev) => {
        const limit = Math.max(1, maxChiefTurn);
        let next = prev + delta;
        if (next === 0) {
          next += delta > 0 ? 1 : -1;
        }
        if (next > 0) {
          next = Math.min(limit, next);
        } else {
          next = Math.max(-limit, next);
        }
        return next;
      });
    },
    [maxChiefTurn],
  );

  const handleTurnMouseDown = (idx: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const isShift = event.shiftKey && lastSelectedTurn !== null;
    const isToggle = event.metaKey || event.ctrlKey;
    let dragMode: 'add' | 'remove' = selectedTurns.has(idx) ? 'remove' : 'add';

    setSelectedTurns((prev) => {
      const next = new Set(prev);

      if (isShift && lastSelectedTurn !== null) {
        const start = Math.min(lastSelectedTurn, idx);
        const end = Math.max(lastSelectedTurn, idx);
        for (let i = start; i <= end; i += 1) {
          next.add(i);
        }
        dragMode = 'add';
        return next;
      }

      if (!isToggle) {
        if (dragMode === 'add') {
          next.clear();
          next.add(idx);
        } else {
          if (next.size > 1) {
            next.clear();
            next.add(idx);
            dragMode = 'add';
          } else {
            next.delete(idx);
          }
        }
      } else if (dragMode === 'add') {
        next.add(idx);
      } else {
        next.delete(idx);
      }

      return next;
    });

    setDragState({ active: true, mode: dragMode });
    setLastSelectedTurn(idx);
  };

  const handleTurnMouseEnter = (idx: number) => {
    if (!dragState.active) return;
    setSelectedTurns((prev) => {
      const next = new Set(prev);
      if (dragState.mode === 'add') {
        next.add(idx);
      } else {
        next.delete(idx);
      }
      return next;
    });
  };

  const openDialogForTurn = (idx: number) => {
    if (!isChief) {
      alert('사령턴 편집 권한이 없습니다.');
      return;
    }

    // 선택이 없다면 클릭한 턴만 선택
    setSelectedTurns((prev) => (prev.size === 0 ? new Set([idx]) : prev));
    setEditingTurnIndex(idx);
    setIsDialogOpen(true);
  };

  const handleSelectCommand = async (command: CommandItem) => {
    if (editingTurnIndex === null) return;

    if (!isChief) {
      alert('사령턴 편집 권한이 없습니다.');
      setIsDialogOpen(false);
      setEditingTurnIndex(null);
      setSelectedTurns(new Set());
      return;
    }

    const fallbackTurns =
      selectedTurnList.length > 0
        ? selectedTurnList
        : editingTurnIndex !== null
        ? [editingTurnIndex]
        : [];
    const turnList = [...fallbackTurns].sort((a, b) => a - b);

    if (turnList.length === 0) {
      setIsDialogOpen(false);
      setEditingTurnIndex(null);
      setSelectedTurns(new Set());
      return;
    }

    // 파라미터가 필요한 명령(reqArg > 0)은 /processing으로 보내서 인자를 입력받는다
    if (command.reqArg > 0) {
      const turnListParam = turnList.join('_');
      setIsDialogOpen(false);
      setEditingTurnIndex(null);
      setSelectedTurns(new Set());
      router.push(
        `/${serverID}/processing/${encodeURIComponent(command.value)}?turnList=${turnListParam}&is_chief=true`
      );
      return;
    }

    // 인자 없는 명령은 즉시 NationCommand로 예약 (복수 턴이면 일괄 예약)
    try {
      let result;
      if (turnList.length > 1) {
        result = await SammoAPI.NationCommandReserveBulkCommand({
          serverID,
          commands: [
            {
              turnList,
              action: command.value,
              arg: {},
            },
          ],
        });
      } else {
        result = await SammoAPI.NationCommandReserveCommand({
          serverID,
          action: command.value,
          turnList,
          arg: {},
        });
      }

      if (result.success && result.result) {
        await loadData();
      } else {
        alert(result.reason || result.message || '사령턴 등록에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('[ChiefReservedCommand] handleSelectCommand error:', err);
      alert(err.message || '사령턴 등록에 실패했습니다.');
    } finally {
      setIsDialogOpen(false);
      setEditingTurnIndex(null);
      setSelectedTurns(new Set());
    }
  };

  const sliderLimit = Math.max(1, maxChiefTurn);

  if (loading && turns.length === 0) {
    return (
      <div
        className={styles.commandPad}
        style={{
          borderColor: colorSystem?.border,
          backgroundColor: colorSystem?.pageBg,
        }}
      >
        <div
          className={styles.header}
          style={{
            backgroundColor: colorSystem?.buttonBg,
            color: colorSystem?.buttonText,
            fontWeight: 'bold',
          }}
        >
          <h4>사령턴</h4>
        </div>
        <div
          className={styles.content}
          style={{
            color: colorSystem?.textMuted,
            backgroundColor: colorSystem?.pageBg,
          }}
        >
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={styles.commandPad}
        style={{
          borderColor: colorSystem?.border,
          backgroundColor: colorSystem?.pageBg,
        }}
      >
        <div
          className={styles.header}
          style={{
            backgroundColor: colorSystem?.buttonBg,
            color: colorSystem?.buttonText,
            fontWeight: 'bold',
          }}
        >
          <h4>사령턴</h4>
        </div>
        <div
          className={styles.content}
          style={{
            color: colorSystem?.textMuted,
            backgroundColor: colorSystem?.pageBg,
          }}
        >
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.commandPad}
      style={{
        borderColor: colorSystem?.border,
        color: colorSystem?.text,
        backgroundColor: colorSystem?.pageBg,
      }}
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <div className={styles.clock}>
            {serverTime.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {officerLevel && (
            <span className={styles.toolbarMeta}>내 관직 레벨: {officerLevel}</span>
          )}
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={clearSelection}
            disabled={selectedTurns.size === 0}
          >
            선택 해제
          </button>
          <span className={styles.selectionSummary}>선택: {selectedTurns.size}턴</span>
          {!isChief && (
            <span className={styles.permissionWarning}>
              (수뇌가 아니라 편집이 제한됩니다)
            </span>
          )}
        </div>
        <div className={styles.toolbarRow}>
          <div className={styles.inlineControl}>
            <div className={styles.inlineControlHeader}>
              <span>반복 간격</span>
              <span>{repeatAmount}턴</span>
            </div>
            <div className={styles.inlineControlBody}>
              <input
                type="range"
                min={1}
                max={sliderLimit}
                value={repeatAmount}
                className={styles.inlineControlSlider}
                onChange={(event) => setRepeatAmount(Number(event.target.value))}
              />
              <div className={styles.inlineControlActions}>
                <button
                  type="button"
                  className={styles.toolbarButton}
                  onClick={handleApplyRepeat}
                  disabled={!isChief || isRepeatPending}
                >
                  {isRepeatPending ? '적용 중...' : '반복 적용'}
                </button>
              </div>
            </div>
          </div>
          <div className={styles.inlineControl}>
            <div className={styles.inlineControlHeader}>
              <span>당기기 · 미루기</span>
              <span>
                {shiftAmount > 0 ? `+${shiftAmount}턴` : shiftAmount < 0 ? `${shiftAmount}턴` : '0턴'}
              </span>
            </div>
            <div className={styles.inlineControlBody}>
              <input
                type="range"
                min={-sliderLimit}
                max={sliderLimit}
                step={1}
                value={shiftAmount}
                className={styles.inlineControlSlider}
                onChange={(event) => setShiftAmount(Number(event.target.value))}
              />
              <div className={styles.inlineControlActions}>
                <div className={styles.stepButtons}>
                  <button type="button" onClick={() => adjustShiftAmount(-1)}>
                    -1
                  </button>
                  <button type="button" onClick={() => adjustShiftAmount(1)}>
                    +1
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.toolbarButton}
                  onClick={handleApplyShift}
                  disabled={!isChief || isShiftPending || shiftAmount === 0}
                >
                  {isShiftPending ? '전송 중...' : '적용'}
                </button>
              </div>
            </div>
            {shiftAmount === 0 && (
              <p className={styles.inlineControlHint}>0은 사용할 수 없습니다. 방향을 지정하세요.</p>
            )}
          </div>
        </div>
        <div className={styles.selectionGroup}>
          <span className={styles.selectionLabel}>퀵 선택</span>
          <button type="button" className={styles.selectionButton} onClick={selectAllTurns}>
            전체
          </button>
          <button type="button" className={styles.selectionButton} onClick={selectOddTurns}>
            홀수
          </button>
          <button type="button" className={styles.selectionButton} onClick={selectEvenTurns}>
            짝수
          </button>
          <div className={styles.stepSelector}>
            <label className={styles.selectionLabel} htmlFor="step-interval">
              간격
            </label>
            <input
              id="step-interval"
              type="number"
              min={1}
              max={maxChiefTurn}
              value={stepInterval}
              className={styles.stepInput}
              onChange={(event) =>
                setStepInterval(
                  Math.max(1, Math.min(maxChiefTurn, Number(event.target.value) || 1))
                )
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  applyStepSelection();
                }
              }}
            />
            <label className={styles.selectionLabel} htmlFor="step-start">
              시작
            </label>
            <input
              id="step-start"
              type="number"
              min={1}
              max={stepInterval}
              value={stepStart}
              className={styles.stepInput}
              onChange={(event) =>
                setStepStart(Math.max(1, Math.min(stepInterval, Number(event.target.value) || 1)))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  applyStepSelection();
                }
              }}
            />
            <button type="button" className={styles.selectionButton} onClick={applyStepSelection}>
              적용
            </button>
          </div>
        </div>
        <div className={styles.macroPanel}>
          <div className={styles.macroHeader}>
            <div>
              <p>저장소 / 매크로</p>
              <span>선택 범위를 이름으로 저장해 반복 적용</span>
            </div>
            <div className={styles.macroSaveRow}>
              <input
                type="text"
                value={macroNameInput}
                placeholder={macroNameHint || '새 매크로'}
                onChange={(event) => setMacroNameInput(event.target.value)}
                disabled={!isChief || selectedTurnList.length === 0}
              />
              <button
                type="button"
                onClick={handleSaveMacro}
                disabled={!isChief || selectedTurnList.length === 0 || isMacroSaving}
              >
                {isMacroSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
          {storedMacros.length === 0 ? (
            <p className={styles.macroEmpty}>저장된 매크로가 없습니다.</p>
          ) : (
            <div className={styles.macroList}>
              {storedMacros.map((macro) => (
                <div key={macro.name} className={styles.macroItem}>
                  <div className={styles.macroItemHeader}>
                    <strong>{macro.name}</strong>
                    <span>{macro.length}턴 패턴</span>
                  </div>
                  <div className={styles.macroItemActions}>
                    {macro.actions.slice(0, 3).map((action, idx) => (
                      <span key={`${macro.name}-${idx}`} className={styles.macroChip}>
                        {action.brief}
                      </span>
                    ))}
                    {macro.actions.length > 3 && (
                      <span className={styles.macroChip}>+{macro.actions.length - 3}</span>
                    )}
                  </div>
                  <div className={styles.macroItemButtons}>
                    <button
                      type="button"
                      onClick={() => handleApplyMacro(macro.name)}
                      disabled={!isChief || isMacroApplying || selectedTurnList.length === 0}
                    >
                      {isMacroApplying ? '적용 중...' : '적용'}
                    </button>
                    <button type="button" onClick={() => handleDeleteMacro(macro.name)}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isDialogOpen && (
        <div className={`${styles.commandTableWrapper} ${styles.noScroll}`}>
          <div
            className={styles.commandTable}
            style={{
              backgroundColor: colorSystem?.pageBg,
            }}
          >
            {/* 턴 번호 */}
            <div className={styles.turnNumberColumn}>
              {turns.map((_, idx) => (
                <div
                  key={idx}
                  className={`${styles.turnCell} ${selectedTurns.has(idx) ? 'selected' : ''}`}
                  style={{
                    backgroundColor: 'transparent',
                    color: colorSystem?.text,
                    borderColor: colorSystem?.border,
                  }}
                  onMouseDown={(event) => handleTurnMouseDown(idx, event)}
                  onMouseEnter={() => handleTurnMouseEnter(idx)}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* 년월 */}

            <div className={styles.yearMonthColumn}>
              {turns.map((cmd, idx) => (
                <div
                  key={idx}
                  className={styles.yearMonthCell}
                  style={{
                    backgroundColor: 'transparent',
                    color: colorSystem?.text,
                    borderColor: colorSystem?.border,
                  }}
                >
                  {cmd.year && cmd.month ? `${cmd.year}年 ${cmd.month}月` : ''}
                </div>
              ))}
            </div>

            {/* 시간 */}
            <div className={styles.timeColumn}>
              {turns.map((cmd, idx) => (
                <div
                  key={idx}
                  className={styles.timeCell}
                  style={{
                    backgroundColor: 'transparent',
                    color: colorSystem?.text,
                    borderColor: colorSystem?.border,
                  }}
                >
                  {cmd.time ?? ''}
                </div>
              ))}
            </div>

            {/* 명령 */}
            <div className={styles.commandColumn}>
              {turns.map((cmd, idx) => {
                const briefText =
                  typeof cmd.brief === 'string'
                    ? cmd.brief
                    : cmd.brief
                    ? String(cmd.brief)
                    : '휴식';
                return (
                  <div
                    key={idx}
                    className={styles.commandCell}
                    title={briefText}
                    style={{
                      backgroundColor: 'transparent',
                      color: colorSystem?.text,
                      borderColor: colorSystem?.border,
                    }}
                  >
                    {briefText}
                  </div>
                );
              })}
            </div>

            {/* 수정 버튼 */}
            <div className={styles.actionColumn}>
              {turns.map((_, idx) => (
                <div
                  key={idx}
                  className={styles.actionCell}
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: colorSystem?.border,
                  }}
                >
                  <button
                    type="button"
                    className={styles.editButton}
                    disabled={!isChief}
                    title={
                      isChief
                        ? '사령턴 수정'
                        : '수뇌가 아니라 사령턴을 수정할 수 없습니다.'
                    }
                    style={{
                      backgroundColor: colorSystem?.buttonBg,
                      color: colorSystem?.buttonText,
                      borderColor: colorSystem?.border,
                    }}
                    onClick={() => openDialogForTurn(idx)}
                  >
                    ✎
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {chiefRoster.length > 0 && (
        <div className={styles.rosterPanel}>
          <div className={styles.rosterHeader}>
            <div>
              <p>타 관직 예약 현황</p>
              <span>Top/BottomItem 미리보기</span>
            </div>
            <span>{chiefRoster.length}명</span>
          </div>
          <div className={styles.rosterGrid}>
            {chiefRoster.map((officer) => (
              <div
                key={`${officer.level}-${officer.name ?? 'empty'}`}
                className={`${styles.rosterCard} ${officer.isSelf ? styles.rosterCardActive : ''}`}
              >
                <div className={styles.rosterCardHeader}>
                  <div>
                    <p>{officer.title}</p>
                    <strong>{officer.name ?? '미배정'}</strong>
                  </div>
                  <span className={styles.rosterBadge}>{officer.level}급</span>
                </div>
                <ul className={styles.rosterList}>
                  {officer.turnPreview.length === 0 && (
                    <li className={styles.rosterListItem}>예약된 명령이 없습니다.</li>
                  )}
                  {officer.turnPreview.map((preview, idx) => (
                    <li key={`${officer.level}-${idx}`} className={styles.rosterListItem}>
                      <span className={styles.rosterTime}>{preview.time || '—'}</span>
                      <span className={styles.rosterBrief}>{preview.brief}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {isDialogOpen && (
        <div className={styles.dialogWrapper}>
          <CommandSelectDialog
            commandTable={commandTable}
            isOpen={isDialogOpen}
            turnIndex={editingTurnIndex ?? undefined}
            turnYear={editingTurnIndex !== null ? turns[editingTurnIndex]?.year : undefined}
            turnMonth={editingTurnIndex !== null ? turns[editingTurnIndex]?.month : undefined}
            turnTime={editingTurnIndex !== null ? turns[editingTurnIndex]?.time : undefined}
            nationColor={undefined}
            colorSystem={colorSystem}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingTurnIndex(null);
            }}
            onSelectCommand={handleSelectCommand}
          />
        </div>
      )}
    </div>
  );
}
