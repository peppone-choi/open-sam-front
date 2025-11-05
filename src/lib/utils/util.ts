/**
 * 범용 유틸리티 클래스
 * PHP의 sammo\Util 클래스를 TypeScript로 마이그레이션
 */

/**
 * 안전한 int 변환
 */
export function toInt(val: any, silent: boolean = false): number | null {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'number') {
    return Number.isInteger(val) ? val : Math.floor(val);
  }
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'null' || val === '') {
      return silent ? null : null;
    }
    const num = Number(val);
    if (!isNaN(num)) {
      return Math.floor(num);
    }
  }

  if (silent) {
    return null;
  }
  throw new Error(`올바르지 않은 타입형: ${val}`);
}

/**
 * 랜덤 문자열 생성
 */
export function randomStr(
  length: number,
  keyspace: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
): string {
  let str = '';
  const max = keyspace.length - 1;
  for (let i = 0; i < length; ++i) {
    const randomIndex = Math.floor(Math.random() * (max + 1));
    str += keyspace[randomIndex];
  }
  return str;
}

/**
 * 비밀번호 해시 생성
 */
export function hashPassword(salt: string, password: string): string {
  // SHA-512 해시는 서버 사이드에서 처리해야 함
  // 클라이언트에서는 이 함수를 사용하지 않음
  throw new Error('hashPassword should be used server-side only');
}

/**
 * 배열을 딕셔너리로 변환
 */
export function convertArrayToDict<T>(arr: T[], keyName: keyof T): Record<string, T> {
  const result: Record<string, T> = {};
  for (const obj of arr) {
    const key = String(obj[keyName]);
    result[key] = obj;
  }
  return result;
}

/**
 * 배열을 Set처럼 변환
 */
export function convertArrayToSetLike<T extends string | number>(
  arr: T[],
  valueIsKey: boolean = true
): Record<string, T | number> {
  const result: Record<string, T | number> = {};
  for (const datum of arr) {
    result[String(datum)] = valueIsKey ? datum : 1;
  }
  return result;
}

/**
 * 페어 배열을 딕셔너리로 변환
 */
export function convertPairArrayToDict<T>(arr: [string, T][]): Record<string, T> {
  const result: Record<string, T> = {};
  for (const [key, val] of arr) {
    result[key] = val;
  }
  return result;
}

/**
 * 튜플 배열을 딕셔너리로 변환
 */
export function convertTupleArrayToDict<T>(arr: [string, ...T[]][]): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const val of arr) {
    const [key, ...rest] = val;
    result[key] = rest;
  }
  return result;
}

/**
 * 딕셔너리를 배열로 변환
 */
export function convertDictToArray<T>(
  dict: Record<string, T>,
  withKey: boolean = true
): Array<[string, T] | T> {
  const result: Array<[string, T] | T> = [];
  for (const [key, value] of Object.entries(dict)) {
    if (withKey) {
      result.push([key, value]);
    } else {
      result.push(value);
    }
  }
  return result;
}

/**
 * 배열에서 특정 키 추출
 */
export function squeezeFromArray<T, K extends keyof T>(
  dict: Record<string, T>,
  key: K
): Record<string, T[K]> {
  const result: Record<string, T[K]> = {};
  for (const [dictKey, value] of Object.entries(dict)) {
    result[dictKey] = value[key];
  }
  return result;
}

/**
 * 딕셔너리인지 확인
 */
export function isDict(array: any): boolean {
  if (array === null || array === undefined) {
    return false;
  }
  if (!Array.isArray(array) && typeof array !== 'object') {
    return false;
  }
  if (Array.isArray(array)) {
    if (array.length === 0) {
      return true;
    }
    let idx = 0;
    for (const key of Object.keys(array)) {
      if (typeof key === 'string' && isNaN(Number(key))) {
        return true;
      }
      if (Number(key) !== idx) {
        return true;
      }
      idx++;
    }
    return false;
  }
  return typeof array === 'object';
}

/**
 * null 값 제거
 */
export function eraseNullValue(dict: any, depth: number = 512): any {
  if (dict === null) {
    return null;
  }

  if (Array.isArray(dict) && dict.length === 0) {
    return null;
  }

  if (depth <= 0) {
    return dict;
  }

  if (typeof dict !== 'object') {
    return dict;
  }

  const result: any = Array.isArray(dict) ? [] : {};

  for (const [key, value] of Object.entries(dict)) {
    if (value === null) {
      continue;
    }

    if (!isDict(value)) {
      if (Array.isArray(dict)) {
        result.push(value);
      } else {
        result[key] = value;
      }
      continue;
    }

    const newValue = eraseNullValue(value, depth - 1);
    if (newValue === null) {
      continue;
    }

    if (Array.isArray(dict)) {
      result.push(newValue);
    } else {
      result[key] = newValue;
    }
  }

  return result;
}

/**
 * 값 범위 제한
 */
export function clamp(value: number, min: number | null = null, max: number | null = null): number {
  if (max !== null && min !== null && max < min) {
    return min;
  }
  if (min !== null && value < min) {
    return min;
  }
  if (max !== null && value > max) {
    return max;
  }
  return value;
}

/**
 * 값 범위 제한 (별칭)
 */
export function valueFit(value: number, min: number | null = null, max: number | null = null): number {
  return clamp(value, min, max);
}

/**
 * 반올림 (int 반환)
 */
export function round(value: number, pos: number = 0): number {
  if (pos > 0) {
    throw new Error('Util::round는 음수만 입력 가능');
  }
  const multiplier = Math.pow(10, -pos);
  return Math.floor(Math.round(value * multiplier) / multiplier);
}

/**
 * 클라이언트 IP 주소 가져오기 (서버 사이드 전용)
 */
export function get_client_ip(trustProxy: boolean = false): string {
  // 클라이언트 사이드에서는 사용 불가
  throw new Error('get_client_ip should be used server-side only');
}

/**
 * 배열 맵핑 (키 포함)
 */
export function mapWithKey<T, K extends string, R>(
  callback: (key: K, value: T) => R,
  dict: Record<K, T>
): Record<K, R> {
  const result: Record<string, R> = {};
  for (const [key, value] of Object.entries(dict)) {
    result[key] = callback(key as K, value as T);
  }
  return result as Record<K, R>;
}

