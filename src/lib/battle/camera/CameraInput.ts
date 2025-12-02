/**
 * CameraInput.ts
 * 복셀 전투 카메라 시스템 - 입력 처리
 *
 * 지원 입력:
 * - 마우스: 드래그(팬), 휠(줌), 우클릭 드래그(회전)
 * - 터치: 한 손가락 드래그(팬), 두 손가락 핀치(줌)
 * - 키보드: WASD/화살표(팬), Q/E(회전), R/F(줌), Home(초기화), 1-9(프리셋)
 */

// ========================================
// 타입 정의
// ========================================

export interface InputState {
  // 마우스 상태
  isMouseDown: boolean;
  mouseButton: number;
  mousePosition: { x: number; y: number };
  mouseDelta: { x: number; y: number };

  // 터치 상태
  touchCount: number;
  touchPositions: Array<{ x: number; y: number }>;
  pinchDistance: number;
  pinchDelta: number;

  // 키보드 상태
  keysDown: Set<string>;

  // 파생 상태
  isPanning: boolean;
  isRotating: boolean;
  isZooming: boolean;
}

export interface InputCallbacks {
  onPan: (dx: number, dy: number) => void;
  onZoom: (delta: number) => void;
  onRotate: (dx: number, dy: number) => void;
  onReset: () => void;
  onPreset: (key: number) => void;
  onFollowCancel: () => void;
}

interface KeyBindings {
  panUp: string[];
  panDown: string[];
  panLeft: string[];
  panRight: string[];
  rotateLeft: string[];
  rotateRight: string[];
  zoomIn: string[];
  zoomOut: string[];
  reset: string[];
  cancel: string[];
  presets: string[];
}

// ========================================
// 기본 키 바인딩
// ========================================

const DEFAULT_KEY_BINDINGS: KeyBindings = {
  panUp: ['w', 'W', 'ArrowUp'],
  panDown: ['s', 'S', 'ArrowDown'],
  panLeft: ['a', 'A', 'ArrowLeft'],
  panRight: ['d', 'D', 'ArrowRight'],
  rotateLeft: ['q', 'Q'],
  rotateRight: ['e', 'E'],
  zoomIn: ['r', 'R', '+', '='],
  zoomOut: ['f', 'F', '-', '_'],
  reset: ['Home', 'h', 'H'],
  cancel: ['Escape'],
  presets: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
};

// ========================================
// CameraInput 클래스
// ========================================

export class CameraInput {
  private domElement: HTMLElement;
  private callbacks: InputCallbacks;
  private keyBindings: KeyBindings;
  private enabled: boolean = true;

  // 상태
  private state: InputState = {
    isMouseDown: false,
    mouseButton: -1,
    mousePosition: { x: 0, y: 0 },
    mouseDelta: { x: 0, y: 0 },
    touchCount: 0,
    touchPositions: [],
    pinchDistance: 0,
    pinchDelta: 0,
    keysDown: new Set(),
    isPanning: false,
    isRotating: false,
    isZooming: false,
  };

  // 터치 추적
  private lastTouchPositions: Array<{ x: number; y: number }> = [];
  private lastPinchDistance: number = 0;

  // 키보드 입력 처리
  private keyboardPanSpeed: number = 300;
  private keyboardRotateSpeed: number = 2;
  private keyboardZoomSpeed: number = 5;

  // 이벤트 리스너 참조 (정리용)
  private boundHandlers: {
    onMouseDown: (e: MouseEvent) => void;
    onMouseMove: (e: MouseEvent) => void;
    onMouseUp: (e: MouseEvent) => void;
    onMouseLeave: (e: MouseEvent) => void;
    onWheel: (e: WheelEvent) => void;
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
    onKeyDown: (e: KeyboardEvent) => void;
    onKeyUp: (e: KeyboardEvent) => void;
    onContextMenu: (e: MouseEvent) => void;
  };

  constructor(
    domElement: HTMLElement,
    callbacks: InputCallbacks,
    keyBindings: Partial<KeyBindings> = {}
  ) {
    this.domElement = domElement;
    this.callbacks = callbacks;
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS, ...keyBindings };

