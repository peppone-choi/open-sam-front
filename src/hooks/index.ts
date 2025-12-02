/**
 * 커스텀 훅 exports
 */

// 알림 시스템
export { useNotifications } from './useNotifications';
export type { Notification, NotificationType, UseNotificationsOptions } from './useNotifications';

// 게임 훅
export { useSocket } from './useSocket';
export { useBattleCutscene } from './useBattleCutscene';
export { useBattleSocket } from './useBattleSocket';
export { useCommandExecution } from './useCommandExecution';
export { useSammoCommandExecution } from './useSammoCommandExecution';
export { useSammoGameConst } from './useSammoGameConst';
export { useShortcut } from './useShortcut';
export { useUnitConst } from './useUnitConst';
export { useGin7Telemetry } from './useGin7Telemetry';

// 게임 하위 훅
export * from './game/useCommandClipboard';
export * from './game/useTurnSelection';

// 모바일 훅
export { useMobileDetect, useIsTouchDevice, useOrientation } from './useMobileDetect';
export { useTouchGestures, useSwipe, usePullToRefresh } from './useTouchGestures';
export { useViewportSize, useKeyboardOpen } from './useViewportSize';

// 접근성 훅
export { useFocusTrap, useArrowKeyNavigation, useSkipLinks } from './useFocusTrap';


