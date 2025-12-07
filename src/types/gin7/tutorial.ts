/**
 * Gin7 Tutorial System Types
 * 튜토리얼 및 가이드 시스템 타입 정의
 */

/** 튜토리얼 단계 액션 타입 */
export type TutorialAction =
  | 'click'       // 특정 요소 클릭
  | 'hover'       // 특정 요소에 호버
  | 'input'       // 텍스트 입력
  | 'wait'        // 대기 (자동 진행)
  | 'navigate'    // 페이지 이동
  | 'custom';     // 커스텀 조건

/** 화살표/포인터 방향 */
export type SpotlightPointerPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/** 튜토리얼 단계 정의 */
export interface TutorialStep {
  /** 고유 ID */
  id: string;
  /** 단계 제목 */
  title: string;
  /** 단계 설명 */
  description: string;
  /** 타겟 요소 CSS 선택자 (없으면 중앙 모달) */
  targetElement?: string;
  /** 필요한 액션 */
  action: TutorialAction;
  /** 다음 단계 ID (없으면 시퀀스 종료) */
  nextStep?: string;
  /** 포인터 위치 */
  pointerPosition?: SpotlightPointerPosition;
  /** 자동 진행 대기 시간 (ms) - action이 'wait'일 때 */
  waitDuration?: number;
  /** 커스텀 조건 함수명 (action이 'custom'일 때) */
  customCondition?: string;
  /** 이 단계 전 실행할 콜백 */
  beforeShow?: string;
  /** 이 단계 후 실행할 콜백 */
  afterComplete?: string;
  /** 스킵 가능 여부 */
  skippable?: boolean;
  /** 하이라이트 패딩 (px) */
  highlightPadding?: number;
  /** 추가 데이터 */
  meta?: Record<string, unknown>;
}

/** 튜토리얼 시퀀스 정의 */
export interface TutorialSequence {
  /** 시퀀스 고유 ID */
  id: string;
  /** 시퀀스 이름 */
  name: string;
  /** 시퀀스 설명 */
  description: string;
  /** 시퀀스 카테고리 */
  category: TutorialCategory;
  /** 시작 단계 ID */
  startStep: string;
  /** 모든 단계들 */
  steps: TutorialStep[];
  /** 선행 시퀀스 ID (완료해야 이 시퀀스 시작 가능) */
  prerequisite?: string;
  /** 예상 소요 시간 (초) */
  estimatedDuration?: number;
  /** 보상 (있다면) */
  reward?: TutorialReward;
  /** 반복 가능 여부 */
  repeatable?: boolean;
}

/** 튜토리얼 카테고리 */
export type TutorialCategory =
  | 'basics'       // 기본 조작
  | 'map'          // 맵 탐색
  | 'fleet'        // 함대 관리
  | 'combat'       // 전투 시스템
  | 'economy'      // 경제/내정
  | 'politics'     // 정치
  | 'advanced';    // 고급 기능

/** 튜토리얼 보상 */
export interface TutorialReward {
  type: 'pcp' | 'mcp' | 'item' | 'achievement';
  value: number | string;
}

/** 튜토리얼 진행 상태 */
export interface TutorialProgress {
  /** 유저 ID */
  userId: string;
  /** 완료한 시퀀스 ID 목록 */
  completedSequences: string[];
  /** 현재 진행 중인 시퀀스 */
  currentSequence?: {
    sequenceId: string;
    currentStepId: string;
    startedAt: string;
  };
  /** 스킵한 시퀀스 ID 목록 */
  skippedSequences: string[];
  /** 마지막 업데이트 */
  lastUpdated: string;
}

/** Spotlight 상태 */
export interface SpotlightState {
  /** 활성화 여부 */
  isActive: boolean;
  /** 타겟 요소 rect */
  targetRect?: DOMRect;
  /** 포인터 위치 */
  pointerPosition?: SpotlightPointerPosition;
  /** 현재 단계 정보 */
  step?: TutorialStep;
  /** 하이라이트 패딩 */
  padding: number;
}

/** 툴팁 정의 */
export interface TooltipDefinition {
  /** 고유 ID */
  id: string;
  /** 용어/키워드 */
  term: string;
  /** 설명 */
  description: string;
  /** 카테고리 */
  category: 'stat' | 'command' | 'term' | 'unit' | 'faction';
  /** 관련 링크 (도움말 페이지 등) */
  link?: string;
  /** 아이콘 */
  icon?: string;
}

/** Advisor 메시지 */
export interface AdvisorMessage {
  /** 고유 ID */
  id: string;
  /** 메시지 타입 */
  type: 'tip' | 'warning' | 'suggestion' | 'congratulation';
  /** 제목 */
  title: string;
  /** 메시지 내용 */
  content: string;
  /** 트리거 조건 */
  trigger: AdvisorTrigger;
  /** 우선순위 (높을수록 먼저 표시) */
  priority: number;
  /** 한 번만 표시 */
  showOnce?: boolean;
  /** 쿨다운 (초) */
  cooldown?: number;
  /** 액션 버튼 */
  action?: {
    label: string;
    callback: string;
  };
}

/** Advisor 트리거 조건 */
export interface AdvisorTrigger {
  /** 트리거 타입 */
  type: 'event' | 'condition' | 'time' | 'manual';
  /** 이벤트명 또는 조건 */
  value: string;
  /** 추가 파라미터 */
  params?: Record<string, unknown>;
}

/** 도움말 항목 */
export interface HelpArticle {
  /** 고유 ID */
  id: string;
  /** 제목 */
  title: string;
  /** 내용 (Markdown) */
  content: string;
  /** 카테고리 */
  category: TutorialCategory;
  /** 태그 (검색용) */
  tags: string[];
  /** 관련 시퀀스 ID */
  relatedSequence?: string;
  /** 정렬 순서 */
  order: number;
}








