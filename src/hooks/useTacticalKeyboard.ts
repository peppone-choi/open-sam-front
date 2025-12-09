'use client';

import { useEffect, useCallback } from 'react';
import { useGin7TacticalStore } from '@/stores/gin7TacticalStore';
import type { FormationType } from '@/types/gin7-tactical';

// ============================================================
// Keyboard Shortcut Map
// ============================================================

interface KeyBinding {
  key: string;
  action: () => void;
  description: string;
  requiresSelection?: boolean;
}

// ============================================================
// Hook Implementation
// ============================================================

export function useTacticalKeyboard() {
  const selectedUnitIds = useGin7TacticalStore((s) => s.selectedUnitIds);
  const selectAllMyUnits = useGin7TacticalStore((s) => s.selectAllMyUnits);
  const clearSelection = useGin7TacticalStore((s) => s.clearSelection);
  const queueCommand = useGin7TacticalStore((s) => s.queueCommand);
  const toggleEnergyPanel = useGin7TacticalStore((s) => s.toggleEnergyPanel);
  const toggleCommandPanel = useGin7TacticalStore((s) => s.toggleCommandPanel);
  const toggleRadar = useGin7TacticalStore((s) => s.toggleRadar);
  const setCameraZoom = useGin7TacticalStore((s) => s.setCameraZoom);
  const cameraZoom = useGin7TacticalStore((s) => s.cameraZoom);
  
  const hasSelection = selectedUnitIds.size > 0;
  
  // Formation command helper
  const setFormation = useCallback(
    (formation: FormationType) => {
      if (!hasSelection) return;
      queueCommand({
        type: 'FORMATION',
        unitIds: Array.from(selectedUnitIds),
        timestamp: Date.now(),
        data: { formation },
      });
    },
    [hasSelection, selectedUnitIds, queueCommand]
  );
  
  // Stop command
  const stopUnits = useCallback(
    (holdPosition: boolean) => {
      if (!hasSelection) return;
      queueCommand({
        type: 'STOP',
        unitIds: Array.from(selectedUnitIds),
        timestamp: Date.now(),
        data: { holdPosition },
      });
    },
    [hasSelection, selectedUnitIds, queueCommand]
  );
  
  // Retreat command
  const retreatUnits = useCallback(() => {
    if (!hasSelection) return;
    queueCommand({
      type: 'RETREAT',
      unitIds: Array.from(selectedUnitIds),
      timestamp: Date.now(),
      data: {},
    });
  }, [hasSelection, selectedUnitIds, queueCommand]);
  
  // Handle keydown
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      
      // Selection shortcuts
      if (ctrl && key === 'a') {
        e.preventDefault();
        selectAllMyUnits();
        return;
      }
      
      if (key === 'escape') {
        clearSelection();
        return;
      }
      
      // Formation shortcuts (1-6)
      const formationMap: Record<string, FormationType> = {
        '1': 'LINE',
        '2': 'WEDGE',
        '3': 'CIRCLE',
        '4': 'SPREAD',
        '5': 'DEFENSIVE',
        '6': 'ASSAULT',
      };
      
      if (formationMap[key]) {
        e.preventDefault();
        setFormation(formationMap[key]);
        return;
      }
      
      // Action shortcuts
      switch (key) {
        case 's':
          e.preventDefault();
          stopUnits(false);
          break;
        case 'h':
          e.preventDefault();
          stopUnits(true);
          break;
        case 'r':
          e.preventDefault();
          retreatUnits();
          break;
          
        // UI Panel toggles
        case 'e':
          if (!ctrl) {
            e.preventDefault();
            toggleEnergyPanel();
          }
          break;
        case 'c':
          if (!ctrl) {
            e.preventDefault();
            toggleCommandPanel();
          }
          break;
        case 'm':
          e.preventDefault();
          toggleRadar();
          break;
          
        // Camera zoom
        case '+':
        case '=':
          e.preventDefault();
          setCameraZoom(cameraZoom * 1.2);
          break;
        case '-':
        case '_':
          e.preventDefault();
          setCameraZoom(cameraZoom / 1.2);
          break;
          
        // Number pad for quick selection groups (future feature)
        default:
          break;
      }
    },
    [
      selectAllMyUnits,
      clearSelection,
      setFormation,
      stopUnits,
      retreatUnits,
      toggleEnergyPanel,
      toggleCommandPanel,
      toggleRadar,
      setCameraZoom,
      cameraZoom,
    ]
  );
  
  // Register keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Return shortcut info for UI display
  return {
    shortcuts: [
      { key: 'Ctrl+A', description: '전체 선택' },
      { key: 'Esc', description: '선택 해제' },
      { key: '1-6', description: '진형 변경' },
      { key: 'S', description: '정지' },
      { key: 'H', description: '진지 사수' },
      { key: 'R', description: '철수' },
      { key: 'E', description: '에너지 패널' },
      { key: 'C', description: '명령 패널' },
      { key: 'M', description: '레이더' },
      { key: '+/-', description: '줌' },
    ],
  };
}













