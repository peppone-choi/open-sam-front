'use client';

import { useEffect } from 'react';

interface UseShortcutOptions {
  /**
   * 논리적 컨텍스트 키 (예: 'logh-tactical', 'logh-strategy')
   * 동일 컨텍스트 내에서는 한 컴포넌트만 동일 키를 등록하도록 합의
   */
  scope?: string;
  /**
   * 포커스된 입력/텍스트영역에서는 단축키를 무시할지 여부 (기본 true)
   */
  ignoreWhenTyping?: boolean;
}

// 전역 레지스트리: (key, scope) 단위로 마지막 핸들러만 유지
const shortcutRegistry = new Map<string, (event: KeyboardEvent) => void>();

export function useShortcut(
  key: string,
  handler: () => void,
  options: UseShortcutOptions = {},
) {
  const { scope = 'global', ignoreWhenTyping = true } = options;

  useEffect(() => {
    const normalizedKey = key.toLowerCase();
    const registryKey = `${scope}:${normalizedKey}`;

    const wrapped = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== normalizedKey) return;

      if (ignoreWhenTyping) {
        const target = event.target as HTMLElement | null;
        if (target) {
          const tag = target.tagName.toLowerCase();
          const isInputLike =
            tag === 'input' ||
            tag === 'textarea' ||
            (target as HTMLElement).isContentEditable;
          if (isInputLike) return;
        }
      }

      handler();
    };

    // 기존 핸들러 덮어쓰기 (동일 scope+key)
    shortcutRegistry.set(registryKey, wrapped);

    const listener = (event: KeyboardEvent) => {
      const fn = shortcutRegistry.get(registryKey);
      if (fn) fn(event);
    };

    window.addEventListener('keydown', listener);

    return () => {
      window.removeEventListener('keydown', listener);

      const current = shortcutRegistry.get(registryKey);
      if (current === wrapped) {
        shortcutRegistry.delete(registryKey);
      }
    };
  }, [key, handler, scope, ignoreWhenTyping]);
}
