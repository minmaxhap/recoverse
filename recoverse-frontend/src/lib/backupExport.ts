import type { Issue } from '@recoverse/shared';

/**
 * 책장 전체를 JSON으로 내보낸다.
 * backupImport.ts의 parseReflectionBackup이 받아들이는 { issues: Issue[] } 형태로 만들어
 * 가져오기 → 내보내기 → 가져오기 왕복이 되도록 한다.
 */
export function exportShelfBackup(issues: Issue[]): void {
  const payload = { issues };
  const json = JSON.stringify(payload, null, 2);
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
