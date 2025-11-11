'use client';

import React from 'react';
import Image from 'next/image';

export type EventType = 
  | 'default'           // event0.gif
  | 'battle'            // event1.gif - 전투
  | 'diplomacy'         // event2.gif - 외교
  | 'trade'             // event3.gif - 교역
  | 'construction'      // event31.gif - 건설
  | 'agriculture'       // event32.gif - 농업
  | 'commerce'          // event33.gif - 상업
  | 'defense'           // event34.gif - 방어
  | 'disaster'          // event4.gif - 재해
  | 'fire'              // event41.gif - 화재
  | 'flood'             // event42.gif - 홍수
  | 'plague'            // event43.gif - 역병
  | 'politics'          // event5.gif - 정치
  | 'rebellion'         // event51.gif - 반란
  | 'festival'          // event6.gif - 축제
  | 'recruitment'       // event7.gif - 모병
  | 'research'          // event8.gif - 연구
  | 'special'           // event9.gif - 특수
;

const EVENT_ICON_MAP: Record<EventType, string> = {
  default: '/sam_icon/event/event0.gif',
  battle: '/sam_icon/event/event1.gif',
  diplomacy: '/sam_icon/event/event2.gif',
  trade: '/sam_icon/event/event3.gif',
  construction: '/sam_icon/event/event31.gif',
  agriculture: '/sam_icon/event/event32.gif',
  commerce: '/sam_icon/event/event33.gif',
  defense: '/sam_icon/event/event34.gif',
  disaster: '/sam_icon/event/event4.gif',
  fire: '/sam_icon/event/event41.gif',
  flood: '/sam_icon/event/event42.gif',
  plague: '/sam_icon/event/event43.gif',
  politics: '/sam_icon/event/event5.gif',
  rebellion: '/sam_icon/event/event51.gif',
  festival: '/sam_icon/event/event6.gif',
  recruitment: '/sam_icon/event/event7.gif',
  research: '/sam_icon/event/event8.gif',
  special: '/sam_icon/event/event9.gif',
};

interface EventIconProps {
  type: EventType;
  size?: number;  // 기본값: 16
  className?: string;
  alt?: string;
}

/**
 * 이벤트 아이콘 컴포넌트
 * 
 * @example
 * <EventIcon type="battle" size={24} />
 * <EventIcon type="diplomacy" />
 */
export default function EventIcon({ 
  type, 
  size = 16, 
  className = '',
  alt 
}: EventIconProps) {
  const iconSrc = EVENT_ICON_MAP[type] || EVENT_ICON_MAP.default;
  
  return (
    <Image
      src={iconSrc}
      width={size}
      height={size}
      alt={alt || type}
      className={className}
      style={{
        imageRendering: 'pixelated',
      }}
      unoptimized // GIF 애니메이션 유지
    />
  );
}
