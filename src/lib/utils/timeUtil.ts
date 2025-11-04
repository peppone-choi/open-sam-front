/**
 * 시간 유틸리티 클래스
 * PHP의 sammo\TimeUtil 클래스를 TypeScript로 마이그레이션
 */

export class TimeUtil {
  /**
   * 오늘 날짜 반환 (YYYY-MM-DD)
   */
  static today(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 현재 시간 반환
   * @param withFraction 밀리초 포함 여부
   */
  static now(withFraction: boolean = false): string {
    const now = new Date();
    if (withFraction) {
      return now.toISOString();
    }
    return now.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * 현재 시간에서 N일 후 반환
   */
  static nowAddDays(day: number, withFraction: boolean = false): string {
    const date = new Date();
    date.setDate(date.getDate() + day);
    if (withFraction) {
      return date.toISOString();
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * 현재 시간에서 N시간 후 반환
   */
  static nowAddHours(hour: number, withFraction: boolean = false): string {
    const date = new Date();
    date.setHours(date.getHours() + hour);
    if (withFraction) {
      return date.toISOString();
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * 현재 시간에서 N분 후 반환
   */
  static nowAddMinutes(minute: number, withFraction: boolean = false): string {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minute);
    if (withFraction) {
      return date.toISOString();
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * 현재 시간에서 N초 후 반환
   */
  static nowAddSeconds(second: number, withFraction: boolean = false): string {
    const date = new Date();
    date.setSeconds(date.getSeconds() + second);
    if (withFraction) {
      return date.toISOString();
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * DateTime 문자열을 포맷팅
   */
  static format(date: Date, withFraction: boolean = false): string {
    if (withFraction) {
      return date.toISOString();
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * DateTime 문자열을 초 단위로 변환
   */
  static DateTimeToSeconds(dateTime: string | Date, isUTC: boolean = false): number {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * 초를 DateTime 문자열로 변환
   */
  static secondsToDateTime(seconds: number, withFraction: boolean = false): string {
    const date = new Date(seconds * 1000);
    return this.format(date, withFraction);
  }

  /**
   * 두 날짜 사이의 차이를 초 단위로 반환
   */
  static diffSeconds(date1: string | Date, date2: string | Date): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return Math.floor((d1.getTime() - d2.getTime()) / 1000);
  }

  /**
   * 날짜 문자열을 DateInterval 형식으로 변환 (초 단위)
   */
  static secondsToDateInterval(seconds: number): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds: secs,
    };
  }

  /**
   * 초를 시간:분:초 형식으로 변환
   */
  static hourMinuteSecond(second: number): string {
    const hours = Math.floor(second / 3600);
    const minutes = Math.floor((second % 3600) / 60);
    const secs = second % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

