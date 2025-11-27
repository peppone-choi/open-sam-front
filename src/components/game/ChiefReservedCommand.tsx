'use client';
 
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import styles from './PartialReservedCommand.module.css';
import CommandSelectForm, { CommandItem } from './CommandSelectForm';
import DragSelect from '../common/DragSelect';
import { useToast } from '@/contexts/ToastContext';
import { StoredActionsHelper, type TurnObj, type StoredAction } from '@/lib/utils/StoredActionsHelper';
import { SammoAPI } from '@/lib/api/sammo';


interface ClipboardAction {
    turnList: number[];
    action: string;
    arg: any;
    brief: string;
}

interface ChiefReservedCommandProps {
    serverID: string;
    generalID?: number;
    maxChiefTurn?: number;
    targetIsMe?: boolean;
    officer: any;
    commandList?: any;
    reservedCommands?: any[];
    loading?: boolean;
    colorSystem?: any;
    turnTerm?: number;
    date?: string | number;
    year?: number;
    month?: number;
    onReload?: () => void;
    onUpdateCommands?: (commands: any[]) => void;
}

export default function ChiefReservedCommand({
    serverID,
    generalID,
    maxChiefTurn,
    targetIsMe,
    officer,
    commandList = [],
    reservedCommands = [],
    loading = false,
    colorSystem,
    turnTerm,
    date,
    year,
    month,
    onReload,
    onUpdateCommands
}: ChiefReservedCommandProps) {
    const [quickReserveTarget, setQuickReserveTarget] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMaxTurn, setViewMaxTurn] = useState(30);
    const [selectedTurnIndices, setSelectedTurnIndices] = useState<Set<number>>(new Set());
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [recentActions, setRecentActions] = useState<TurnObj[]>([]);
    const [storedActions, setStoredActions] = useState<Map<string, StoredAction[]>>(new Map());
    const [activatedCategory, setActivatedCategory] = useState<string>('');
    const { showToast } = useToast();
    const router = useRouter();
    
    // StoredActionsHelper 인스턴스
    const storedActionsHelperRef = useRef<StoredActionsHelper | null>(null);
    
    // StoredActionsHelper 초기화
    useEffect(() => {
        if (typeof window !== 'undefined' && serverID) {
            storedActionsHelperRef.current = new StoredActionsHelper(
                serverID,
                'nation',
                'default',
                'default'
            );
            // 저장된 데이터 로드
            setRecentActions(storedActionsHelperRef.current.getRecentActions());
            setStoredActions(storedActionsHelperRef.current.getStoredActions());
            setActivatedCategory(storedActionsHelperRef.current.getActivatedCategory());
            setIsEditMode(storedActionsHelperRef.current.getEditMode());
        }
    }, [serverID]);

    const processedTurns = useMemo(() => {
        const baseTime = date ? new Date(date) : null;
        const termMinutes = typeof turnTerm === 'number' ? turnTerm : 0;

        return Array.from({ length: viewMaxTurn }).map((_, index) => {
            const cmd = reservedCommands[index];

            let yearMonthLabel = '-';
            if (typeof year === 'number' && typeof month === 'number') {
                const totalMonths = (year * 12) + (month - 1) + index;
                const cYear = Math.floor(totalMonths / 12);
                const cMonth = (totalMonths % 12) + 1;
                yearMonthLabel = `${cYear}년 ${String(cMonth).padStart(2, '0')}월`;
            }

            let timeStr = '??:??';
            if (baseTime && termMinutes > 0 && !Number.isNaN(baseTime.getTime())) {
                const execTime = new Date(baseTime.getTime() + index * termMinutes * 60000);
                const hh = String(execTime.getHours()).padStart(2, '0');
                const mm = String(execTime.getMinutes()).padStart(2, '0');
                timeStr = `${hh}:${mm}`;
            }

            return {
                index,
                yearMonth: yearMonthLabel,
                timeStr,
                brief: cmd ? cmd.brief : '휴식',
                action: cmd ? cmd.action : 'rest',
                arg: cmd ? cmd.arg : {},
            };
        });
    }, [reservedCommands, viewMaxTurn, year, month, date, turnTerm]);

    const selectionSummary = useMemo(() => {
        if (selectedTurnIndices.size === 0) {
            return '선택된 턴이 없습니다.';
        }
        const sorted = Array.from(selectedTurnIndices).sort((a, b) => a - b);
        const first = sorted[0] + 1;
        const last = sorted[sorted.length - 1] + 1;
        if (sorted.length === 1) {
            return `${first}턴 선택됨`;
        }
        return `${first}턴부터 ${last}턴까지 ${sorted.length}턴 선택됨`;
    }, [selectedTurnIndices]);
 
    const selectAll = () => {
        const newSet = new Set<number>();
        processedTurns.forEach(t => newSet.add(t.index));
        setSelectedTurnIndices(newSet);
    };

    const clearSelection = () => setSelectedTurnIndices(new Set());
    
    // 당기기/미루기 기능
    const pushCommand = async (amount: number) => {
        try {
            await SammoAPI.NationCommandPushCommand({ serverID, amount });
            showToast(`${amount > 0 ? '미루기' : '당기기'} 완료`, 'success');
            onReload?.();
        } catch (e: any) {
            console.error(e);
            showToast(e.message || '명령 이동에 실패했습니다.', 'error');
        }
    };
    
    // 반복 기능
    const repeatCommand = async (amount: number) => {
        try {
            await SammoAPI.NationCommandRepeatCommand({ serverID, amount });
            showToast(`${amount}턴 반복 완료`, 'success');
            onReload?.();
        } catch (e: any) {
            console.error(e);
            showToast(e.message || '반복에 실패했습니다.', 'error');
        }
    };
    
    // 에디트 모드 토글
    const toggleEditMode = () => {
        const newMode = !isEditMode;
        setIsEditMode(newMode);
        storedActionsHelperRef.current?.setEditMode(newMode);
        if (!newMode) {
            setQuickReserveTarget(null);
        }
    };
    
    // 최근 액션 저장
    const saveRecentAction = (action: TurnObj) => {
        storedActionsHelperRef.current?.pushRecentActions(action);
        setRecentActions(storedActionsHelperRef.current?.getRecentActions() || []);
    };
    
    // 보관함에 저장
    const handleSaveToStorage = () => {
        if (selectedTurnIndices.size === 0) {
            showToast('먼저 턴을 선택해주세요.', 'warning');
            return;
        }
        
        const actions: StoredAction[] = Array.from(selectedTurnIndices).map(idx => {
            const t = processedTurns[idx];
            return { 
                turnList: [idx], 
                turnObj: { action: t.action, arg: t.arg, brief: t.brief }
            };
        });
        
        const nickName = prompt('보관할 이름을 입력해주세요', '');
        if (!nickName) return;
        
        storedActionsHelperRef.current?.setStoredActions(nickName, actions);
        setStoredActions(storedActionsHelperRef.current?.getStoredActions() || new Map());
        showToast('보관함에 저장되었습니다.', 'success');
        clearSelection();
    };
    
    // 보관함에서 삭제
    const handleDeleteFromStorage = (key: string) => {
        storedActionsHelperRef.current?.deleteStoredActions(key);
        setStoredActions(storedActionsHelperRef.current?.getStoredActions() || new Map());
        showToast('보관함에서 삭제되었습니다.', 'success');
    };
    
    // 클립보드 상태
    const [clipboard, setClipboard] = useState<StoredAction[] | undefined>(undefined);
    
    // 클립보드에서 초기 로드
    useEffect(() => {
        if (storedActionsHelperRef.current) {
            setClipboard(storedActionsHelperRef.current.getClipboard());
        }
    }, [serverID]);
    
    // 선택된 턴의 액션 추출
    const extractSelectedActions = (): StoredAction[] => {
        const sorted = Array.from(selectedTurnIndices).sort((a, b) => a - b);
        const minIdx = sorted[0] ?? 0;
        
        return sorted.map(idx => {
            const t = processedTurns[idx];
            return {
                turnList: [idx - minIdx], // 상대적 위치
                turnObj: { action: t.action, arg: t.arg, brief: t.brief }
            };
        });
    };
    
    // 클립보드 잘라내기
    const clipboardCut = async () => {
        if (selectedTurnIndices.size === 0) {
            showToast('먼저 턴을 선택해주세요.', 'warning');
            return;
        }
        
        const actions = extractSelectedActions();
        setClipboard(actions);
        storedActionsHelperRef.current?.setClipboard(actions);
        
        // 선택된 턴 비우기
        await eraseSelectedTurns();
        showToast('잘라내기 완료', 'success');
    };
    
    // 클립보드 복사
    const clipboardCopy = () => {
        if (selectedTurnIndices.size === 0) {
            showToast('먼저 턴을 선택해주세요.', 'warning');
            return;
        }
        
        const actions = extractSelectedActions();
        setClipboard(actions);
        storedActionsHelperRef.current?.setClipboard(actions);
        showToast('복사 완료', 'success');
        clearSelection();
    };
    
    // 클립보드 붙여넣기
    const clipboardPaste = async () => {
        if (!clipboard || clipboard.length === 0) {
            showToast('클립보드가 비어있습니다.', 'warning');
            return;
        }
        
        if (selectedTurnIndices.size === 0) {
            showToast('붙여넣을 시작 위치를 선택해주세요.', 'warning');
            return;
        }
        
        const startIdx = Math.min(...Array.from(selectedTurnIndices));
        const actions = amplifyActions(clipboard, [startIdx]);
        
        await reserveBulkCommands(actions);
        showToast('붙여넣기 완료', 'success');
        clearSelection();
    };
    
    // 텍스트로 복사 (클립보드에 텍스트 형태로)
    const clipboardTextCopy = async () => {
        if (selectedTurnIndices.size === 0) {
            showToast('먼저 턴을 선택해주세요.', 'warning');
            return;
        }
        
        const sorted = Array.from(selectedTurnIndices).sort((a, b) => a - b);
        const removeTagRegex = /<[^>]*>?/g;
        
        const textLines = sorted.map(idx => {
            const t = processedTurns[idx];
            const briefText = (t.brief || '').replace(removeTagRegex, '');
            return `${idx + 1}턴 ${briefText}`;
        });
        
        const text = textLines.join('\n');
        
        try {
            await navigator.clipboard.writeText(text);
            showToast('텍스트 복사 완료', 'success');
        } catch (e) {
            console.error('클립보드 복사 실패:', e);
            showToast('클립보드 복사에 실패했습니다.', 'error');
        }
        
        clearSelection();
    };
    
    // 선택된 턴 비우기
    const eraseSelectedTurns = async () => {
        if (selectedTurnIndices.size === 0) {
            showToast('먼저 턴을 선택해주세요.', 'warning');
            return;
        }
        
        const turnList = Array.from(selectedTurnIndices);
        const emptyAction: TurnObj = { action: '휴식', brief: '휴식', arg: {} };
        
        try {
            await SammoAPI.NationCommandReserveBulkCommand({
                serverID,
                commands: [{ turnList, action: emptyAction.action, arg: emptyAction.arg }]
            });
            showToast('비우기 완료', 'success');
            clearSelection();
            onReload?.();
        } catch (e: any) {
            console.error(e);
            showToast(e.message || '비우기에 실패했습니다.', 'error');
        }
    };
    
    // 지우고 당기기
    const eraseAndPull = async () => {
        if (selectedTurnIndices.size === 0) {
            showToast('먼저 턴을 선택해주세요.', 'warning');
            return;
        }
        
        const sorted = Array.from(selectedTurnIndices).sort((a, b) => a - b);
        const minIdx = sorted[0];
        const maxIdx = sorted[sorted.length - 1];
        const queryLength = maxIdx - minIdx + 1;
        
        // 첫 턴부터 선택했으면 그냥 당기기
        if (minIdx === 0) {
            await pushCommand(-queryLength);
            return;
        }
        
        // 마지막 턴까지 선택했으면 그냥 비우기
        if (maxIdx + 1 >= viewMaxTurn) {
            await eraseSelectedTurns();
            return;
        }
        
        // 뒤의 명령들을 앞으로 당기기
        const commands: { turnList: number[]; action: string; arg: any }[] = [];
        const emptyTurnList: number[] = [];
        
        for (let srcIdx = minIdx + queryLength; srcIdx < viewMaxTurn; srcIdx++) {
            const t = processedTurns[srcIdx];
            if (t.action === '휴식' || t.action === 'rest') {
                emptyTurnList.push(srcIdx - queryLength);
            } else {
                commands.push({
                    turnList: [srcIdx - queryLength],
                    action: t.action,
                    arg: t.arg
                });
            }
        }
        
        // 마지막 부분 비우기
        for (let i = viewMaxTurn - queryLength; i < viewMaxTurn; i++) {
            emptyTurnList.push(i);
        }
        
        if (emptyTurnList.length > 0) {
            commands.push({ turnList: emptyTurnList, action: '휴식', arg: {} });
        }
        
        try {
            await SammoAPI.NationCommandReserveBulkCommand({
                serverID,
                commands
            });
            showToast('지우고 당기기 완료', 'success');
            clearSelection();
            onReload?.();
        } catch (e: any) {
            console.error(e);
            showToast(e.message || '지우고 당기기에 실패했습니다.', 'error');
        }
    };
    
    // 뒤로 밀기
    const pushEmpty = async () => {
        if (selectedTurnIndices.size === 0) {
            showToast('먼저 턴을 선택해주세요.', 'warning');
            return;
        }
        
        const sorted = Array.from(selectedTurnIndices).sort((a, b) => a - b);
        const minIdx = sorted[0];
        const maxIdx = sorted[sorted.length - 1];
        const queryLength = maxIdx - minIdx + 1;
        
        // 첫 턴부터 선택했으면 그냥 미루기
        if (minIdx === 0) {
            await pushCommand(queryLength);
            return;
        }
        
        // 선택한 부분부터 뒤로 밀기
        const commands: { turnList: number[]; action: string; arg: any }[] = [];
        const emptyTurnList: number[] = [];
        
        for (let srcIdx = minIdx; srcIdx < viewMaxTurn - queryLength; srcIdx++) {
            const t = processedTurns[srcIdx];
            if (t.action === '휴식' || t.action === 'rest') {
                emptyTurnList.push(srcIdx + queryLength);
            } else {
                commands.push({
                    turnList: [srcIdx + queryLength],
                    action: t.action,
                    arg: t.arg
                });
            }
        }
        
        // 선택한 부분 비우기
        for (let i = minIdx; i <= maxIdx; i++) {
            emptyTurnList.push(i);
        }
        
        if (emptyTurnList.length > 0) {
            commands.push({ turnList: emptyTurnList, action: '휴식', arg: {} });
        }
        
        try {
            await SammoAPI.NationCommandReserveBulkCommand({
                serverID,
                commands
            });
            showToast('뒤로 밀기 완료', 'success');
            clearSelection();
            onReload?.();
        } catch (e: any) {
            console.error(e);
            showToast(e.message || '뒤로 밀기에 실패했습니다.', 'error');
        }
    };
    
    // 선택한 패턴 반복하기
    const subRepeatCommand = async () => {
        if (selectedTurnIndices.size === 0) {
            showToast('먼저 턴을 선택해주세요.', 'warning');
            return;
        }
        
        const sorted = Array.from(selectedTurnIndices).sort((a, b) => a - b);
        const minIdx = sorted[0];
        const maxIdx = sorted[sorted.length - 1];
        const queryLength = maxIdx - minIdx + 1;
        
        const actions = extractSelectedActions();
        const targetStarts: number[] = [];
        
        for (let start = minIdx; start < viewMaxTurn; start += queryLength) {
            targetStarts.push(start);
        }
        
        const amplified = amplifyActions(actions, targetStarts);
        await reserveBulkCommands(amplified);
        showToast('반복하기 완료', 'success');
        clearSelection();
    };
    
    // 액션 확장 (시작 위치들에 맞게 복제)
    const amplifyActions = (rawActions: StoredAction[], startPositions: number[]): StoredAction[] => {
        const result: StoredAction[] = [];
        
        for (const start of startPositions) {
            for (const action of rawActions) {
                result.push({
                    turnList: action.turnList.map(t => t + start),
                    turnObj: { ...action.turnObj }
                });
            }
        }
        
        return result;
    };
    
    // 벌크 명령 예약
    const reserveBulkCommands = async (actions: StoredAction[]) => {
        // 같은 턴에 대한 명령 병합
        const turnActionMap = new Map<number, TurnObj>();
        
        for (const action of actions) {
            for (const turnIdx of action.turnList) {
                if (turnIdx >= 0 && turnIdx < viewMaxTurn) {
                    turnActionMap.set(turnIdx, action.turnObj);
                }
            }
        }
        
        // 액션별로 그룹화
        const actionGroups = new Map<string, number[]>();
        
        for (const [turnIdx, turnObj] of turnActionMap.entries()) {
            const key = JSON.stringify([turnObj.action, turnObj.arg]);
            if (!actionGroups.has(key)) {
                actionGroups.set(key, []);
            }
            actionGroups.get(key)!.push(turnIdx);
        }
        
        const commands: { turnList: number[]; action: string; arg: any }[] = [];
        
        for (const [key, turnList] of actionGroups.entries()) {
            const [action, arg] = JSON.parse(key);
            commands.push({ turnList, action, arg });
        }
        
        if (commands.length === 0) return;
        
        try {
            await SammoAPI.NationCommandReserveBulkCommand({
                serverID,
                commands
            });
            onReload?.();
        } catch (e: any) {
            console.error(e);
            showToast(e.message || '명령 예약에 실패했습니다.', 'error');
        }
    };
    
    // 보관함 적용
    const applyStoredActions = async (actions: StoredAction[]) => {
        if (selectedTurnIndices.size === 0) {
            showToast('적용할 시작 위치를 선택해주세요.', 'warning');
            return;
        }
        
        const startIdx = Math.min(...Array.from(selectedTurnIndices));
        const amplified = amplifyActions(actions, [startIdx]);
        
        await reserveBulkCommands(amplified);
        showToast('보관함 적용 완료', 'success');
        clearSelection();
    };
    
    // 최근 액션 적용
    const applyRecentAction = async (action: TurnObj) => {
        if (selectedTurnIndices.size === 0) {
            showToast('적용할 턴을 선택해주세요.', 'warning');
            return;
        }
        
        const turnList = Array.from(selectedTurnIndices);
        
        try {
            await SammoAPI.NationCommandReserveBulkCommand({
                serverID,
                commands: [{ turnList, action: action.action, arg: action.arg || {} }]
            });
            showToast('적용 완료', 'success');
            clearSelection();
            onReload?.();
        } catch (e: any) {
            console.error(e);
            showToast(e.message || '적용에 실패했습니다.', 'error');
        }
    };
    
    // 범위 선택 (홀수턴, 짝수턴, N턴 간격)
    const selectByStep = (offset: number, step: number) => {
        const newSet = new Set<number>();
        for (let i = offset; i < viewMaxTurn; i += step) {
            newSet.add(i);
        }
        setSelectedTurnIndices(newSet);
    };
 
    const navigateToCommandProcessing = (cmd: CommandItem, indices: number[]) => {
        if (!serverID) return;

        const uniqueTurns = Array.from(new Set(indices))
            .filter((idx) => Number.isFinite(idx) && idx >= 0)
            .sort((a, b) => a - b);

        if (uniqueTurns.length === 0) {
            showToast('먼저 적용할 턴을 선택해주세요.', 'warning');
            return;
        }

        const turnListParam = uniqueTurns.join('_');
        const params = new URLSearchParams();
        params.set('turnList', turnListParam);
        params.set('is_chief', 'true');

        const encodedCommand = encodeURIComponent(cmd.value);
        // TODO: dev 확인용 예시 경로
        // 예) /s1/processing/국호변경?turnList=0_1&is_chief=true
        router.push(`/${serverID}/processing/${encodedCommand}?${params.toString()}`);
    };

    const handleCommandSelect = (cmd: CommandItem, indices?: number[]) => {
        const targetIndices =
            indices && indices.length > 0
                ? indices
                : selectedTurnIndices.size > 0
                    ? Array.from(selectedTurnIndices)
                    : quickReserveTarget !== null
                        ? [quickReserveTarget]
                        : [];

        if (targetIndices.length === 0) {
            showToast('먼저 적용할 턴을 선택해주세요.', 'warning');
            return;
        }

        setQuickReserveTarget(null);
        setIsMenuOpen(false);
        navigateToCommandProcessing(cmd, targetIndices);
    };


    const handleDragEnd = (ids: number[]) => {
        const newSet = new Set(selectedTurnIndices);
        ids.forEach(id => newSet.add(id));
        setSelectedTurnIndices(newSet);
    };

    const handleToggleTurn = (index: number) => {
        const newSet = new Set(selectedTurnIndices);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedTurnIndices(newSet);
    };

    const addSelectedTurns = (ids: number[]) => {
        const newSet = new Set(selectedTurnIndices);
        ids.forEach(id => newSet.add(id));
        setSelectedTurnIndices(newSet);
    };

    const quickReserveStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        right: 0,
        top: quickReserveTarget !== null ? `${quickReserveTarget * 36 + 26}px` : '0',
        zIndex: 10,
        display: quickReserveTarget !== null ? 'block' : 'none',
    };

    if (loading && reservedCommands.length === 0) return <div>Loading...</div>;

    return (
        <div className={styles.container} style={{ color: colorSystem?.text }}>
            {/* Header Info */}
            <div className="flex items-center justify-between bg-gray-800 p-2 mb-2 rounded">
                <div style={{ color: '#aaffff' }}>{officer?.name}</div>
                <div>{officer?.officerLevelText}</div>
            </div>

            {/* Control Pad */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarRow}>
                    <button className={styles.toolbarButton} onClick={toggleEditMode}>
                        {isEditMode ? "일반 모드" : "고급 모드"}
                    </button>

                    {/* 반복 드롭다운 */}
                    <div className="relative inline-block group">
                        <button className={styles.toolbarButton}>반복 ▾</button>
                        <div className="absolute hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-[80px]">
                            {[1, 2, 3, 5, 10].map(n => (
                                <button 
                                    key={n}
                                    className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                    onClick={() => repeatCommand(n)}
                                >
                                    {n}턴
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 당기기/미루기 */}
                    <div className="relative inline-block group">
                        <button 
                            className={styles.toolbarButton}
                            onClick={() => pushCommand(-1)}
                        >
                            당기기
                        </button>
                        <div className="absolute hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-[80px]">
                            {[1, 2, 3, 5, 10].map(n => (
                                <button 
                                    key={n}
                                    className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                    onClick={() => pushCommand(-n)}
                                >
                                    {n}턴
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative inline-block group">
                        <button 
                            className={styles.toolbarButton}
                            onClick={() => pushCommand(1)}
                        >
                            미루기
                        </button>
                        <div className="absolute hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-[80px]">
                            {[1, 2, 3, 5, 10].map(n => (
                                <button 
                                    key={n}
                                    className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                    onClick={() => pushCommand(n)}
                                >
                                    {n}턴
                                </button>
                            ))}
                        </div>
                    </div>

                    {isEditMode && (
                        <>
                            {/* 범위 선택 드롭다운 */}
                            <div className="relative inline-block group">
                                <button className={styles.toolbarButton}>범위 ▾</button>
                                <div className="absolute hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-[100px]">
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={clearSelection}
                                    >
                                        해제
                                    </button>
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={selectAll}
                                    >
                                        모든턴
                                    </button>
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={() => selectByStep(0, 2)}
                                    >
                                        홀수턴
                                    </button>
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={() => selectByStep(1, 2)}
                                    >
                                        짝수턴
                                    </button>
                                    <div className="border-t border-gray-600 my-1" />
                                    {[3, 4, 5, 6].map(step => (
                                        <div key={step} className="px-2 py-1">
                                            <span className="text-xs text-gray-400">{step}턴 간격:</span>
                                            <div className="flex gap-1 mt-1">
                                                {Array.from({ length: step }).map((_, offset) => (
                                                    <button
                                                        key={offset}
                                                        className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                                                        onClick={() => selectByStep(offset, step)}
                                                    >
                                                        {offset + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* 선택한 턴을 드롭다운 */}
                            <div className="relative inline-block group">
                                <button className={styles.toolbarButton}>선택한 턴을 ▾</button>
                                <div className="absolute hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-[120px]">
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={clipboardCut}
                                    >
                                        ✂️ 잘라내기
                                    </button>
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={clipboardCopy}
                                    >
                                        📋 복사하기
                                    </button>
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={clipboardPaste}
                                        disabled={!clipboard || clipboard.length === 0}
                                        style={{ opacity: clipboard && clipboard.length > 0 ? 1 : 0.5 }}
                                    >
                                        📄 붙여넣기
                                    </button>
                                    <div className="border-t border-gray-600 my-1" />
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={clipboardTextCopy}
                                    >
                                        📝 텍스트 복사
                                    </button>
                                    <div className="border-t border-gray-600 my-1" />
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={handleSaveToStorage}
                                    >
                                        🔖 보관하기
                                    </button>
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={subRepeatCommand}
                                    >
                                        🔁 반복하기
                                    </button>
                                    <div className="border-t border-gray-600 my-1" />
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={eraseSelectedTurns}
                                    >
                                        🗑️ 비우기
                                    </button>
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={eraseAndPull}
                                    >
                                        ⬆️ 지우고 당기기
                                    </button>
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                                        onClick={pushEmpty}
                                    >
                                        ⬇️ 뒤로 밀기
                                    </button>
                                </div>
                            </div>
                            
                            {/* 보관함 드롭다운 */}
                            <div className="relative inline-block group">
                                <button className={styles.toolbarButton}>보관함 ▾</button>
                                <div className="absolute hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-[120px] max-h-[200px] overflow-y-auto">
                                    {storedActions.size === 0 ? (
                                        <div className="px-3 py-2 text-xs text-gray-400">비어있음</div>
                                    ) : (
                                        Array.from(storedActions.entries()).map(([key, actions]) => (
                                            <div key={key} className="flex items-center justify-between px-2 py-1 hover:bg-gray-700">
                                                <button 
                                                    className="text-sm text-left flex-1"
                                                    onClick={() => applyStoredActions(actions)}
                                                >
                                                    {key}
                                                </button>
                                                <button 
                                                    className="text-red-400 text-xs ml-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteFromStorage(key);
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            
                            {/* 최근 액션 드롭다운 */}
                            <div className="relative inline-block group">
                                <button className={styles.toolbarButton}>최근 ▾</button>
                                <div className="absolute hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-[150px] max-h-[200px] overflow-y-auto right-0">
                                    {recentActions.length === 0 ? (
                                        <div className="px-3 py-2 text-xs text-gray-400">비어있음</div>
                                    ) : (
                                        recentActions.slice().reverse().map((action, idx) => (
                                            <button 
                                                key={idx}
                                                className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm truncate"
                                                onClick={() => applyRecentAction(action)}
                                            >
                                                {action.brief || action.action}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                {isEditMode && (
                    <div
                        className={styles.selectionSummary}
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {selectionSummary}
                    </div>
                )}
            </div>


            {/* Grid Container */}
            <div className={styles.commandTableWrapper}>

                {/* Quick Reserve Anchor */}
                {quickReserveTarget !== null && (
                    <div style={quickReserveStyle} className="bg-gray-900 border border-gray-700 p-2 shadow-lg">
                        <CommandSelectForm
                            commandTable={commandList}
                            onSelectCommand={(cmd) => handleCommandSelect(cmd, [quickReserveTarget])}
                            onClose={() => setQuickReserveTarget(null)}
                            turnIndex={quickReserveTarget}
                            hideHeader
                        />
                    </div>
                )}

                <div className={cn(styles.commandTable, isEditMode && styles.isEditMode)}>
                    {/* Column 1 */}
                    {isEditMode ? (
                        <DragSelect
                            className={styles.turnNumberColumn}
                            onDragEnd={handleDragEnd}
                        >
                            {({ selected, isDragging }) => (
                                <>
                                    {processedTurns.map((turn) => (
                                        <div
                                            key={`idx-${turn.index}`}
                                            data-drag-id={turn.index}
                                            className={cn(
                                                styles.turnCell,
                                                selectedTurnIndices.has(turn.index) && styles.selected,
                                                selected.has(turn.index) && styles.active
                                            )}
                                            onClick={() => handleToggleTurn(turn.index)}
                                        >
                                            {turn.index + 1}
                                        </div>
                                    ))}
                                </>
                            )}
                        </DragSelect>
                    ) : (
                        <>
                            <div className={styles.turnNumberColumn}>
                                {processedTurns.map((turn) => (
                                    <div
                                        key={`turn-${turn.index}`}
                                        className={styles.turnCell}
                                    >
                                        {turn.index + 1}
                                    </div>
                                ))}
                            </div>

                            <div className={styles.yearMonthColumn}>
                                {processedTurns.map((turn) => (
                                    <div key={`ym-${turn.index}`} className={styles.yearMonthCell}>
                                        <span className="font-mono text-gray-400">{turn.yearMonth}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.timeColumn}>
                                {processedTurns.map((turn) => (
                                    <div key={`time-${turn.index}`} className={styles.timeCell}>
                                        <span className="font-mono text-gray-500">{turn.timeStr}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Column 2 */}
                    {isEditMode ? (
                        <div className={styles.timeColumn}>
                            {processedTurns.map((turn) => (
                                <div key={`time-${turn.index}`} className={styles.timeCell}>
                                    <div className="flex flex-col items-center justify-center text-[10px] leading-tight">
                                        <span className="font-mono text-gray-300">{turn.yearMonth}</span>
                                        <span className="font-mono text-gray-400">{turn.timeStr}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.commandColumn}>
                            {processedTurns.map((turn) => (
                                <div
                                    key={`brief-${turn.index}`}
                                    className={styles.commandCell}
                                    title={turn.brief}
                                    onClick={() => setQuickReserveTarget(turn.index)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: turn.brief }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Column 3 */}
                    {isEditMode ? (
                        <div className={styles.commandColumn}>
                            {processedTurns.map((turn) => (
                                <div
                                    key={`brief-${turn.index}`}
                                    className={styles.commandCell}
                                    title={turn.brief}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: turn.brief }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.actionColumn}>
                            {processedTurns.map((turn) => (
                                <div key={`action-${turn.index}`} className={styles.actionCell}>
                                    <button
                                        type="button"
                                        className={styles.editButton}
                                        aria-label={`${turn.index + 1}턴 명령 수정`}
                                        onClick={() => setQuickReserveTarget(quickReserveTarget === turn.index ? null : turn.index)}
                                    >
                                        ✎
                                    </button>

                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Bottom Command Select */}
            <div className="mt-2">
                <button
                    className="btn btn-info w-full"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    명령 선택 ▾
                </button>
                {isMenuOpen && (
                    <div className="mt-2 border border-gray-700 bg-gray-900 p-2">
                        <CommandSelectForm
                            commandTable={commandList}
                            onSelectCommand={(cmd) => handleCommandSelect(cmd)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
