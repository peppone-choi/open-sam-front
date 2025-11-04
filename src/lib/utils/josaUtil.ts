/**
 * 조사(助詞) 유틸리티 클래스
 * PHP의 sammo\JosaUtil 클래스를 TypeScript로 마이그레이션
 */

export class JosaUtil {
  private static readonly KO_START_CODE = 44032;
  private static readonly KO_FINISH_CODE = 55203;
  private static readonly HANJA_START_CODE = 0x4e00;
  private static readonly HANJA_FINISH_CODE = 0xfa0b;

  private static readonly DEFAULT_POSTPOSITION: Record<string, string> = {
    은: '는',
    이: '가',
    과: '와',
    이나: '나',
    을: '를',
    으로: '로',
    이라: '라',
    이랑: '랑',
  };

  /**
   * 조사 선택
   * @param noun 명사
   * @param josa 조사 (예: "을", "를", "이", "가")
   */
  static pickJosa(noun: string, josa: string): string {
    if (!noun || !josa) {
      return josa || '';
    }

    const lastChar = this.getLastChar(noun);
    if (!lastChar) {
      return josa;
    }

    const hasJongseong = this.hasJongseong(lastChar);

    // 기본 조사 매핑
    const defaultJosa = this.DEFAULT_POSTPOSITION[josa];
    if (defaultJosa) {
      return hasJongseong ? josa : defaultJosa;
    }

    // 특별한 경우 처리
    if (josa === '으로' || josa === '로') {
      return hasJongseong ? '으로' : '로';
    }

    return josa;
  }

  /**
   * 명사에 조사 붙이기
   */
  static attachJosa(noun: string, josa: string): string {
    const pickedJosa = this.pickJosa(noun, josa);
    return noun + pickedJosa;
  }

  /**
   * 문자열의 마지막 문자 추출
   */
  private static getLastChar(str: string): string {
    if (!str || str.length === 0) {
      return '';
    }

    // UTF-8 문자 단위로 분할
    const chars = this.splitString(str);
    return chars[chars.length - 1] || '';
  }

  /**
   * 문자열을 문자 단위로 분할
   */
  private static splitString(str: string): string[] {
    const result: string[] = [];
    const regex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      result.push(match[0]);
    }
    return result;
  }

  /**
   * 종성이 있는지 확인 (한글)
   */
  private static hasJongseong(char: string): boolean {
    const codePoint = char.codePointAt(0);
    if (!codePoint) {
      return false;
    }

    // 한글 범위 체크
    if (codePoint >= this.KO_START_CODE && codePoint <= this.KO_FINISH_CODE) {
      const jongseong = (codePoint - this.KO_START_CODE) % 28;
      return jongseong !== 0;
    }

    // 한자 체크 (간단한 버전)
    if (codePoint >= this.HANJA_START_CODE && codePoint <= this.HANJA_FINISH_CODE) {
      // 한자는 종성이 있는 것으로 간주 (실제로는 더 복잡한 로직 필요)
      return true;
    }

    // 영문, 숫자 등은 종성 없음
    return false;
  }
}

