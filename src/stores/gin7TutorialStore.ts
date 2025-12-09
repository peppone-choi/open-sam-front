import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TutorialSequence, TutorialStep, TutorialProgress, AdvisorMessage } from '@/types/gin7/tutorial';

interface TutorialStoreState {
  // 튜토리얼 상태
  isActive: boolean;
  currentSequence: TutorialSequence | null;
  currentStep: TutorialStep | null;
  currentStepIndex: number;
  
  // 진행 상태
  progress: TutorialProgress;
  
  // Advisor 상태
  advisorMessage: AdvisorMessage | null;
  advisorDismissedIds: string[];
  
  // 설정
  tutorialEnabled: boolean;
  advisorEnabled: boolean;
  
  // 액션 - 튜토리얼
  startSequence: (sequence: TutorialSequence) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepId: string) => void;
  skipSequence: () => void;
  completeSequence: () => void;
  resetTutorial: () => void;
  
  // 액션 - Advisor
  showAdvisor: (message: AdvisorMessage) => void;
  dismissAdvisor: () => void;
  dismissAdvisorPermanently: (messageId: string) => void;
  
  // 액션 - 설정
  setTutorialEnabled: (enabled: boolean) => void;
  setAdvisorEnabled: (enabled: boolean) => void;
  
  // 헬퍼
  isSequenceCompleted: (sequenceId: string) => boolean;
  isSequenceSkipped: (sequenceId: string) => boolean;
  canStartSequence: (sequence: TutorialSequence) => boolean;
}

const initialProgress: TutorialProgress = {
  userId: '',
  completedSequences: [],
  skippedSequences: [],
  lastUpdated: new Date().toISOString(),
};

