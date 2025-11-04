export function formatInjury(injury: number): [string, string] {
  if (injury <= 0) {
    return ['건강', 'white'];
  }
  if (injury <= 20) {
    return ['경상', 'yellow'];
  }
  if (injury <= 40) {
    return ['중상', 'orange'];
  }
  if (injury <= 60) {
    return ['심각', 'magenta'];
  }
  return ['위독', 'red'];
}



