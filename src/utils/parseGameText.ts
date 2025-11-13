/**
 * 게임 텍스트 태그 파싱 유틸리티
 * 
 * PHP 삼국지의 텍스트 태그를 HTML로 변환합니다.
 * 
 * 지원 태그:
 * - <C>텍스트</> : 청록색 (숫자, 중요 정보)
 * - <1>텍스트</> : 회색 이탤릭 (날짜, 부가 정보)
 * - <Y>텍스트</> : 노란색 (장수명)
 * - <R>텍스트</> : 빨간색 (경고, 중요)
 * - <G>텍스트</> : 초록색 (성공, 도시명)
 * - <D>텍스트</> : 어두운 청록색 (국가명)
 * - <B>텍스트</> : 파란색
 * - <S>텍스트</> : 취소선
 * - <b>텍스트</b> : 굵게
 * - <i>텍스트</i> : 이탤릭
 */

export function parseGameText(text: string): string {
  if (!text) return '';
  
  return text
    // 색상 태그
    .replace(/<C>(.*?)<\/>/g, '<span style="color: #00d4aa;">$1</span>')  // 청록색
    .replace(/<1>(.*?)<\/>/g, '<span style="color: #888; font-style: italic;">$1</span>')  // 회색 이탤릭
    .replace(/<Y>(.*?)<\/>/g, '<span style="color: #ffd700;">$1</span>')  // 노란색
    .replace(/<R>(.*?)<\/>/g, '<span style="color: #ff6b6b;">$1</span>')  // 빨간색
    .replace(/<G>(.*?)<\/>/g, '<span style="color: #51cf66;">$1</span>')  // 초록색
    .replace(/<D>(.*?)<\/>/g, '<span style="color: #339af0;">$1</span>')  // 어두운 청록색
    .replace(/<B>(.*?)<\/>/g, '<span style="color: #4dabf7;">$1</span>')  // 파란색
    .replace(/<S>(.*?)<\/>/g, '<span style="text-decoration: line-through;">$1</span>')  // 취소선
    
    // HTML 기본 태그 (이미 지원되지만 명시적으로)
    .replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
    .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>');
}

/**
 * 게임 텍스트를 React 컴포넌트로 렌더링
 * dangerouslySetInnerHTML 사용
 */
export function renderGameText(text: string): { __html: string } {
  return { __html: parseGameText(text) };
}