export const useGin7TutorialStore = create<TutorialStoreState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      isActive: false,
      currentSequence: null,
      currentStep: null,
      currentStepIndex: 0,
      progress: initialProgress,
      advisorMessage: null,
      advisorDismissedIds: [],
      tutorialEnabled: true,
      advisorEnabled: true,

      // 튜토리얼 시작
      startSequence: (sequence) => {
        const state = get();
        
        // 이미 완료했거나 스킵한 경우 체크
        if (state.progress.completedSequences.includes(sequence.id)) {
          if (!sequence.repeatable) {
            console.warn(`Tutorial sequence "${sequence.id}" already completed`);
            return;
          }
        }
        
        // 선행 조건 체크
        if (!state.canStartSequence(sequence)) {
          console.warn(`Tutorial sequence "${sequence.id}" prerequisite not met`);
          return;
        }

        const firstStep = sequence.steps.find(s => s.id === sequence.startStep);
        if (!firstStep) {
          console.error(`Start step "${sequence.startStep}" not found in sequence`);
          return;
        }

        set({
          isActive: true,
          currentSequence: sequence,
          currentStep: firstStep,
          currentStepIndex: sequence.steps.findIndex(s => s.id === sequence.startStep),
          progress: {
            ...state.progress,
            currentSequence: {
              sequenceId: sequence.id,
              currentStepId: firstStep.id,
              startedAt: new Date().toISOString(),
            },
            lastUpdated: new Date().toISOString(),
          },
        });
      },

      // 다음 단계
      nextStep: () => {
        const { currentSequence, currentStep, currentStepIndex } = get();
        if (!currentSequence || !currentStep) return;

        const nextStepId = currentStep.nextStep;
        
        // 다음 단계가 없으면 완료
        if (!nextStepId) {
          get().completeSequence();
          return;
        }

        const nextStepIndex = currentSequence.steps.findIndex(s => s.id === nextStepId);
        const nextStep = currentSequence.steps[nextStepIndex];
        
        if (!nextStep) {
          console.error(`Next step "${nextStepId}" not found`);
          get().completeSequence();
          return;
        }

        set({
          currentStep: nextStep,
          currentStepIndex: nextStepIndex,
          progress: {
            ...get().progress,
            currentSequence: {
              sequenceId: currentSequence.id,
              currentStepId: nextStep.id,
              startedAt: get().progress.currentSequence?.startedAt || new Date().toISOString(),
            },
            lastUpdated: new Date().toISOString(),
          },
        });
      },

      // 이전 단계
      prevStep: () => {
        const { currentSequence, currentStepIndex } = get();
        if (!currentSequence || currentStepIndex <= 0) return;

        const prevStep = currentSequence.steps[currentStepIndex - 1];
        if (!prevStep) return;

        set({
          currentStep: prevStep,
          currentStepIndex: currentStepIndex - 1,
        });
      },

      // 특정 단계로 이동
      goToStep: (stepId) => {
        const { currentSequence } = get();
        if (!currentSequence) return;

        const stepIndex = currentSequence.steps.findIndex(s => s.id === stepId);
        const step = currentSequence.steps[stepIndex];
        
        if (!step) {
          console.error(`Step "${stepId}" not found`);
          return;
        }

        set({
          currentStep: step,
          currentStepIndex: stepIndex,
        });
      },

      // 튜토리얼 스킵
      skipSequence: () => {
        const { currentSequence, progress } = get();
        if (!currentSequence) return;

        set({
          isActive: false,
          currentSequence: null,
          currentStep: null,
          currentStepIndex: 0,
          progress: {
            ...progress,
            skippedSequences: [...progress.skippedSequences, currentSequence.id],
            currentSequence: undefined,
            lastUpdated: new Date().toISOString(),
          },
        });
      },

      // 튜토리얼 완료
      completeSequence: () => {
        const { currentSequence, progress } = get();
        if (!currentSequence) return;

        const updatedCompleted = progress.completedSequences.includes(currentSequence.id)
          ? progress.completedSequences
          : [...progress.completedSequences, currentSequence.id];

        set({
          isActive: false,
          currentSequence: null,
          currentStep: null,
          currentStepIndex: 0,
          progress: {
            ...progress,
            completedSequences: updatedCompleted,
            currentSequence: undefined,
            lastUpdated: new Date().toISOString(),
          },
        });
      },

      // 튜토리얼 초기화
      resetTutorial: () => {
        set({
          isActive: false,
          currentSequence: null,
          currentStep: null,
          currentStepIndex: 0,
          progress: initialProgress,
        });
      },

      // Advisor 표시
      showAdvisor: (message) => {
        const { advisorEnabled, advisorDismissedIds } = get();
        
        if (!advisorEnabled) return;
        if (message.showOnce && advisorDismissedIds.includes(message.id)) return;
        
        set({ advisorMessage: message });
      },

      // Advisor 닫기
      dismissAdvisor: () => {
        set({ advisorMessage: null });
      },

      // Advisor 영구 닫기
      dismissAdvisorPermanently: (messageId) => {
        set((state) => ({
          advisorMessage: null,
          advisorDismissedIds: [...state.advisorDismissedIds, messageId],
        }));
      },

      // 설정
      setTutorialEnabled: (enabled) => set({ tutorialEnabled: enabled }),
      setAdvisorEnabled: (enabled) => set({ advisorEnabled: enabled }),

      // 헬퍼 함수들
      isSequenceCompleted: (sequenceId) => {
        return get().progress.completedSequences.includes(sequenceId);
      },

      isSequenceSkipped: (sequenceId) => {
        return get().progress.skippedSequences.includes(sequenceId);
      },

      canStartSequence: (sequence) => {
        if (!sequence.prerequisite) return true;
        return get().progress.completedSequences.includes(sequence.prerequisite);
      },
    }),
    {
      name: 'gin7-tutorial-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        progress: state.progress,
        advisorDismissedIds: state.advisorDismissedIds,
        tutorialEnabled: state.tutorialEnabled,
        advisorEnabled: state.advisorEnabled,
      }),
    }
  )
);

// Window에 스토어 노출 (디버깅용)
if (typeof window !== 'undefined') {
  const globalWindow = window as Window & { __OPEN_SAM_STORES__?: Record<string, unknown> };
  globalWindow.__OPEN_SAM_STORES__ = globalWindow.__OPEN_SAM_STORES__ ?? {};
  globalWindow.__OPEN_SAM_STORES__.gin7Tutorial = useGin7TutorialStore;
}













