export function formatGeneralTypeCall(
  leadership: number,
  strength: number,
  intel: number,
  gameConst?: { chiefStatMin?: number; statGradeLevel?: number }
): string {
  const chiefStatMin = gameConst?.chiefStatMin || 70;
  const statGradeLevel = gameConst?.statGradeLevel || 10;

  if (leadership < 40) {
    if (strength + intel < 40) {
      return '아둔';
    }
    if (intel >= chiefStatMin && strength < intel * 0.8) {
      return '학자';
    }
    if (strength >= chiefStatMin && intel < strength * 0.8) {
      return '장사';
    }
    return '명사';
  }

  const maxStat = Math.max(leadership, strength, intel);
  const sum2Stat = Math.min(leadership + strength, strength + intel, intel + leadership);
  if (maxStat >= chiefStatMin + statGradeLevel && sum2Stat >= maxStat * 1.7) {
    return '만능';
  }
  if (strength >= chiefStatMin - statGradeLevel && intel < strength * 0.8) {
    return '용장';
  }
  if (intel >= chiefStatMin - statGradeLevel && strength < intel * 0.8) {
    return '명장';
  }
  if (leadership >= chiefStatMin - statGradeLevel && strength + intel < leadership) {
    return '차장';
  }
  return '평범';
}


