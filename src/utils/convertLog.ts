/**
 * 게임 로그의 커스텀 태그를 HTML로 변환
 * 
 * 커스텀 태그:
 * - <1> = 작은 글씨
 * - <Y1> = 작은 노란 글씨
 * - <R> = 빨간색
 * - <B> = 파란색
 * - <G> = 초록색
 * - <Y> = 노란색
 * - <C> = 하늘색 (cyan)
 * - <M> = 마젠타
 * - <L> = 라임그린
 * - <S> = 스카이블루
 * - <O>, <D> = 오렌지레드
 * - <W> = 하얀색
 * - </> = 닫기
 * 
 * 특수 문자: ● (일반), ◆ (이벤트), ★ (중요)
 */

export function convertLog(text: string | null | undefined): string {
  if (!text) return '';

  // 커스텀 태그를 span 태그로 변환
  let html = text;

  // 크기
  html = html.replace(/<1>/g, '<span class="log-small">');
  html = html.replace(/<Y1>/g, '<span class="log-small log-yellow">');
  
  // 색상
  html = html.replace(/<R>/g, '<span class="log-red">');
  html = html.replace(/<B>/g, '<span class="log-blue">');
  html = html.replace(/<G>/g, '<span class="log-green">');
  html = html.replace(/<M>/g, '<span class="log-magenta">');
  html = html.replace(/<C>/g, '<span class="log-cyan">');
  html = html.replace(/<L>/g, '<span class="log-lime">');
  html = html.replace(/<S>/g, '<span class="log-skyblue">');
  html = html.replace(/<O>/g, '<span class="log-orange">');
  html = html.replace(/<D>/g, '<span class="log-orange">');
  html = html.replace(/<Y>/g, '<span class="log-yellow">');
  html = html.replace(/<W>/g, '<span class="log-white">');
  
  // 닫기 태그
  html = html.replace(/<\/>/g, '</span>');

  return html;
}
