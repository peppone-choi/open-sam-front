'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useGin7TutorialStore } from '@/stores/gin7TutorialStore';
import { useGin7UserStore } from '@/stores/gin7UserStore';
import {
  allAdvisorMessages,
  getMessagesByEvent,
  getMessagesByCondition,
} from '@/data/gin7/tutorials/advisor-messages';
import type { AdvisorMessage } from '@/types/gin7/tutorial';

interface AdvisorConditionContext {
  pcp: number;
  maxPcp: number;
  mcp: number;
  maxMcp: number;
  resources?: {
    food: number;
    minerals: number;
    fuel: number;
    credits: number;
  };
  support?: number;
  combatAdvantage?: number;
}

type ConditionChecker = (context: AdvisorConditionContext, params?: Record<string, unknown>) => boolean;

/** 조건 체커 레지스트리 */
const conditionCheckers: Record<string, ConditionChecker> = {
  lowPCP: (ctx, params) => {
    const threshold = (params?.threshold as number) ?? 10;
    return ctx.pcp <= threshold;
  },
  lowMCP: (ctx, params) => {
    const threshold = (params?.threshold as number) ?? 5;
    return ctx.mcp <= threshold;
  },
  mcpFull: (ctx, params) => {
    const threshold = (params?.threshold as number) ?? 0.8;
    return ctx.mcp >= ctx.maxMcp * threshold;
  },
  lowResources: (ctx, params) => {
    if (!ctx.resources) return false;
    const threshold = (params?.threshold as number) ?? 100;
    const { food, minerals, fuel } = ctx.resources;
    return food < threshold || minerals < threshold || fuel < threshold;
  },
  lowFuel: (ctx, params) => {
    if (!ctx.resources) return false;
    const threshold = (params?.threshold as number) ?? 50;
    return ctx.resources.fuel < threshold;
  },
  lowSupport: (ctx, params) => {
    if (ctx.support === undefined) return false;
    const threshold = (params?.threshold as number) ?? 30;
    return ctx.support < threshold;
  },
  rebellionRisk: (ctx, params) => {
    if (ctx.support === undefined) return false;
    const threshold = (params?.threshold as number) ?? 20;
    return ctx.support < threshold;
  },
  combatDisadvantage: (ctx, params) => {
    if (ctx.combatAdvantage === undefined) return false;
    const threshold = (params?.threshold as number) ?? 0.3;
    return ctx.combatAdvantage < threshold;
  },
};

/** 콜백 핸들러 레지스트리 */
const callbackHandlers: Record<string, () => void> = {};

/**
 * 콜백 핸들러 등록
 */
export function registerAdvisorCallback(name: string, handler: () => void): void {
  callbackHandlers[name] = handler;
}

/**
 * 콜백 실행
 */
export function executeAdvisorCallback(name: string): void {
  const handler = callbackHandlers[name];
  if (handler) {
    handler();
  } else {
    console.warn(`Advisor callback "${name}" not found`);
  }
}

/**
 * Advisor 시스템 훅
 */
export function useAdvisor() {
  const { showAdvisor, advisorEnabled, advisorDismissedIds } = useGin7TutorialStore();
  const { character } = useGin7UserStore();
  
  // 마지막 표시 시간 추적 (쿨다운용)
  const lastShownRef = useRef<Record<string, number>>({});
  
  // 세션 시작 시간
  const sessionStartRef = useRef<number>(Date.now());

  /**
   * 이벤트 기반 메시지 트리거
   */
  const triggerEvent = useCallback((eventName: string) => {
    if (!advisorEnabled) return;

    const messages = getMessagesByEvent(eventName);
    if (messages.length === 0) return;

    // 우선순위 높은 것 먼저
    const sortedMessages = messages.sort((a, b) => b.priority - a.priority);

    for (const message of sortedMessages) {
      // 이미 영구 닫은 메시지 스킵
      if (advisorDismissedIds.includes(message.id)) continue;

      // 쿨다운 체크
      if (message.cooldown) {
        const lastShown = lastShownRef.current[message.id] || 0;
        if (Date.now() - lastShown < message.cooldown * 1000) continue;
      }

      // 메시지 표시
      showAdvisor(message);
      lastShownRef.current[message.id] = Date.now();
      break; // 하나만 표시
    }
  }, [advisorEnabled, advisorDismissedIds, showAdvisor]);

  /**
   * 조건 기반 메시지 체크
   */
  const checkConditions = useCallback((context: AdvisorConditionContext) => {
    if (!advisorEnabled) return;

    const conditionMessages = allAdvisorMessages.filter(
      m => m.trigger.type === 'condition'
    );

    // 우선순위 높은 것 먼저
    const sortedMessages = conditionMessages.sort((a, b) => b.priority - a.priority);

    for (const message of sortedMessages) {
      // 이미 영구 닫은 메시지 스킵
      if (advisorDismissedIds.includes(message.id)) continue;

      // 쿨다운 체크
      if (message.cooldown) {
        const lastShown = lastShownRef.current[message.id] || 0;
        if (Date.now() - lastShown < message.cooldown * 1000) continue;
      }

      // 조건 체크
      const checker = conditionCheckers[message.trigger.value];
      if (checker && checker(context, message.trigger.params)) {
        showAdvisor(message);
        lastShownRef.current[message.id] = Date.now();
        break; // 하나만 표시
      }
    }
  }, [advisorEnabled, advisorDismissedIds, showAdvisor]);

  /**
   * 시간 기반 메시지 체크
   */
  const checkTimeTriggers = useCallback(() => {
    if (!advisorEnabled) return;

    const elapsed = (Date.now() - sessionStartRef.current) / 1000 / 60; // 분 단위

    const timeMessages = allAdvisorMessages.filter(
      m => m.trigger.type === 'time'
    );

    for (const message of timeMessages) {
      // 이미 영구 닫은 메시지 스킵
      if (advisorDismissedIds.includes(message.id)) continue;

      // 시간 조건 파싱
      const timeValue = message.trigger.value;
      const match = timeValue.match(/after_(\d+)_minutes/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        if (elapsed >= minutes) {
          // 한 번만 표시하는 메시지는 쿨다운 대신 체크
          if (message.showOnce && lastShownRef.current[message.id]) continue;

          showAdvisor(message);
          lastShownRef.current[message.id] = Date.now();
          break;
        }
      }
    }
  }, [advisorEnabled, advisorDismissedIds, showAdvisor]);

  // 주기적으로 조건 체크
  useEffect(() => {
    if (!advisorEnabled || !character) return;

    const context: AdvisorConditionContext = {
      pcp: character.pcp,
      maxPcp: character.maxPcp,
      mcp: character.mcp,
      maxMcp: character.maxMcp,
    };

    // 초기 체크
    checkConditions(context);
    checkTimeTriggers();

    // 30초마다 조건 체크
    const conditionInterval = setInterval(() => {
      const updatedContext: AdvisorConditionContext = {
        pcp: character.pcp,
        maxPcp: character.maxPcp,
        mcp: character.mcp,
        maxMcp: character.maxMcp,
      };
      checkConditions(updatedContext);
    }, 30000);

    // 1분마다 시간 트리거 체크
    const timeInterval = setInterval(checkTimeTriggers, 60000);

    return () => {
      clearInterval(conditionInterval);
      clearInterval(timeInterval);
    };
  }, [advisorEnabled, character, checkConditions, checkTimeTriggers]);

  return {
    triggerEvent,
    checkConditions,
    registerCallback: registerAdvisorCallback,
    executeCallback: executeAdvisorCallback,
  };
}

export default useAdvisor;








