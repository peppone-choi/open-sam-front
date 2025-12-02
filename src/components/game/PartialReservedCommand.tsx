'use client';
 
import React, { useCallback, useEffect, useMemo, useState, memo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import styles from './PartialReservedCommand.module.css';
import CommandSelectForm, { CommandItem } from './CommandSelectForm';
import DragSelect from '../common/DragSelect';
import { useToast } from '@/contexts/ToastContext';
import { SammoAPI } from '@/lib/api/sammo';
import { StoredActionsHelper, type TurnObj, type StoredAction } from '@/lib/utils/StoredActionsHelper';


interface ClipboardAction {
    turnList: number[];
    action: string;
    arg: any;
    brief: string;
}

// 턴 데이터 타입
interface ProcessedTurn {
    index: number;
    yearMonth: string;
    timeStr: string;
    brief: string;
    action: string;
    arg: any;
}

// 개별 턴 셀 컴포넌트 (메모이제이션)
const TurnCell = memo(function TurnCell({
    turn,
    isSelected,
    isActive,
    isEditMode,
    onClick,
}: {
    turn: ProcessedTurn;
    isSelected: boolean;
    isActive: boolean;
    isEditMode: boolean;
    onClick: () => void;
}) {
    return (
        <div
            data-drag-id={turn.index}
            className={cn(
                styles.turnCell,
                isSelected && styles.selected,
                isActive && styles.active
            )}
            onClick={onClick}
        >
            {turn.index + 1}
        </div>
    );
});

// 연월 셀 컴포넌트 (메모이제이션)
const YearMonthCell = memo(function YearMonthCell({ yearMonth }: { yearMonth: string }) {
    return (
        <div className={styles.yearMonthCell}>
            <span className="font-mono text-gray-400">{yearMonth}</span>
        </div>
    );
});

// 시간 셀 컴포넌트 (메모이제이션)
const TimeCell = memo(function TimeCell({ 
    timeStr, 
    yearMonth, 
    isEditMode,
    urgency = 'normal',
}: { 
    timeStr: string; 
    yearMonth?: string; 
    isEditMode?: boolean;
    urgency?: 'normal' | 'imminent' | 'urgent';
}) {
    const urgencyClass = urgency === 'urgent' 
        ? styles.urgent 
        : urgency === 'imminent' 
            ? styles.imminent 
            : '';
    
    if (isEditMode && yearMonth) {
        return (
            <div className={cn(styles.timeCell, urgencyClass)}>
                <div className="flex flex-col items-center justify-center text-[10px] leading-tight">
                    <span className="font-mono text-gray-300">{yearMonth}</span>
                    <span className="font-mono text-gray-400">{timeStr}</span>
                </div>
            </div>
        );
    }
    return (
        <div className={cn(styles.timeCell, urgencyClass)}>
            <span className="font-mono text-gray-500">{timeStr}</span>
        </div>
    );
});

// 명령 셀 컴포넌트 (메모이제이션)
const CommandCell = memo(function CommandCell({
    brief,
    onClick,
    clickable = false,
    isRest = false,
    isFirstTurn = false,
    onCancel,
    showCancel = false,
}: {
    brief: string;
    onClick?: () => void;
    clickable?: boolean;
    isRest?: boolean;
    isFirstTurn?: boolean;
    onCancel?: () => void;
    showCancel?: boolean;
}) {
    return (
        <div
            className={cn(
                styles.commandCell,
                isRest && styles.rest,
                isFirstTurn && styles.executing,
            )}
            title={brief.replace(/<[^>]*>/g, '')}
            onClick={onClick}
            style={clickable ? { cursor: 'pointer' } : undefined}
        >
            <span dangerouslySetInnerHTML={{ __html: brief }} />
            {showCancel && !isRest && onCancel && (
                <button
                    className={styles.cancelButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                    }}
                    title="명령 취소"
                >
                    ×
                </button>
            )}
            {isFirstTurn && <div className={styles.progressBar} style={{ width: '100%' }} />}
        </div>
    );
});

