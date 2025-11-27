/**
 * 군대 이동 시각화 타입 정의
 */

/** 이동 상태 */
export type MovementStatus = 
  | 'scheduled'    // 예약됨 (다음 턴에 실행)
  | 'marching'     // 행군 중
  | 'arriving'     // 도착 임박
  | 'completed';   // 완료

/** 이동 타입 */
export type MovementType = 
  | 'normal'       // 일반 이동
  | 'deploy'       // 출정 (전투 목적)
  | 'forceMarch'   // 강행군
  | 'retreat'      // 퇴각
  | 'supply';      // 보급

/** 군대 이동 정보 */
export interface TroopMovement {
  id: string;
  
  // 장수 정보
  generalId: number;
  generalName: string;
  generalIcon?: string;    // 장수 아이콘 URL
  
  // 국가 정보
  nationId: number;
  nationName: string;
  nationColor: string;
  
  // 병력 정보
  troops: number;          // 병력 수
  crewType?: number;       // 병종 ID
  crewTypeName?: string;   // 병종 이름
  
  // 이동 경로
  fromCityId: number;
  fromCityName: string;
  fromX: number;
  fromY: number;
  
  toCityId: number;
  toCityName: string;
  toX: number;
  toY: number;
  
  // 이동 상태
  status: MovementStatus;
  type: MovementType;
  
  // 시간 정보
  scheduledTurn?: number;  // 예약된 턴
  startTurn?: number;      // 시작 턴
  arrivalTurn?: number;    // 도착 예정 턴
  progress?: number;       // 진행도 (0-100)
  
  // 추가 정보
  isEnemy?: boolean;       // 적군 여부 (내 시점에서)
  isVisible?: boolean;     // 가시성 (첩보 여부)
}

/** 이동 필터 옵션 */
export interface MovementFilterOptions {
  showFriendly?: boolean;   // 아군 표시
  showEnemy?: boolean;      // 적군 표시 (첩보 있을 때만)
  showScheduled?: boolean;  // 예약된 이동 표시
  showMarching?: boolean;   // 행군 중 표시
  types?: MovementType[];   // 표시할 이동 타입
}

/** 이동 레이어 Props */
export interface MovementLayerProps {
  movements: TroopMovement[];
  currentTurn?: number;
  myNationId?: number;
  myGeneralIds?: number[]; // 내 장수들의 ID 목록
  filter?: MovementFilterOptions;
  isFullWidth?: boolean;
  onMovementClick?: (movement: TroopMovement) => void;
  onMovementHover?: (movement: TroopMovement | null) => void;
  onCancelMovement?: (movementId: string) => Promise<void>;
  onGoToCommandScreen?: (generalId: number) => void; // 커맨드 예약 화면으로 이동
  onTrackOnMap?: (movement: TroopMovement) => void;
}

/** 이동 마커 Props */
export interface TroopMovementMarkerProps {
  movement: TroopMovement;
  isFullWidth?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

