/**
 * 저장된 명령 액션 관리 유틸리티
 * Vue의 StoredActionsHelper.ts를 React 호환으로 변환
 */

export interface TurnObj {
  action: string;
  brief?: string;
  arg?: Record<string, any>;
}

export interface StoredAction {
  turnList: number[];
  turnObj: TurnObj;
}

export class StoredActionsHelper {
  private recentActions: Map<string, TurnObj>;
  private storedActions: Map<string, StoredAction[]>;
  private clipboard: StoredAction[] | undefined;
  private activatedCategory: string;
  private isEditMode: boolean;

  private readonly recentActionsKey: string;
  private readonly storedActionsKey: string;
  private readonly clipboardKey: string;
  private readonly activatedCategoryKey: string;
  private readonly editModeKey: string;

  private readonly maxRecent: number;

  constructor(
    serverNick: string,
    type: 'general' | 'nation',
    mapName: string,
    unitSet: string,
    maxRecent = 10
  ) {
    this.maxRecent = maxRecent;
    this.recentActions = new Map();
    this.storedActions = new Map();
    this.activatedCategory = '';
    this.isEditMode = false;

    const typeKey = `${serverNick}_${mapName}_${unitSet}_${type}`;
    this.recentActionsKey = `${typeKey}RecentActions`;
    this.storedActionsKey = `${typeKey}StoredActions`;
    this.clipboardKey = `${typeKey}Clipboard`;
    this.activatedCategoryKey = `${typeKey}ActivatedCategory`;
    this.editModeKey = `${serverNick}_${type}_isEditMode`;

    this.loadRecentActions();
    this.loadStoredActions();
    this.loadClipboard();
    this.loadActivatedCategory();
    this.loadEditMode();
  }

  // --- Recent Actions ---

  loadRecentActions(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const rawRecentActions = JSON.parse(
        localStorage.getItem(this.recentActionsKey) ?? '[]'
      ) as TurnObj[];
      
      this.recentActions = new Map();
      for (const action of rawRecentActions) {
        const actionKey = JSON.stringify([action.action, action.arg]);
        this.recentActions.set(actionKey, action);
      }
    } catch (e) {
      console.warn(`loadRecentActions error: ${e}`);
    }
  }

  pushRecentActions(action: TurnObj): void {
    const actionKey = JSON.stringify([action.action, action.arg]);
    
    if (this.recentActions.has(actionKey)) {
      this.recentActions.delete(actionKey);
    } else if (this.recentActions.size >= this.maxRecent) {
      const firstKey = this.recentActions.keys().next().value;
      if (firstKey) {
        this.recentActions.delete(firstKey);
      }
    }
    
    this.recentActions.set(actionKey, action);
    this.saveRecentActions();
  }

  saveRecentActions(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(
      this.recentActionsKey,
      JSON.stringify(Array.from(this.recentActions.values()))
    );
  }

  getRecentActions(): TurnObj[] {
    return Array.from(this.recentActions.values());
  }

  // --- Stored Actions ---

  loadStoredActions(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const rawValue: [string, StoredAction[]][] = JSON.parse(
        localStorage.getItem(this.storedActionsKey) ?? '[]'
      );
      this.storedActions = new Map(rawValue);
    } catch (e) {
      console.warn(`loadStoredActions error: ${e}`);
    }
  }

  setStoredActions(actionKey: string, actions: StoredAction[]): void {
    this.storedActions.set(actionKey, actions);
    this.saveStoredActions();
  }

  deleteStoredActions(actionKey: string): boolean {
    const deleted = this.storedActions.delete(actionKey);
    if (deleted) {
      this.saveStoredActions();
    }
    return deleted;
  }

  saveStoredActions(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(
      this.storedActionsKey,
      JSON.stringify(Array.from(this.storedActions.entries()))
    );
  }

  getStoredActions(): Map<string, StoredAction[]> {
    return this.storedActions;
  }

  getStoredActionsByKey(actionKey: string): StoredAction[] | undefined {
    return this.storedActions.get(actionKey);
  }

  // --- Clipboard ---

  loadClipboard(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const rawClipboard = localStorage.getItem(this.clipboardKey);
      if (rawClipboard !== null) {
        this.clipboard = JSON.parse(rawClipboard);
      }
    } catch (e) {
      console.warn(`loadClipboard error: ${e}`);
    }
  }

  setClipboard(actions: StoredAction[] | undefined): void {
    this.clipboard = actions;
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.clipboardKey, JSON.stringify(actions));
  }

  getClipboard(): StoredAction[] | undefined {
    return this.clipboard;
  }

  // --- Activated Category ---

  loadActivatedCategory(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const rawActivatedCategory = localStorage.getItem(this.activatedCategoryKey);
      if (rawActivatedCategory !== null) {
        this.activatedCategory = JSON.parse(rawActivatedCategory);
      }
    } catch (e) {
      console.warn(`loadActivatedCategory error: ${e}`);
    }
  }

  setActivatedCategory(category: string): void {
    this.activatedCategory = category;
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.activatedCategoryKey, JSON.stringify(category));
  }

  getActivatedCategory(): string {
    return this.activatedCategory;
  }

  // --- Edit Mode ---

  loadEditMode(): void {
    if (typeof window === 'undefined') return;
    
    this.isEditMode = localStorage.getItem(this.editModeKey) === '1';
  }

  setEditMode(mode: boolean): void {
    this.isEditMode = mode;
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.editModeKey, mode ? '1' : '0');
  }

  getEditMode(): boolean {
    return this.isEditMode;
  }
}

/**
 * StoredActionsHelper 인스턴스를 생성하는 팩토리 함수
 */
export function createStoredActionsHelper(
  serverNick: string,
  type: 'general' | 'nation',
  mapName: string,
  unitSet: string,
  maxRecent = 10
): StoredActionsHelper {
  return new StoredActionsHelper(serverNick, type, mapName, unitSet, maxRecent);
}

/**
 * React Hook으로 사용할 수 있는 StoredActionsHelper
 */
export function useStoredActionsHelper(
  serverNick: string,
  type: 'general' | 'nation',
  mapName: string,
  unitSet: string,
  maxRecent = 10
): StoredActionsHelper | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // 싱글톤 패턴으로 동일한 키에 대해 같은 인스턴스 반환
  const key = `${serverNick}_${mapName}_${unitSet}_${type}`;
  const instances = (globalThis as any).__storedActionsHelperInstances || new Map();
  
  if (!instances.has(key)) {
    instances.set(key, new StoredActionsHelper(serverNick, type, mapName, unitSet, maxRecent));
    (globalThis as any).__storedActionsHelperInstances = instances;
  }
  
  return instances.get(key);
}




