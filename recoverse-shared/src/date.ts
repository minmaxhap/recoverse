/**
 * 회고 기준일(ISO YYYY-MM-DD)을 한국시간(KST, UTC+9) 달력 기준으로 반환.
 *
 * Cloudflare Worker는 UTC로 도므로 new Date().toISOString()을 그대로 쓰면
 * 한국 자정 직후(예: 1/1 00:30 KST = UTC 12/31)에 날짜/연도가 하루 어긋난다.
 * 이 앱은 한국어 사용자 대상이라 KST 달력 날짜를 기준일로 삼는다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function kstTodayISO(now: number = Date.now()): string {
  return new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);
}
