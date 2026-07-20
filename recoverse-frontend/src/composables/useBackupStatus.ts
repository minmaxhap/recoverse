import { readonly, ref } from 'vue';
import { readLocalStorageValue, writeLocalStorageValue } from '../lib/safeLocalStorage';

/**
 * 마지막 JSON 백업 시각을 기록·표시한다 (스펙 리서치: "최근 백업 시각과 책장 상태 표시").
 * 무손실 백업인 JSON 내보내기만 백업으로 친다 — Markdown·CSV는 읽기/교환용이라 제외.
 * useShelf처럼 모듈 싱글턴이라 내보내기(기록)와 설정 패널(표시)이 같은 상태를 공유한다.
 */

const KEY = 'recoverse_last_backup_v1';

function load(): string {
  const result = readLocalStorageValue(KEY);
  return result.ok && result.value ? result.value : '';
}

const lastBackupAt = ref<string>(load());

/** 마지막 백업 시각으로부터의 사람이 읽는 경과 라벨. 값이 없으면 빈 문자열. */
export function backupAgeLabel(iso: string, now: Date = new Date()): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor((now.getTime() - then) / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const date = new Date(then);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function useBackupStatus() {
  return {
    lastBackupAt: readonly(lastBackupAt),
    markBackedUp(): void {
      const now = new Date().toISOString();
      if (writeLocalStorageValue(KEY, now).ok) lastBackupAt.value = now;
    },
  };
}
