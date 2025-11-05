/**
 * NPC 색상 반환
 * PHP: core/hwe/ts/utilGame/getNPCColor.ts
 */
export function getNPCColor(npc: number): string | null {
  if (npc === 0) {
    return null; // 일반 플레이어
  }
  
  // NPC 타입별 색상
  if (npc === 1) {
    return '#FFA500'; // 오렌지 - 일반 NPC
  } else if (npc === 2) {
    return '#FF6347'; // 토마토 - 적극적 NPC
  } else if (npc === 3) {
    return '#9370DB'; // 보라 - 특수 NPC
  } else if (npc >= 4) {
    return '#FF1493'; // 딥핑크 - 고급 NPC
  }
  
  return null;
}