// 액션 셀 컴포넌트 (메모이제이션)
const ActionCell = memo(function ActionCell({
    turnIndex,
    isActive,
    onClick,
}: {
    turnIndex: number;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <div className={styles.actionCell}>
            <button
                type="button"
                className={styles.editButton}
                aria-label={`${turnIndex + 1}턴 명령 수정`}
                onClick={onClick}
            >
                ✎
            </button>
        </div>
    );
});

interface PartialReservedCommandProps {
    serverID: string;
    generalID: number;
    nationColor?: string;
    colorSystem?: any;
    reloadKey?: number;
    onGlobalReload?: () => void;
    reservedCommands?: any[];
    commandTable?: any;
    loading?: boolean;
    onUpdateCommands?: (commands: any[]) => void;
}

export default function PartialReservedCommand({
    serverID,
    generalID,
    nationColor,
    colorSystem,
    reloadKey,
    onGlobalReload,
    reservedCommands = [],
    commandTable = [],
    loading = false,
    onUpdateCommands
}: PartialReservedCommandProps) {
    const [quickReserveTarget, setQuickReserveTarget] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMaxTurn, setViewMaxTurn] = useState(30);
    const [selectedTurnIndices, setSelectedTurnIndices] = useState<Set<number>>(new Set());
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [internalReserved, setInternalReserved] = useState<any[] | null>(null);
    const [internalCommandTable, setInternalCommandTable] = useState<any[] | null>(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [turnBaseTime, setTurnBaseTime] = useState<Date | null>(null);
    const [turnTermMinutes, setTurnTermMinutes] = useState<number>(0);
    const [sessionYear, setSessionYear] = useState<number | null>(null);
    const [sessionMonth, setSessionMonth] = useState<number | null>(null);
    
    // 고급 기능 상태
    const [recentActions, setRecentActions] = useState<TurnObj[]>([]);
    const [storedActions, setStoredActions] = useState<Map<string, StoredAction[]>>(new Map());
    const [clipboard, setClipboard] = useState<StoredAction[] | undefined>(undefined);
    
    const { showToast } = useToast();
    const router = useRouter();
    
    // StoredActionsHelper 인스턴스
    const storedActionsHelperRef = useRef<StoredActionsHelper | null>(null);
    
    // StoredActionsHelper 초기화
    useEffect(() => {
        if (typeof window !== 'undefined' && serverID) {
            storedActionsHelperRef.current = new StoredActionsHelper(
                serverID,
                'general',
                'default',
                'default'
            );
            // 저장된 데이터 로드
            setRecentActions(storedActionsHelperRef.current.getRecentActions());
            setStoredActions(storedActionsHelperRef.current.getStoredActions());
            setClipboard(storedActionsHelperRef.current.getClipboard());
            setIsEditMode(storedActionsHelperRef.current.getEditMode());
        }
    }, [serverID]);
 
    const turnSource = internalReserved ?? reservedCommands;

    const commandTableSource = internalCommandTable ?? commandTable;

    useEffect(() => {
        let cancelled = false;

        async function loadReserved() {
            if (!serverID || !generalID) return;
            try {
                setInternalLoading(true);
                const [reservedRes, tableRes] = await Promise.all([
                    SammoAPI.CommandGetReservedCommand({ serverID, general_id: generalID }),
                    SammoAPI.GetCommandTable({ serverID, general_id: generalID }),
                ]);
 
                if (cancelled) return;
 
                if (reservedRes?.success && Array.isArray(reservedRes.turn)) {
                    setInternalReserved(reservedRes.turn);

                    // 시간/연월 정보 동기화 (GetReservedCommand 응답 기준)
                    const baseTime = reservedRes.turnTime ? new Date(reservedRes.turnTime) : null;
                    setTurnBaseTime(baseTime && !Number.isNaN(baseTime.getTime()) ? baseTime : null);
                    setTurnTermMinutes(typeof reservedRes.turnTerm === 'number' ? reservedRes.turnTerm : 0);
                    const nextSessionYear =
                        typeof reservedRes.sessionYear === 'number'
                            ? reservedRes.sessionYear
                            : typeof reservedRes.year === 'number'
                                ? reservedRes.year
                                : null;
                    const nextSessionMonth =
                        typeof reservedRes.sessionMonth === 'number'
                            ? reservedRes.sessionMonth
                            : typeof reservedRes.month === 'number'
                                ? reservedRes.month
                                : null;
                    setSessionYear(nextSessionYear);
                    setSessionMonth(nextSessionMonth);
                } else {
                    setInternalReserved([]);
                }


                if (tableRes?.success && Array.isArray(tableRes.commandTable)) {
                    setInternalCommandTable(tableRes.commandTable);
                } else {
                    setInternalCommandTable([]);
                }
            } catch (err) {
                console.error('[PartialReservedCommand] failed to load reserved commands:', err);
                if (!cancelled) {
                    setInternalReserved([]);
                }
            } finally {
                if (!cancelled) {
                    setInternalLoading(false);
                }
            }
        }

        loadReserved();

        return () => {
            cancelled = true;
        };
    }, [serverID, generalID, reloadKey]);
 
    const processedTurns = useMemo(() => {
        return Array.from({ length: viewMaxTurn }).map((_, index) => {
            const cmd = turnSource[index];

            let yearMonthLabel = '-';
            if (sessionYear != null && sessionMonth != null) {
                const totalMonths = (sessionYear * 12) + (sessionMonth - 1) + index;
                const cYear = Math.floor(totalMonths / 12);
                const cMonth = (totalMonths % 12) + 1;
                yearMonthLabel = `${cYear}년 ${String(cMonth).padStart(2, '0')}월`;
            }

            let timeStr = '??:??';
            if (turnBaseTime && turnTermMinutes > 0) {
                const execTime = new Date(turnBaseTime.getTime() + index * turnTermMinutes * 60000);
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
    }, [turnSource, viewMaxTurn, turnBaseTime, turnTermMinutes, sessionYear, sessionMonth]);

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
 
    const selectAll = useCallback(() => {
        const newSet = new Set<number>();
        processedTurns.forEach(t => newSet.add(t.index));
        setSelectedTurnIndices(newSet);
    }, [processedTurns]);

    const clearSelection = useCallback(() => setSelectedTurnIndices(new Set()), []);
 
    const navigateToCommandProcessing = useCallback((cmd: CommandItem, indices: number[]) => {
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
        params.set('is_chief', 'false');
        if (typeof generalID === 'number') {
            params.set('general_id', String(generalID));
        }

        const encodedCommand = encodeURIComponent(cmd.value);
        router.push(`/${serverID}/processing/${encodedCommand}?${params.toString()}`);
    }, [serverID, generalID, router, showToast]);

    const handleCommandSelect = useCallback((cmd: CommandItem, indices?: number[]) => {
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
    }, [selectedTurnIndices, quickReserveTarget, navigateToCommandProcessing, showToast]);


    const handleDragEnd = useCallback((ids: number[]) => {
        setSelectedTurnIndices(prev => {
            const newSet = new Set(prev);
            ids.forEach(id => newSet.add(id));
            return newSet;
        });
    }, []);

    const handleToggleTurn = useCallback((index: number) => {
        setSelectedTurnIndices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) newSet.delete(index);
            else newSet.add(index);
            return newSet;
        });
    }, []);

    const addSelectedTurns = useCallback((ids: number[]) => {
        setSelectedTurnIndices(prev => {
            const newSet = new Set(prev);
            ids.forEach(id => newSet.add(id));
            return newSet;
        });
    }, []);

    const copy = useCallback((actions: ClipboardAction[]) => {
        // 클립보드에 복사 (추후 붙여넣기 기능 구현 시 활용)
        console.log('Copying actions:', actions);
    }, []);

    const quickReserveStyle = useMemo<React.CSSProperties>(() => ({
        position: 'absolute',
        left: 0,
        right: 0,
        top: quickReserveTarget !== null ? `${quickReserveTarget * 36 + 26}px` : '0',
        zIndex: 10,
        display: quickReserveTarget !== null ? 'block' : 'none',
    }), [quickReserveTarget]);

    const handleQuickReserveToggle = useCallback((index: number) => {
        setQuickReserveTarget(prev => prev === index ? null : index);
    }, []);

    const handleQuickReserveOpen = useCallback((index: number) => {
        setQuickReserveTarget(index);
    }, []);

    const handleQuickReserveClose = useCallback(() => {
        setQuickReserveTarget(null);
    }, []);

    const handleMenuToggle = useCallback(() => {
        setIsMenuOpen(prev => !prev);
    }, []);

    const handleEditModeToggle = useCallback(() => {
        setIsEditMode(prev => {
            const newMode = !prev;
            storedActionsHelperRef.current?.setEditMode(newMode);
            if (!newMode) {
                setQuickReserveTarget(null);
            }
            return newMode;
        });
    }, []);

    const handleViewMaxTurnToggle = useCallback(() => {
        setViewMaxTurn(prev => prev === 30 ? 50 : 30);
    }, []);
    
    // 범위 선택 (홀수턴, 짝수턴, N턴 간격)
    const selectByStep = useCallback((offset: number, step: number) => {
        const newSet = new Set<number>();
        for (let i = offset; i < viewMaxTurn; i += step) {
            newSet.add(i);
        }
        setSelectedTurnIndices(newSet);
    }, [viewMaxTurn]);
    
    // 선택된 턴의 액션 추출
    const extractSelectedActions = useCallback((): StoredAction[] => {
        const sorted = Array.from(selectedTurnIndices).sort((a, b) => a - b);
        const minIdx = sorted[0] ?? 0;
        
        return sorted.map(idx => {
            const t = processedTurns[idx];
            return {
                turnList: [idx - minIdx], // 상대적 위치
                turnObj: { action: t.action, arg: t.arg, brief: t.brief }
            };
        });
    }, [selectedTurnIndices, processedTurns]);
    
    // 클립보드 복사
    const clipboardCopy = useCallback(() => {
        if (selectedTurnIndices.size === 0) {
            showToast('먼저 턴을 선택해주세요.', 'warning');
            return;
        }
        
        const actions = extractSelectedActions();
        setClipboard(actions);
        storedActionsHelperRef.current?.setClipboard(actions);
        showToast('복사 완료', 'success');
        clearSelection();
    }, [selectedTurnIndices, extractSelectedActions, clearSelection, showToast]);
    
    // 텍스트로 복사
    const clipboardTextCopy = useCallback(async () => {
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
    }, [selectedTurnIndices, processedTurns, clearSelection, showToast]);
    
    // 보관함에 저장
    const handleSaveToStorage = useCallback(() => {
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
    }, [selectedTurnIndices, processedTurns, clearSelection, showToast]);
    
    // 보관함에서 삭제
    const handleDeleteFromStorage = useCallback((key: string) => {
        storedActionsHelperRef.current?.deleteStoredActions(key);
        setStoredActions(storedActionsHelperRef.current?.getStoredActions() || new Map());
        showToast('보관함에서 삭제되었습니다.', 'success');
    }, [showToast]);
    
    // 최근 액션 저장
    const saveRecentAction = useCallback((action: TurnObj) => {
        storedActionsHelperRef.current?.pushRecentActions(action);
        setRecentActions(storedActionsHelperRef.current?.getRecentActions() || []);
    }, []);

    // DragSelect에서 드래그 종료 후 편집 모드로 전환하는 핸들러
    const handleNormalModeDragEnd = useCallback((ids: number[]) => {
        addSelectedTurns(ids);
        setIsEditMode(true);
    }, [addSelectedTurns]);

    // 복사 버튼 클릭 핸들러
    const handleCopyClick = useCallback(() => {
        const actions = Array.from(selectedTurnIndices).map(idx => {
            const t = processedTurns[idx];
            return { turnList: [idx], action: t.action, arg: t.arg, brief: t.brief };
        });
        copy(actions as ClipboardAction[]);
        showToast("복사됨", "success");
    }, [selectedTurnIndices, processedTurns, copy, showToast]);

    // 명령 취소 (휴식으로 변경)
    const handleCancelCommand = useCallback(async (turnIndex: number) => {
        const turn = processedTurns[turnIndex];
        if (!turn || turn.action === 'rest') {
            return; // 이미 휴식이면 무시
        }

        if (!window.confirm(`${turnIndex + 1}턴의 "${turn.brief.replace(/<[^>]*>/g, '')}" 명령을 취소하시겠습니까?`)) {
            return;
        }

        try {
            const response = await SammoAPI.CommandReserveCommand({
                serverID,
                general_id: generalID,
                turnList: [turnIndex],
                action: 'che_휴식',
                arg: {},
            });

            if (response?.success) {
                showToast(`${turnIndex + 1}턴 명령이 취소되었습니다.`, 'success');
                // 명령 목록 새로고침
                onGlobalReload?.();
            } else {
                showToast('명령 취소에 실패했습니다.', 'error');
            }
        } catch (err) {
            console.error('명령 취소 실패:', err);
            showToast('명령 취소에 실패했습니다.', 'error');
        }
    }, [serverID, generalID, processedTurns, showToast, onGlobalReload]);

    // 선택된 턴들의 명령 일괄 취소
    const handleCancelSelectedCommands = useCallback(async () => {
        if (selectedTurnIndices.size === 0) {
            showToast('먼저 턴을 선택해주세요.', 'warning');
            return;
        }

        const nonRestTurns = Array.from(selectedTurnIndices).filter(idx => {
            const turn = processedTurns[idx];
            return turn && turn.action !== 'rest';
        });

        if (nonRestTurns.length === 0) {
            showToast('취소할 명령이 없습니다.', 'info');
            return;
        }

        if (!window.confirm(`선택된 ${nonRestTurns.length}개의 명령을 취소하시겠습니까?`)) {
            return;
        }

        try {
            const response = await SammoAPI.CommandReserveCommand({
                serverID,
                general_id: generalID,
                turnList: nonRestTurns,
                action: 'che_휴식',
                arg: {},
            });

            if (response?.success) {
                showToast(`${nonRestTurns.length}개의 명령이 취소되었습니다.`, 'success');
                clearSelection();
                onGlobalReload?.();
            } else {
                showToast('명령 취소에 실패했습니다.', 'error');
            }
        } catch (err) {
            console.error('명령 일괄 취소 실패:', err);
            showToast('명령 취소에 실패했습니다.', 'error');
        }
    }, [serverID, generalID, selectedTurnIndices, processedTurns, showToast, clearSelection, onGlobalReload]);

    // 시간 긴급도 계산
    const getTimeUrgency = useCallback((turnIndex: number): 'normal' | 'imminent' | 'urgent' => {
        if (!turnBaseTime || turnTermMinutes <= 0) return 'normal';
        
        const now = new Date();
        const execTime = new Date(turnBaseTime.getTime() + turnIndex * turnTermMinutes * 60000);
        const diffMinutes = (execTime.getTime() - now.getTime()) / 60000;
        
        if (diffMinutes <= 5) return 'urgent'; // 5분 이내
        if (diffMinutes <= 15) return 'imminent'; // 15분 이내
        return 'normal';
    }, [turnBaseTime, turnTermMinutes]);

    const isBusy = loading || internalLoading;

    if (isBusy && (turnSource.length === 0)) return <div>Loading...</div>;

    return (
        <div className={styles.container} style={{ color: colorSystem?.text }}>
            {/* Control Pad */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarRow}>
                    <button className={styles.toolbarButton} onClick={handleEditModeToggle}>
                        {isEditMode ? "일반 모드" : "고급 모드"}
                    </button>
                    <button className={styles.toolbarButton} onClick={handleViewMaxTurnToggle}>
                        {viewMaxTurn}턴
                    </button>

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
                                        onClick={clipboardCopy}
                                    >
                                        📋 복사하기
                                    </button>
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
                                    <div className="border-t border-gray-600 my-1" />
                                    <button 
                                        className="block w-full text-left px-3 py-1 hover:bg-red-900/50 text-red-400 text-sm"
                                        onClick={handleCancelSelectedCommands}
                                    >
                                        🗑️ 명령 취소
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
                                                <span className="text-sm text-left flex-1 truncate">{key}</span>
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
                                            <div 
                                                key={idx}
                                                className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm truncate"
                                            >
                                                {action.brief || action.action}
                                            </div>
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
 
 
             <div className={styles.commandTableWrapper}>

                {quickReserveTarget !== null && (
                    <div style={quickReserveStyle} className="bg-gray-900 border border-gray-700 p-2 shadow-lg">
                        <CommandSelectForm
                            commandTable={commandTableSource}
                            onSelectCommand={handleCommandSelect}
                            onClose={handleQuickReserveClose}
                            turnIndex={quickReserveTarget}
                            hideHeader
                        />
                    </div>
                )}

                <div className={cn(styles.commandTable, isEditMode && styles.isEditMode)}>
                    {/* Same 3-column logic as ChiefReservedCommand */}
                    {/* Col 1 */}
                    {isEditMode ? (
                        <DragSelect
                            className={styles.turnNumberColumn}
                            onDragEnd={handleDragEnd}
                        >
                            {({ selected }) => (
                                <>
                                    {processedTurns.map((turn) => (
                                        <TurnCell
                                            key={`idx-${turn.index}`}
                                            turn={turn}
                                            isSelected={selectedTurnIndices.has(turn.index)}
                                            isActive={selected.has(turn.index)}
                                            isEditMode={true}
                                            onClick={() => handleToggleTurn(turn.index)}
                                        />
                                    ))}
                                </>
                            )}
                        </DragSelect>
                    ) : (
                        <>
                            <DragSelect
                                className={styles.turnNumberColumn}
                                onDragEnd={handleNormalModeDragEnd}
                            >
                                {({ selected }) => (
                                    <>
                                        {processedTurns.map((turn) => (
                                            <TurnCell
                                                key={`turn-${turn.index}`}
                                                turn={turn}
                                                isSelected={false}
                                                isActive={selected.has(turn.index)}
                                                isEditMode={false}
                                                onClick={() => {}}
                                            />
                                        ))}
                                    </>
                                )}
                            </DragSelect>

                            <div className={styles.yearMonthColumn}>
                                {processedTurns.map((turn) => (
                                    <YearMonthCell key={`ym-${turn.index}`} yearMonth={turn.yearMonth} />
                                ))}
                            </div>

                            <div className={styles.timeColumn}>
                                {processedTurns.map((turn) => (
                                    <TimeCell 
                                        key={`time-${turn.index}`} 
                                        timeStr={turn.timeStr} 
                                        urgency={getTimeUrgency(turn.index)}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Col 2 */}
                    {isEditMode ? (
                        <div className={styles.timeColumn}>
                            {processedTurns.map((turn) => (
                                <TimeCell 
                                    key={`time-edit-${turn.index}`} 
                                    timeStr={turn.timeStr} 
                                    yearMonth={turn.yearMonth}
                                    isEditMode={true}
                                    urgency={getTimeUrgency(turn.index)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.commandColumn}>
                            {processedTurns.map((turn) => (
                                <CommandCell
                                    key={`brief-${turn.index}`}
                                    brief={turn.brief}
                                    onClick={() => handleQuickReserveOpen(turn.index)}
                                    isRest={turn.action === 'rest' || turn.action === 'che_휴식'}
                                    isFirstTurn={turn.index === 0}
                                    onCancel={() => handleCancelCommand(turn.index)}
                                    showCancel={true}
                                    clickable
                                />
                            ))}
                        </div>
                    )}

                    {/* Col 3 */}
                    {isEditMode ? (
                        <div className={styles.commandColumn}>
                            {processedTurns.map((turn) => (
                                <CommandCell
                                    key={`brief-edit-${turn.index}`}
                                    brief={turn.brief}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.actionColumn}>
                            {processedTurns.map((turn) => (
                                <ActionCell
                                    key={`action-${turn.index}`}
                                    turnIndex={turn.index}
                                    isActive={quickReserveTarget === turn.index}
                                    onClick={() => handleQuickReserveToggle(turn.index)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-2">
                <button
                    className="btn btn-info w-full"
                    onClick={handleMenuToggle}
                >
                    명령 선택 ▾
                </button>
                {isMenuOpen && (
                    <div className="mt-2 border border-gray-700 bg-gray-900 p-2">
                        <CommandSelectForm
                            commandTable={commandTableSource}
                            onSelectCommand={handleCommandSelect}
                        />
                    </div>
                )}
            </div>

        </div>
    );
}

// 컴포넌트 전체를 memo로 감싸서 부모의 불필요한 리렌더링 방지
export { PartialReservedCommand };
