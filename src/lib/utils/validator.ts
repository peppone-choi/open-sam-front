/**
 * 검증 유틸리티 클래스
 * PHP의 sammo\Validator 클래스를 TypeScript로 마이그레이션
 */

export class Validator {
  private errors: Record<string, string[]> = {};
  private data: Record<string, any>;

  constructor(data: Record<string, any>) {
    this.data = data;
  }

  /**
   * 필수 필드 검증
   */
  rule(ruleName: string, fields: string | string[]): this {
    const fieldList = Array.isArray(fields) ? fields : [fields];

    switch (ruleName) {
      case 'required':
        for (const field of fieldList) {
          if (!(field in this.data) || this.data[field] === null || this.data[field] === undefined || this.data[field] === '') {
            this.addError(field, '필수 항목입니다.');
          }
        }
        break;

      case 'integer':
        for (const field of fieldList) {
          if (field in this.data && this.data[field] !== null && this.data[field] !== undefined) {
            if (!Number.isInteger(Number(this.data[field]))) {
              this.addError(field, '정수여야 합니다.');
            }
          }
        }
        break;

      case 'lengthMin':
        const minLength = arguments[2];
        for (const field of fieldList) {
          if (field in this.data && this.data[field] !== null && this.data[field] !== undefined) {
            const value = String(this.data[field]);
            if (value.length < minLength) {
              this.addError(field, `최소 ${minLength}자 이상이어야 합니다.`);
            }
          }
        }
        break;

      case 'lengthMax':
        const maxLength = arguments[2];
        for (const field of fieldList) {
          if (field in this.data && this.data[field] !== null && this.data[field] !== undefined) {
            const value = String(this.data[field]);
            if (value.length > maxLength) {
              this.addError(field, `최대 ${maxLength}자 이하여야 합니다.`);
            }
          }
        }
        break;

      case 'min':
        const minValue = arguments[2];
        for (const field of fieldList) {
          if (field in this.data && this.data[field] !== null && this.data[field] !== undefined) {
            const num = Number(this.data[field]);
            if (isNaN(num) || num < minValue) {
              this.addError(field, `최소 ${minValue} 이상이어야 합니다.`);
            }
          }
        }
        break;

      case 'max':
        const maxValue = arguments[2];
        for (const field of fieldList) {
          if (field in this.data && this.data[field] !== null && this.data[field] !== undefined) {
            const num = Number(this.data[field]);
            if (isNaN(num) || num > maxValue) {
              this.addError(field, `최대 ${maxValue} 이하여야 합니다.`);
            }
          }
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const field of fieldList) {
          if (field in this.data && this.data[field] !== null && this.data[field] !== undefined) {
            if (!emailRegex.test(String(this.data[field]))) {
              this.addError(field, '올바른 이메일 형식이 아닙니다.');
            }
          }
        }
        break;

      default:
        // 기본 규칙 처리
        break;
    }

    return this;
  }

  /**
   * 에러 추가
   */
  private addError(field: string, message: string): void {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
  }

  /**
   * 검증 실행
   */
  validate(): boolean {
    return Object.keys(this.errors).length === 0;
  }

  /**
   * 에러 메시지 반환
   */
  getErrors(): Record<string, string[]> {
    return this.errors;
  }

  /**
   * 에러 문자열 반환
   */
  errorStr(): string {
    const errorMessages: string[] = [];
    for (const field of Object.keys(this.errors)) {
      const messages = this.errors[field].join(', ');
      errorMessages.push(`${field}: ${messages}`);
    }
    return errorMessages.join(', ');
  }

  /**
   * 정수 배열 검증
   */
  validateIntegerArray(field: string, value: any): boolean {
    if (!Array.isArray(value)) {
      return false;
    }
    return value.every((item) => Number.isInteger(item));
  }

  /**
   * 문자열 배열 검증
   */
  validateStringArray(field: string, value: any): boolean {
    if (!Array.isArray(value)) {
      return false;
    }
    return value.every((item) => typeof item === 'string');
  }

  /**
   * 정수 값 검증
   */
  validateInt(field: string, value: any): boolean {
    return Number.isInteger(value);
  }

  /**
   * 실수 값 검증
   */
  validateFloat(field: string, value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }
}

