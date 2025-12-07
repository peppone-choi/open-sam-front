'use client';

import { createContext, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useGin7TutorialStore } from '@/stores/gin7TutorialStore';
import Spotlight from './Spotlight';
import AdvisorPopup from './AdvisorPopup';
import { allTutorials } from '@/data/gin7/tutorials';
import type { TutorialSequence, AdvisorMessage } from '@/types/gin7/tutorial';

// 튜토리얼 시퀀스 레지스트리
const tutorialSequences: Map<string, TutorialSequence> = new Map();

// 기본 튜토리얼 시퀀스 등록
allTutorials.forEach((seq) => {
  tutorialSequences.set(seq.id, seq);
});

// 커스텀 조건 핸들러 레지스트리
const customConditions: Map<string, () => boolean> = new Map();

// 콜백 핸들러 레지스트리
const tutorialCallbacks: Map<string, () => void> = new Map();

interface TutorialContextType {
  // 튜토리얼 시작
  startTutorial: (sequenceId: string) => void;
  // 튜토리얼 시퀀스 등록
  registerSequence: (sequence: TutorialSequence) => void;
  // 커스텀 조건 등록
  registerCondition: (name: string, condition: () => boolean) => void;
  // 콜백 등록
  registerCallback: (name: string, callback: () => void) => void;
  // Advisor 메시지 표시
  showAdvisorMessage: (message: AdvisorMessage) => void;
  // 튜토리얼 활성 상태
  isActive: boolean;
  // 특정 시퀀스 완료 여부
  isCompleted: (sequenceId: string) => boolean;
  // 튜토리얼 비활성화
  disableTutorial: () => void;
  // Advisor 비활성화
  disableAdvisor: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const store = useGin7TutorialStore();

  // 튜토리얼 시작
  const startTutorial = useCallback((sequenceId: string) => {
    const sequence = tutorialSequences.get(sequenceId);
    if (!sequence) {
      console.error(`Tutorial sequence "${sequenceId}" not found`);
      return;
    }
    store.startSequence(sequence);
  }, [store]);

  // 시퀀스 등록
  const registerSequence = useCallback((sequence: TutorialSequence) => {
    tutorialSequences.set(sequence.id, sequence);
  }, []);

  // 커스텀 조건 등록
  const registerCondition = useCallback((name: string, condition: () => boolean) => {
    customConditions.set(name, condition);
  }, []);

  // 콜백 등록
  const registerCallback = useCallback((name: string, callback: () => void) => {
    tutorialCallbacks.set(name, callback);
  }, []);

  // Advisor 표시
  const showAdvisorMessage = useCallback((message: AdvisorMessage) => {
    store.showAdvisor(message);
  }, [store]);

  // 완료 여부
  const isCompleted = useCallback((sequenceId: string) => {
    return store.isSequenceCompleted(sequenceId);
  }, [store]);

  // 현재 단계 처리
  useEffect(() => {
    if (!store.isActive || !store.currentStep) return;

    const step = store.currentStep;

    // beforeShow 콜백 실행
    if (step.beforeShow) {
      const callback = tutorialCallbacks.get(step.beforeShow);
      callback?.();
    }

    // 자동 진행 (wait 액션)
    if (step.action === 'wait' && step.waitDuration) {
      const timer = setTimeout(() => {
        // afterComplete 콜백 실행
        if (step.afterComplete) {
          const callback = tutorialCallbacks.get(step.afterComplete);
          callback?.();
        }
        store.nextStep();
      }, step.waitDuration);
      return () => clearTimeout(timer);
    }

    // 커스텀 조건 체크
    if (step.action === 'custom' && step.customCondition) {
      const condition = customConditions.get(step.customCondition);
      if (condition) {
        const checkInterval = setInterval(() => {
          if (condition()) {
            clearInterval(checkInterval);
            if (step.afterComplete) {
              const callback = tutorialCallbacks.get(step.afterComplete);
              callback?.();
            }
            store.nextStep();
          }
        }, 100);
        return () => clearInterval(checkInterval);
      }
    }

    // 클릭 액션 이벤트 리스너
    if (step.action === 'click' && step.targetElement) {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as Element;
        if (target.matches(step.targetElement!) || target.closest(step.targetElement!)) {
          if (step.afterComplete) {
            const callback = tutorialCallbacks.get(step.afterComplete);
            callback?.();
          }
          store.nextStep();
        }
      };
      document.addEventListener('click', handleClick, true);
      return () => document.removeEventListener('click', handleClick, true);
    }
  }, [store, store.isActive, store.currentStep]);

  const contextValue: TutorialContextType = {
    startTutorial,
    registerSequence,
    registerCondition,
    registerCallback,
    showAdvisorMessage,
    isActive: store.isActive,
    isCompleted,
    disableTutorial: () => store.setTutorialEnabled(false),
    disableAdvisor: () => store.setAdvisorEnabled(false),
  };

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}

      {/* Spotlight 오버레이 */}
      {store.tutorialEnabled && (
        <Spotlight
          isActive={store.isActive}
          targetSelector={store.currentStep?.targetElement}
          step={store.currentStep ?? undefined}
          padding={store.currentStep?.highlightPadding ?? 8}
          onNext={store.nextStep}
          onSkip={store.skipSequence}
          onClose={store.completeSequence}
          currentStepNumber={store.currentStepIndex + 1}
          totalSteps={store.currentSequence?.steps.length ?? 1}
        />
      )}

      {/* Advisor 팝업 */}
      {store.advisorEnabled && store.advisorMessage && (
        <AdvisorPopup
          message={store.advisorMessage}
          onDismiss={store.dismissAdvisor}
          onDismissPermanently={() => 
            store.dismissAdvisorPermanently(store.advisorMessage!.id)
          }
        />
      )}
    </TutorialContext.Provider>
  );
}