    // 바인딩된 핸들러 생성
    this.boundHandlers = {
      onMouseDown: this.onMouseDown.bind(this),
      onMouseMove: this.onMouseMove.bind(this),
      onMouseUp: this.onMouseUp.bind(this),
      onMouseLeave: this.onMouseLeave.bind(this),
      onWheel: this.onWheel.bind(this),
      onTouchStart: this.onTouchStart.bind(this),
      onTouchMove: this.onTouchMove.bind(this),
      onTouchEnd: this.onTouchEnd.bind(this),
      onKeyDown: this.onKeyDown.bind(this),
      onKeyUp: this.onKeyUp.bind(this),
      onContextMenu: this.onContextMenu.bind(this),
    };

    this.setupEventListeners();
  }

  // ========================================
  // 공개 API
  // ========================================

  /**
   * 현재 입력 상태 가져오기
   */
  getState(): InputState {
    return { ...this.state };
  }

  /**
   * 입력 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.resetState();
    }
  }

  /**
   * 키보드 입력 업데이트 (매 프레임 호출)
   */
  processKeyboardInput(deltaTime: number): void {
    if (!this.enabled) return;

    const { keysDown } = this.state;
    let panX = 0;
    let panY = 0;
    let rotate = 0;
    let zoom = 0;

    // 팬
    if (this.isKeyDown(this.keyBindings.panUp)) panY -= 1;
    if (this.isKeyDown(this.keyBindings.panDown)) panY += 1;
    if (this.isKeyDown(this.keyBindings.panLeft)) panX -= 1;
    if (this.isKeyDown(this.keyBindings.panRight)) panX += 1;

    // 회전
    if (this.isKeyDown(this.keyBindings.rotateLeft)) rotate -= 1;
    if (this.isKeyDown(this.keyBindings.rotateRight)) rotate += 1;

    // 줌
    if (this.isKeyDown(this.keyBindings.zoomIn)) zoom -= 1;
    if (this.isKeyDown(this.keyBindings.zoomOut)) zoom += 1;

    // 콜백 호출
    if (panX !== 0 || panY !== 0) {
      this.callbacks.onPan(
        panX * this.keyboardPanSpeed * deltaTime,
        panY * this.keyboardPanSpeed * deltaTime
      );
    }

    if (rotate !== 0) {
      this.callbacks.onRotate(
        rotate * this.keyboardRotateSpeed * deltaTime * 100,
        0
      );
    }

    if (zoom !== 0) {
      this.callbacks.onZoom(zoom * this.keyboardZoomSpeed * deltaTime);
    }
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.removeEventListeners();
  }

  // ========================================
  // 이벤트 리스너 설정
  // ========================================

  private setupEventListeners(): void {
    const el = this.domElement;

    // 마우스 이벤트
    el.addEventListener('mousedown', this.boundHandlers.onMouseDown);
    el.addEventListener('mousemove', this.boundHandlers.onMouseMove);
    el.addEventListener('mouseup', this.boundHandlers.onMouseUp);
    el.addEventListener('mouseleave', this.boundHandlers.onMouseLeave);
    el.addEventListener('wheel', this.boundHandlers.onWheel, { passive: false });

    // 터치 이벤트
    el.addEventListener('touchstart', this.boundHandlers.onTouchStart, { passive: false });
    el.addEventListener('touchmove', this.boundHandlers.onTouchMove, { passive: false });
    el.addEventListener('touchend', this.boundHandlers.onTouchEnd);
    el.addEventListener('touchcancel', this.boundHandlers.onTouchEnd);

    // 키보드 이벤트 (document에 등록)
    document.addEventListener('keydown', this.boundHandlers.onKeyDown);
    document.addEventListener('keyup', this.boundHandlers.onKeyUp);

    // 컨텍스트 메뉴 방지
    el.addEventListener('contextmenu', this.boundHandlers.onContextMenu);
  }

  private removeEventListeners(): void {
    const el = this.domElement;

    el.removeEventListener('mousedown', this.boundHandlers.onMouseDown);
    el.removeEventListener('mousemove', this.boundHandlers.onMouseMove);
    el.removeEventListener('mouseup', this.boundHandlers.onMouseUp);
    el.removeEventListener('mouseleave', this.boundHandlers.onMouseLeave);
    el.removeEventListener('wheel', this.boundHandlers.onWheel);

    el.removeEventListener('touchstart', this.boundHandlers.onTouchStart);
    el.removeEventListener('touchmove', this.boundHandlers.onTouchMove);
    el.removeEventListener('touchend', this.boundHandlers.onTouchEnd);
    el.removeEventListener('touchcancel', this.boundHandlers.onTouchEnd);

    document.removeEventListener('keydown', this.boundHandlers.onKeyDown);
    document.removeEventListener('keyup', this.boundHandlers.onKeyUp);

    el.removeEventListener('contextmenu', this.boundHandlers.onContextMenu);
  }

  // ========================================
  // 마우스 이벤트 핸들러
  // ========================================

  private onMouseDown(e: MouseEvent): void {
    if (!this.enabled) return;

    this.state.isMouseDown = true;
    this.state.mouseButton = e.button;
    this.state.mousePosition = { x: e.clientX, y: e.clientY };
    this.state.mouseDelta = { x: 0, y: 0 };

    // 버튼별 모드 설정
    if (e.button === 0) {
      // 좌클릭: 팬
      this.state.isPanning = true;
    } else if (e.button === 2) {
      // 우클릭: 회전
      this.state.isRotating = true;
    } else if (e.button === 1) {
      // 중간 클릭: 줌
      this.state.isZooming = true;
    }

    e.preventDefault();
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.enabled || !this.state.isMouseDown) return;

    const dx = e.clientX - this.state.mousePosition.x;
    const dy = e.clientY - this.state.mousePosition.y;

    this.state.mouseDelta = { x: dx, y: dy };
    this.state.mousePosition = { x: e.clientX, y: e.clientY };

    if (this.state.isPanning) {
      this.callbacks.onPan(dx, dy);
    } else if (this.state.isRotating) {
      this.callbacks.onRotate(dx, dy);
    }
  }

  private onMouseUp(e: MouseEvent): void {
    this.resetMouseState();
  }

  private onMouseLeave(e: MouseEvent): void {
    if (this.state.isMouseDown) {
      this.resetMouseState();
    }
  }

  private onWheel(e: WheelEvent): void {
    if (!this.enabled) return;

    e.preventDefault();

    // deltaY 정규화 (브라우저별 차이 처리)
    let delta = e.deltaY;
    if (e.deltaMode === 1) {
      // DOM_DELTA_LINE
      delta *= 40;
    } else if (e.deltaMode === 2) {
      // DOM_DELTA_PAGE
      delta *= 800;
    }

    // 줌 방향: 양수 = 줌 아웃, 음수 = 줌 인
    this.callbacks.onZoom(delta / 100);
  }

  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
  }

  private resetMouseState(): void {
    this.state.isMouseDown = false;
    this.state.mouseButton = -1;
    this.state.isPanning = false;
    this.state.isRotating = false;
    this.state.isZooming = false;
  }

  // ========================================
  // 터치 이벤트 핸들러
  // ========================================

  private onTouchStart(e: TouchEvent): void {
    if (!this.enabled) return;

    e.preventDefault();

    this.updateTouchState(e);

    if (e.touches.length === 1) {
      // 한 손가락: 팬 시작
      this.state.isPanning = true;
    } else if (e.touches.length === 2) {
      // 두 손가락: 핀치/줌 시작
      this.state.isPanning = false;
      this.state.isZooming = true;
      this.lastPinchDistance = this.getPinchDistance(e.touches);
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.enabled) return;

    e.preventDefault();

    const currentPositions = this.getTouchPositions(e.touches);

    if (e.touches.length === 1 && this.state.isPanning) {
      // 한 손가락 팬
      if (this.lastTouchPositions.length > 0) {
        const dx = currentPositions[0].x - this.lastTouchPositions[0].x;
        const dy = currentPositions[0].y - this.lastTouchPositions[0].y;
        this.callbacks.onPan(dx, dy);
      }
    } else if (e.touches.length === 2 && this.state.isZooming) {
      // 두 손가락 핀치/줌
      const currentPinchDistance = this.getPinchDistance(e.touches);
      const pinchDelta = this.lastPinchDistance - currentPinchDistance;

      if (Math.abs(pinchDelta) > 1) {
        this.callbacks.onZoom(pinchDelta * 0.02);
        this.lastPinchDistance = currentPinchDistance;
      }

      // 두 손가락 회전 (선택적)
      if (this.lastTouchPositions.length === 2) {
        const lastAngle = Math.atan2(
          this.lastTouchPositions[1].y - this.lastTouchPositions[0].y,
          this.lastTouchPositions[1].x - this.lastTouchPositions[0].x
        );
        const currentAngle = Math.atan2(
          currentPositions[1].y - currentPositions[0].y,
          currentPositions[1].x - currentPositions[0].x
        );
        const angleDelta = (currentAngle - lastAngle) * (180 / Math.PI);

        if (Math.abs(angleDelta) > 0.5) {
          this.callbacks.onRotate(angleDelta * 2, 0);
        }
      }
    }

    this.lastTouchPositions = currentPositions;
    this.updateTouchState(e);
  }

  private onTouchEnd(e: TouchEvent): void {
    if (!this.enabled) return;

    this.updateTouchState(e);

    if (e.touches.length === 0) {
      this.resetTouchState();
    } else if (e.touches.length === 1) {
      // 핀치에서 팬으로 전환
      this.state.isPanning = true;
      this.state.isZooming = false;
      this.lastTouchPositions = this.getTouchPositions(e.touches);
    }
  }

  private updateTouchState(e: TouchEvent): void {
    this.state.touchCount = e.touches.length;
    this.state.touchPositions = this.getTouchPositions(e.touches);
  }

  private getTouchPositions(touches: TouchList): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < touches.length; i++) {
      positions.push({ x: touches[i].clientX, y: touches[i].clientY });
    }
    return positions;
  }

  private getPinchDistance(touches: TouchList): number {
    if (touches.length < 2) return 0;

    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private resetTouchState(): void {
    this.state.touchCount = 0;
    this.state.touchPositions = [];
    this.state.isPanning = false;
    this.state.isZooming = false;
    this.lastTouchPositions = [];
    this.lastPinchDistance = 0;
  }

  // ========================================
  // 키보드 이벤트 핸들러
  // ========================================

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // 입력 필드에서는 무시
    if (this.isInputElement(e.target)) return;

    const key = e.key;
    this.state.keysDown.add(key);

    // 즉시 처리해야 하는 키
    if (this.keyBindings.reset.includes(key)) {
      this.callbacks.onReset();
      e.preventDefault();
    } else if (this.keyBindings.cancel.includes(key)) {
      this.callbacks.onFollowCancel();
      e.preventDefault();
    } else if (this.keyBindings.presets.includes(key)) {
      const presetNumber = parseInt(key, 10);
      if (!isNaN(presetNumber)) {
        this.callbacks.onPreset(presetNumber);
        e.preventDefault();
      }
    }

    // 방향키, WASD 등은 기본 동작 방지
    if (
      this.keyBindings.panUp.includes(key) ||
      this.keyBindings.panDown.includes(key) ||
      this.keyBindings.panLeft.includes(key) ||
      this.keyBindings.panRight.includes(key) ||
      this.keyBindings.rotateLeft.includes(key) ||
      this.keyBindings.rotateRight.includes(key) ||
      this.keyBindings.zoomIn.includes(key) ||
      this.keyBindings.zoomOut.includes(key)
    ) {
      e.preventDefault();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.state.keysDown.delete(e.key);
  }

  private isKeyDown(keys: string[]): boolean {
    return keys.some(key => this.state.keysDown.has(key));
  }

  private isInputElement(target: EventTarget | null): boolean {
    if (!target) return false;
    const tagName = (target as HTMLElement).tagName?.toUpperCase();
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
  }

  // ========================================
  // 유틸리티
  // ========================================

  private resetState(): void {
    this.resetMouseState();
    this.resetTouchState();
    this.state.keysDown.clear();
  }
}

export default CameraInput;





