'use client';
 
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import styles from './PartialReservedCommand.module.css';
import CommandSelectForm, { CommandItem } from './CommandSelectForm';
import DragSelect from '../common/DragSelect';
import { useToast } from '@/contexts/ToastContext';


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
    const { showToast } = useToast();
    const router = useRouter();

    const processedTurns = useMemo(() => {
        return Array.from({ length: viewMaxTurn }).map((_, index) => {
            const cmd = reservedCommands[index];
            return {
                index,
                timeStr: cmd ? cmd.time : '00:00',
                brief: cmd ? cmd.brief : '휴식',
                action: cmd ? cmd.action : 'rest',
                arg: cmd ? cmd.arg : {},
            };
        });
    }, [reservedCommands, viewMaxTurn]);

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

    const handleClipboardAction = (action: 'copy' | 'paste') => {
        if (action === 'copy') {
            const actions = Array.from(selectedTurnIndices).map(idx => {
                const t = processedTurns[idx];
                return { turnList: [idx], action: t.action, arg: t.arg, brief: t.brief };
            });
            console.log('Copying actions:', actions);
            showToast("복사됨", "success");
        } else {
            console.log('Pasting actions');
            showToast("붙여넣기 (기능 미구현)", "info");
        }
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
                    <button className={styles.toolbarButton} onClick={() => setIsEditMode(!isEditMode)}>
                        {isEditMode ? "일반 모드" : "고급 모드"}
                    </button>

                    {/* Repeat Dropdown */}
                    <div className="dropdown">
                        {/* TODO: Dropdown implementation */}
                        <button className={styles.toolbarButton}>반복</button>
                    </div>

                     {isEditMode && (
                         <>
                             <button className={styles.toolbarButton} onClick={() => selectAll()}>모두</button>
                             <button className={styles.toolbarButton} onClick={() => clearSelection()}>해제</button>
                             <button className={styles.toolbarButton} onClick={() => handleClipboardAction('copy')}>복사</button>
                             <button className={styles.toolbarButton} onClick={() => handleClipboardAction('paste')}>붙여넣기</button>
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
                        <div className={styles.timeColumn}>
                            {processedTurns.map((turn) => (
                                <div key={`time-${turn.index}`} className={styles.timeCell}>
                                    {turn.timeStr}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Column 2 */}
                    {isEditMode ? (
                        <div className={styles.timeColumn}>
                            {processedTurns.map((turn) => (
                                <div key={`time-${turn.index}`} className={styles.timeCell}>
                                    {turn.timeStr}
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
