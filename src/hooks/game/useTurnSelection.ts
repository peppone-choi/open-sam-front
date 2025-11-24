import { useState, useCallback, useMemo } from 'react';

export interface UseTurnSelectionProps {
  maxTurn: number;
}

export function useTurnSelection({ maxTurn }: UseTurnSelectionProps) {
  const [selectedTurnIndices, setSelectedTurnIndices] = useState<Set<number>>(new Set());
  const [lastSelectedTurnIndex, setLastSelectedTurnIndex] = useState<number | null>(null);

  const toggleTurn = useCallback((turnIdx: number, multiSelect: boolean = false, rangeSelect: boolean = false) => {
    setSelectedTurnIndices(prev => {
      const next = new Set(prev);

      if (rangeSelect && lastSelectedTurnIndex !== null) {
        const start = Math.min(lastSelectedTurnIndex, turnIdx);
        const end = Math.max(lastSelectedTurnIndex, turnIdx);
        for (let i = start; i <= end; i++) {
          next.add(i);
        }
      } else if (multiSelect) {
        if (next.has(turnIdx)) {
          next.delete(turnIdx);
        } else {
          next.add(turnIdx);
        }
      } else {
        // If clicking single without modifiers, usually we just select that one? 
        // Or in legacy toggle behavior:
        // In legacy, DragSelect calls `toggleTurn` which adds/removes.
        // If single click in Edit Mode, usually it toggles or selects just one.
        // Let's support toggle behavior mainly.
        if (next.has(turnIdx)) {
          next.delete(turnIdx);
        } else {
          next.add(turnIdx);
        }
      }
      return next;
    });
    setLastSelectedTurnIndex(turnIdx);
  }, [lastSelectedTurnIndex]);

  // Direct set (for drag select finalization)
  const setSelectedTurns = useCallback((indices: number[]) => {
    setSelectedTurnIndices(new Set(indices));
  }, []);

  const addSelectedTurns = useCallback((indices: number[]) => {
    setSelectedTurnIndices(prev => {
      const next = new Set(prev);
      indices.forEach(i => next.add(i));
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedTurnIndices(new Set(Array.from({ length: maxTurn }, (_, i) => i)));
  }, [maxTurn]);

  const clearSelection = useCallback(() => {
    setSelectedTurnIndices(new Set());
    setLastSelectedTurnIndex(null);
  }, []);

  const selectStep = useCallback((offset: number, step: number) => {
    const indices = [];
    for (let i = 0; i < maxTurn; i++) {
      if (i % step === offset) {
        indices.push(i);
      }
    }
    setSelectedTurnIndices(new Set(indices));
  }, [maxTurn]);

  const selectOdd = useCallback(() => selectStep(0, 2), [selectStep]); // 0-indexed: 0 is 1st turn (odd visually but index 0) -> Wait.
  // Legacy: `selectStep(0, 2)` -> "홀수턴" (Odd turns).
  // In legacy code: `selectStep(0, 2)` -> index 0, 2, 4... which are 1st, 3rd, 5th turns (Odd).
  // So index%2 === 0 is Odd turns.

  const selectEven = useCallback(() => selectStep(1, 2), [selectStep]);

  return {
    selectedTurnIndices,
    lastSelectedTurnIndex,
    toggleTurn,
    setSelectedTurns,
    addSelectedTurns,
    selectAll,
    clearSelection,
    selectStep,
    selectOdd,
    selectEven
  };
}


