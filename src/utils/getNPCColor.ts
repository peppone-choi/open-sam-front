export function getNPCColor(npcType: number): string | undefined {
  if (npcType === 6) {
    return '#228b22'; // forestgreen (짙은 초록)
  }
  if (npcType === 5) {
    return '#ff4500'; // orangered (진한 주황)
  }
  if (npcType === 4) {
    return '#4169e1'; // royalblue (진한 파랑)
  }
  if (npcType >= 2) {
    return '#ff6347'; // tomato (진한 토마토색)
  }
  if (npcType === 1) {
    return '#9370db'; // mediumpurple (중간 보라)
  }
  return undefined;
}




