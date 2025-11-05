/**
 * 문자열 유틸리티 클래스
 * PHP의 sammo\StringUtil 클래스를 TypeScript로 마이그레이션
 */

export class StringUtil {
  /**
   * 전각, 반각 길이 기준의 substring
   * @param str 원본 문자열
   * @param start 시작 너비. 일치하는 문자가 없을 경우 그 다음 문자부터. 음수의 경우 뒤에서부터.
   * @param width 길이. undefined일 경우 끝까지.
   */
  static subStringForWidth(str: string, start: number = 0, width?: number): string {
    const length = this.getWidth(str);
    const actualWidth = width ?? length;

    let actualStart = start;
    if (start < 0) {
      actualStart = length + start;
    }

    const chars = this.splitString(str);
    let currentPos = 0;
    let rawStart = 0;

    // 시작 위치 찾기
    for (let i = 0; i < chars.length; i++) {
      const charWidth = this.getCharWidth(chars[i]);
      if (currentPos + charWidth > actualStart) {
        break;
      }
      currentPos += charWidth;
      rawStart += chars[i].length;
    }

    if (currentPos + actualWidth >= length) {
      return str.substring(rawStart);
    }

    // 길이 계산
    let currentWidth = 0;
    let rawWidth = 0;

    for (let i = 0; i < chars.length; i++) {
      const charWidth = this.getCharWidth(chars[i]);
      if (currentWidth + charWidth > actualWidth) {
        break;
      }
      currentWidth += charWidth;
      rawWidth += chars[i].length;
    }

    return str.substring(rawStart, rawStart + rawWidth);
  }

  /**
   * 문자열을 지정된 너비로 자르고 끝에 채움 문자 추가
   */
  static cutStringForWidth(str: string, width: number, endFill: string = '..'): string {
    const strWidth = this.getWidth(str);
    if (strWidth <= width) {
      return str;
    }

    const endFillWidth = this.getWidth(endFill);
    const availableWidth = width - endFillWidth;

    let result = '';
    let currentWidth = 0;

    for (const char of this.splitString(str)) {
      const charWidth = this.getCharWidth(char);
      if (currentWidth + charWidth > availableWidth) {
        break;
      }
      result += char;
      currentWidth += charWidth;
    }

    return result + endFill;
  }

  /**
   * 문자열을 문자 단위로 분할
   * @param str 원본 문자열
   * @param l 길이 (0이면 문자 단위로 분할)
   */
  static splitString(str: string, l: number = 0): string[] {
    if (l > 0) {
      const result: string[] = [];
      const length = str.length;
      for (let i = 0; i < length; i += l) {
        result.push(str.substring(i, i + l));
      }
      return result;
    }

    // UTF-8 문자 단위로 분할
    const result: string[] = [];
    const regex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      result.push(match[0]);
    }
    return result;
  }

  /**
   * str_pad를 유니코드에서 사용할 수 있는 함수
   * @param str 원본 문자열
   * @param maxsize 채우고자 하는 너비. 전각 문자는 2, 반각 문자는 1을 기준으로 함
   * @param ch 채움 문자열
   * @param padType 채움 방향 (LEFT, RIGHT, BOTH)
   */
  static padStringForWidth(
    str: string,
    maxsize: number,
    ch: string = ' ',
    padType: 'LEFT' | 'RIGHT' | 'BOTH' = 'RIGHT'
  ): string {
    const currentWidth = this.getWidth(str);
    const neededWidth = maxsize - currentWidth;

    if (neededWidth <= 0) {
      return str;
    }

    const chWidth = this.getCharWidth(ch);
    const repeatCount = Math.ceil(neededWidth / chWidth);
    const padding = ch.repeat(repeatCount);

    // 정확한 너비 맞추기
    const paddingWidth = this.getWidth(padding);
    if (paddingWidth > neededWidth) {
      const excess = paddingWidth - neededWidth;
      // 초과분 제거 (간단한 방법)
      const excessChars = Math.ceil(excess / chWidth);
      const trimmedPadding = padding.substring(0, padding.length - excessChars * ch.length);
      if (this.getWidth(trimmedPadding) < neededWidth) {
        // 부족한 경우 보정
        return this.padStringForWidth(str, maxsize, ch, padType);
      }
    }

    switch (padType) {
      case 'LEFT':
        return padding + str;
      case 'RIGHT':
        return str + padding;
      case 'BOTH': {
        const leftPad = Math.floor(neededWidth / 2);
        const rightPad = neededWidth - leftPad;
        return this.padStringForWidth(this.padStringForWidth(str, currentWidth + leftPad, ch, 'LEFT'), maxsize, ch, 'RIGHT');
      }
      default:
        return str + padding;
    }
  }

  /**
   * 문자열의 너비 계산 (전각=2, 반각=1)
   */
  static getWidth(str: string): number {
    let width = 0;
    for (const char of this.splitString(str)) {
      width += this.getCharWidth(char);
    }
    return width;
  }

  /**
   * 문자 하나의 너비 계산 (전각=2, 반각=1)
   */
  private static getCharWidth(char: string): number {
    // 전각 문자 체크 (한글, 한자, 일본어 등)
    const codePoint = char.codePointAt(0);
    if (!codePoint) return 1;

    // ASCII 범위: 반각 (1)
    if (codePoint < 0x80) return 1;

    // 한글, 한자, 일본어 등: 전각 (2)
    // Hangul Syllables (U+AC00–U+D7A3)
    // CJK Unified Ideographs (U+4E00–U+9FFF)
    // 등등
    if (
      (codePoint >= 0xAC00 && codePoint <= 0xD7A3) || // 한글
      (codePoint >= 0x4E00 && codePoint <= 0x9FFF) || // 한자
      (codePoint >= 0x3040 && codePoint <= 0x309F) || // 히라가나
      (codePoint >= 0x30A0 && codePoint <= 0x30FF)    // 가타카나
    ) {
      return 2;
    }

    // 기본적으로 전각 문자로 간주
    return 2;
  }
}

