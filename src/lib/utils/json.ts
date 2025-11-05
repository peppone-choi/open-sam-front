/**
 * JSON 유틸리티 클래스
 * PHP의 sammo\Json 클래스를 TypeScript로 마이그레이션
 */

export const enum JsonFlag {
  PRETTY = 1 << 0,
  DELETE_NULL = 1 << 1,
  NO_CACHE = 1 << 2,
  PASS_THROUGH = 1 << 3,
  EMPTY_ARRAY_IS_DICT = 1 << 4,
}

export class Json {
  /**
   * 값을 JSON 문자열로 인코딩
   */
  static encode(value: any, flag: JsonFlag = 0): string {
    let processedValue = value;

    // DELETE_NULL 플래그: null 값 제거
    if (flag & JsonFlag.DELETE_NULL) {
      processedValue = this.eraseNullValue(value);
    }

    // EMPTY_ARRAY_IS_DICT 플래그: 빈 배열을 객체로 변환
    if (processedValue === [] && (flag & JsonFlag.EMPTY_ARRAY_IS_DICT)) {
      processedValue = {};
    }

    // PRETTY 플래그: 가독성 좋게 포맷팅
    if (flag & JsonFlag.PRETTY) {
      return JSON.stringify(processedValue, null, 2);
    }

    return JSON.stringify(processedValue);
  }

  /**
   * JSON 문자열을 디코딩 (배열로 반환)
   */
  static decode(value: string | null): any {
    if (value === null) {
      return null;
    }
    return JSON.parse(value);
  }

  /**
   * JSON 문자열을 디코딩 (객체로 반환)
   */
  static decodeObj(value: string | null): any {
    if (value === null) {
      return null;
    }
    return JSON.parse(value);
  }

  /**
   * null 값을 제거하는 헬퍼 함수
   */
  private static eraseNullValue(value: any): any {
    if (value === null) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.eraseNullValue(item));
    }

    if (typeof value === 'object' && value !== null) {
      const result: any = {};
      for (const [key, val] of Object.entries(value)) {
        if (val !== null) {
          result[key] = this.eraseNullValue(val);
        }
      }
      return result;
    }

    return value;
  }

  /**
   * 응답을 JSON으로 반환하고 종료 (서버 사이드 전용)
   * @deprecated 클라이언트에서는 사용하지 않음
   */
  static die(value: any, flag: JsonFlag = JsonFlag.NO_CACHE): never {
    throw new Error('Json.die() is server-side only');
  }

  /**
   * 에러 응답 반환
   */
  static dieWithReason(
    reason: string,
    recoveryType?: { value: string | number }
  ): { result: false; reason: string; recovery?: string | number } {
    const response: any = {
      result: false,
      reason,
    };

    if (recoveryType) {
      response.recovery = recoveryType.value;
    }

    return response;
  }
}

