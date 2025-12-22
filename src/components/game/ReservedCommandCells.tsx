'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import styles from './PartialReservedCommand.module.css';

// 턴 데이터 타입
export interface ProcessedTurn {
    index: number;
    yearMonth: string;
    timeStr: string;
    brief: string;
    action: string;
    arg: any;
}

// 개별 턴 셀 컴포넌트 (메모이제이션)
export const TurnCell = memo(function TurnCell({
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
export const YearMonthCell = memo(function YearMonthCell({ yearMonth }: { yearMonth: string }) {
    return (
        <div className={styles.yearMonthCell}>
            <span className="font-mono text-gray-400">{yearMonth}</span>
        </div>
    );
});

// 시간 셀 컴포넌트 (메모이제이션)
export const TimeCell = memo(function TimeCell({ 
    timeStr, 
    yearMonth, 
    isEditMode 
}: { 
    timeStr: string; 
    yearMonth?: string; 
    isEditMode?: boolean;
}) {
    if (isEditMode && yearMonth) {
        return (
            <div className={styles.timeCell}>
                <div className="flex flex-col items-center justify-center text-[10px] leading-tight">
                    <span className="font-mono text-gray-300">{yearMonth}</span>
                    <span className="font-mono text-gray-400">{timeStr}</span>
                </div>
            </div>
        );
    }
    return (
        <div className={styles.timeCell}>
            <span className="font-mono text-gray-500">{timeStr}</span>
        </div>
    );
});

// 명령 셀 컴포넌트 (메모이제이션)
export const CommandCell = memo(function CommandCell({
    brief,
    onClick,
    clickable = false,
}: {
    brief: string;
    onClick?: () => void;
    clickable?: boolean;
}) {
    return (
        <div
            className={styles.commandCell}
            title={brief}
            onClick={onClick}
            style={clickable ? { cursor: 'pointer' } : undefined}
        >
            <span dangerouslySetInnerHTML={{ __html: brief }} />
        </div>
    );
});

// 액션 셀 컴포넌트 (메모이제이션)
export const ActionCell = memo(function ActionCell({
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

// 권한 배지 컴포넌트
export const OfficerBadge = memo(function OfficerBadge({
    officer,
    colorSystem,
}: {
    officer?: { name?: string; officerLevelText?: string; officerLevel?: number };
    colorSystem?: any;
}) {
    if (!officer) return null;
    
    const levelColors: Record<number, string> = {
        12: '#ffd700', // 군주
        11: '#ffd700', // 참모(문1)
        10: '#c0c0c0', // 장군(무1)
        9: '#cd7f32',  // 문2
        8: '#4a90d9',  // 무3
        7: '#4a90d9',  // 문3
    };
    
    const levelColor = officer.officerLevel ? levelColors[officer.officerLevel] || '#aaffff' : '#aaffff';
    
    return (
        <div className="flex items-center justify-between bg-gray-800 p-2 mb-2 rounded">
            <div style={{ color: levelColor }} className="font-semibold">
                {officer.name}
            </div>
            <div className="text-sm text-gray-400">
                {officer.officerLevelText}
            </div>
        </div>
    );
});

// 범위 선택 드롭다운 컴포넌트
export const RangeSelectDropdown = memo(function RangeSelectDropdown({
    viewMaxTurn,
    onClear,
    onSelectAll,
    onSelectByStep,
    buttonClassName,
}: {
    viewMaxTurn: number;
    onClear: () => void;
    onSelectAll: () => void;
    onSelectByStep: (offset: number, step: number) => void;
    buttonClassName?: string;
}) {
    return (
        <div className="relative inline-block group">
            <button className={buttonClassName}>범위 ▾</button>
            <div className="absolute hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-[100px]">
                <button 
                    className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                    onClick={onClear}
                >
                    해제
                </button>
                <button 
                    className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                    onClick={onSelectAll}
                >
                    모든턴
                </button>
                <button 
                    className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                    onClick={() => onSelectByStep(0, 2)}
                >
                    홀수턴
                </button>
                <button 
                    className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
                    onClick={() => onSelectByStep(1, 2)}
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
                                    onClick={() => onSelectByStep(offset, step)}
                                >
                                    {offset + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// 보관함 드롭다운 컴포넌트
export const StorageDropdown = memo(function StorageDropdown({
    storedActions,
    onApply,
    onDelete,
    buttonClassName,
}: {
    storedActions: Map<string, any[]>;
    onApply?: (key: string, actions: any[]) => void;
    onDelete: (key: string) => void;
    buttonClassName?: string;
}) {
    return (
        <div className="relative inline-block group">
            <button className={buttonClassName}>보관함 ▾</button>
            <div className="absolute hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-[120px] max-h-[200px] overflow-y-auto">
                {storedActions.size === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-400">비어있음</div>
                ) : (
                    Array.from(storedActions.entries()).map(([key, actions]) => (
                        <div key={key} className="flex items-center justify-between px-2 py-1 hover:bg-gray-700">
                            {onApply ? (
                                <button 
                                    className="text-sm text-left flex-1 truncate"
                                    onClick={() => onApply(key, actions)}
                                >
                                    {key}
                                </button>
                            ) : (
                                <span className="text-sm text-left flex-1 truncate">{key}</span>
                            )}
                            <button 
                                className="text-red-400 text-xs ml-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(key);
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
});

// 최근 액션 드롭다운 컴포넌트
export const RecentActionsDropdown = memo(function RecentActionsDropdown({
    recentActions,
    onApply,
    buttonClassName,
}: {
    recentActions: Array<{ action: string; brief?: string; arg?: any }>;
    onApply?: (action: { action: string; brief?: string; arg?: any }) => void;
    buttonClassName?: string;
}) {
    return (
        <div className="relative inline-block group">
            <button className={buttonClassName}>최근 ▾</button>
            <div className="absolute hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-[150px] max-h-[200px] overflow-y-auto right-0">
                {recentActions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-400">비어있음</div>
                ) : (
                    recentActions.slice().reverse().map((action, idx) => (
                        <button 
                            key={idx}
                            className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-sm truncate"
                            onClick={() => onApply?.(action)}
                        >
                            {action.brief || action.action}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
});


