export function calcInjury(
  statKey: 'leadership' | 'strength' | 'intel',
  general: { leadership: number; strength: number; intel: number; injury: number }
): number {
  const baseStat = general[statKey];
  return Math.round((baseStat * (100 - general.injury)) / 100);
}




