import type { Issue } from '@recoverse/shared';

/**
 * 책장 전체를 JSON으로 내보낸다.
 * backupImport.ts의 parseReflectionBackup이 받아들이는 { issues: Issue[] } 형태로 만들어
 * 가져오기 → 내보내기 → 가져오기 왕복이 되도록 한다.
 */
/**
 * 백업 JSON 문자열을 만든다 (다운로드와 분리 — 가져오기 파서와의 왕복을 테스트할 수 있게).
 * parseReflectionBackup이 받아들이는 { issues } 형태를 그대로 낸다.
 */
export function shelfBackupJson(issues: readonly Issue[]): string {
  return JSON.stringify({ issues }, null, 2);
}

export function exportShelfBackup(issues: Issue[]): void {
  const json = shelfBackupJson(issues);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');

  const a = document.createElement('a');
  a.href = url;
  a.download = `recoverse_책장_${y}-${m}-${d}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
