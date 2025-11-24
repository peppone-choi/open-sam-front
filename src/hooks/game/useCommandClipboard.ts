import { useState, useEffect, useCallback } from 'react';
import { TurnObj } from '@/lib/api/sammo';

export interface ClipboardAction {
  turnList: number[]; // Relative offsets usually, or raw indices depending on usage
  action: string;
  arg: any;
  brief: string;
}

export interface StoredMacro {
  name: string;
  actions: ClipboardAction[];
}

const STORAGE_KEY_PREFIX = 'nation-chief-macro';

export function useCommandClipboard(serverID: string, generalID: number) {
  const [clipboard, setClipboard] = useState<ClipboardAction[] | null>(null);
  const [storedMacros, setStoredMacros] = useState<Map<string, ClipboardAction[]>>(new Map());
  const [recentMacros, setRecentMacros] = useState<ClipboardAction[]>([]);

  // Load storage
  useEffect(() => {
    if (!serverID) return;
    try {
      // Legacy key format: nation-chief-macro:session:map:unit:level
      // We might simplify or try to match. For now, let's use a simplified key per user/server
      const key = `${STORAGE_KEY_PREFIX}:${serverID}:${generalID}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert object to Map
        if (Array.isArray(parsed)) {
           // Handle legacy format if needed, or new format
           // Assuming [name, actions][]
           setStoredMacros(new Map(parsed));
        } else {
           // Fallback or object format
           setStoredMacros(new Map(Object.entries(parsed)));
        }
      }
    } catch (e) {
      console.error('Failed to load macros', e);
    }
  }, [serverID, generalID]);

  const saveStorage = useCallback((newMacros: Map<string, ClipboardAction[]>) => {
    try {
      const key = `${STORAGE_KEY_PREFIX}:${serverID}:${generalID}`;
      localStorage.setItem(key, JSON.stringify(Array.from(newMacros.entries())));
      setStoredMacros(newMacros);
    } catch (e) {
      console.error('Failed to save macros', e);
    }
  }, [serverID, generalID]);

  const copy = useCallback((actions: ClipboardAction[]) => {
    setClipboard(actions);
  }, []);

  const storeMacro = useCallback((name: string, actions: ClipboardAction[]) => {
    const newMacros = new Map(storedMacros);
    newMacros.set(name, actions);
    saveStorage(newMacros);
  }, [storedMacros, saveStorage]);

  const deleteMacro = useCallback((name: string) => {
    const newMacros = new Map(storedMacros);
    newMacros.delete(name);
    saveStorage(newMacros);
  }, [storedMacros, saveStorage]);

  const addToRecent = useCallback((action: ClipboardAction) => {
    // TODO: Implement recent logic
  }, []);

  return {
    clipboard,
    storedMacros,
    recentMacros,
    copy,
    storeMacro,
    deleteMacro,
    addToRecent
  };
}


