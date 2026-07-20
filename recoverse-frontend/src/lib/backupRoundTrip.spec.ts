import { describe, expect, it } from 'vitest';
import type { Issue } from '@recoverse/shared';
import { shelfBackupJson } from './backupExport';
import { parseReflectionBackup } from './backupImport';
import { previewArchiveImport } from './archivePreview';

// 내보내기 → (초기화) → 가져오기 복원 왕복. 내보낸 JSON을 그대로 파서에 먹여
// 포맷 계약과 중복 감지가 맞물리는지 확인한다.
function issue(id: string, title: string): Issue {
  return {
    id,
    kind: 'yearend',
    date: '2026-12-31',
    title,
    participants: ['민희', '지원'],
    rounds: [
      { asker: '민희', question: '올해 가장 큰 변화는?', answers: { 민희: { text: '이사' }, 지원: { text: '이직' } } },
    ],
    source: 'solo',
  };
}

describe('backup round-trip', () => {
  it('restores every exported issue into an empty shelf', () => {
    const shelf = [issue('a', '호 A'), issue('b', '호 B')];

    // export → (초기화된 새 기기라 가정) → import
    const parsed = parseReflectionBackup(shelfBackupJson(shelf));
    const preview = previewArchiveImport(parsed, []);

    expect(parsed).toHaveLength(2);
    expect(preview.newCount).toBe(2);
    expect(preview.duplicateCount).toBe(0);
    expect(preview.items.map((item) => item.issue.title)).toEqual(['호 A', '호 B']);
  });

  it('re-importing the same backup into a populated shelf detects duplicates, not new copies', () => {
    const shelf = [issue('a', '호 A'), issue('b', '호 B')];
    const parsed = parseReflectionBackup(shelfBackupJson(shelf));

    // 같은 백업을 이미 그 호들이 있는 책장에 다시 가져오기
    const preview = previewArchiveImport(parsed, shelf);

    expect(preview.newCount).toBe(0);
    expect(preview.duplicateCount).toBe(2);
  });
});
