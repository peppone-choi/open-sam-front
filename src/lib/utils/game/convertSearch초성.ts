/**
 * 초성 검색 변환
 * 한글 초성 추출하여 검색 가능한 형태로 변환
 * PHP: core/hwe/ts/util/convertSearch초성.ts
 */

/**
 * 한글 초성 추출
 */
function get초성(char: string): string {
  const code = char.charCodeAt(0);
  
  // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
  if (code < 0xAC00 || code > 0xD7A3) {
    return char; // 한글이 아니면 그대로 반환
  }
  
  const 초성 = (code - 0xAC00) / 0x24C;
  const 초성리스트 = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  
  return 초성리스트[Math.floor(초성)];
}

/**
 * 문자열을 초성 검색 가능한 형태로 변환
 * @param text 원본 문자열
 * @returns 초성 문자열 배열 (예: ['홍길동', 'ㅎㄱㄷ'])
 */
export function convertSearch초성(text: string): string[] {
  if (!text) return [];
  
  const result: string[] = [text]; // 원본 포함
  
  let 초성String = '';
  for (let i = 0; i < text.length; i++) {
    const 초성 = get초성(text[i]);
    초성String += 초성;
  }
  
  if (초성String) {
    result.push(초성String);
  }
  
  return result;
}

