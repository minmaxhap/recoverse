import { describe, expect, it } from 'vitest';
import { backupAgeLabel } from './useBackupStatus';

describe('backupAgeLabel', () => {
  const now = new Date('2026-07-20T12:00:00.000Z');

  it('returns an empty string when there is no backup or the value is invalid', () => {
    expect(backupAgeLabel('', now)).toBe('');
    expect(backupAgeLabel('not-a-date', now)).toBe('');
  });

  it('describes recent backups in minutes and hours', () => {
    expect(backupAgeLabel('2026-07-20T11:59:30.000Z', now)).toBe('방금');
    expect(backupAgeLabel('2026-07-20T11:30:00.000Z', now)).toBe('30분 전');
    expect(backupAgeLabel('2026-07-20T09:00:00.000Z', now)).toBe('3시간 전');
  });

  it('describes older backups in days, then falls back to a calendar date', () => {
    expect(backupAgeLabel('2026-07-18T12:00:00.000Z', now)).toBe('2일 전');
    expect(backupAgeLabel('2026-07-01T12:00:00.000Z', now)).toBe('7월 1일');
  });
});
