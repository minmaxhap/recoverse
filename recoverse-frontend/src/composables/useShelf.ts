import { ref } from 'vue';
import type { Issue } from '@recoverse/shared';
import { readLocalStorageValue, writeLocalStorageValue } from '../lib/safeLocalStorage';

const KEY = 'recoverse_issues_v1';

const issues = ref<Issue[]>([]);
let loaded = false;

function sortByDateDesc(list: Issue[]): Issue[] {
  return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function load(): void {
  const r = readLocalStorageValue(KEY);
  if (r.ok && r.value) {
    try {
      const parsed = JSON.parse(r.value);
      if (Array.isArray(parsed)) {
        issues.value = sortByDateDesc(parsed as Issue[]);
      }
    } catch {
      issues.value = [];
    }
  }
  loaded = true;
}

function persist(): boolean {
  const r = writeLocalStorageValue(KEY, JSON.stringify(issues.value));
  return r.ok;
}

export function useShelf() {
  if (!loaded) load();

  return {
    issues,
    reload: load,
    add(issue: Issue): boolean {
      issues.value = sortByDateDesc([issue, ...issues.value]);
      return persist();
    },
    remove(id: string): boolean {
      issues.value = issues.value.filter((i) => i.id !== id);
      return persist();
    },
    get(id: string): Issue | undefined {
      return issues.value.find((i) => i.id === id);
    },
  };
}
