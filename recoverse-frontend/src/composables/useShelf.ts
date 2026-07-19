import { ref } from 'vue';
import type { Issue } from '@recoverse/shared';
import { readLocalStorageValue, writeLocalStorageValue } from '../lib/safeLocalStorage';
import { parseIssues } from '../lib/issueParsing';

const KEY = 'recoverse_issues_v1';

const issues = ref<Issue[]>([]);
let loaded = false;

export interface AddManyResult {
  readonly ok: boolean;
  readonly added: number;
}

function sortByDateDesc(list: Issue[]): Issue[] {
  return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function load(): void {
  const r = readLocalStorageValue(KEY);
  if (r.ok && r.value) {
    try {
      const parsed = JSON.parse(r.value);
      issues.value = sortByDateDesc(parseIssues(parsed));
    } catch {
      issues.value = [];
    }
  }
  loaded = true;
}

function persist(nextIssues: readonly Issue[]): boolean {
  const r = writeLocalStorageValue(KEY, JSON.stringify(nextIssues));
  return r.ok;
}

function commit(nextIssues: readonly Issue[]): boolean {
  const sorted = sortByDateDesc([...nextIssues]);
  if (!persist(sorted)) return false;
  issues.value = sorted;
  return true;
}

export function useShelf() {
  if (!loaded) load();

  return {
    issues,
    reload: load,
    add(issue: Issue): boolean {
      return commit([issue, ...issues.value]);
    },
    addMany(newIssues: readonly Issue[]): AddManyResult {
      if (newIssues.length === 0) return { ok: true, added: 0 };
      const nextIssues = [...newIssues, ...issues.value];
      if (!commit(nextIssues)) return { ok: false, added: 0 };
      return { ok: true, added: newIssues.length };
    },
    remove(id: string): boolean {
      return commit(issues.value.filter((i) => i.id !== id));
    },
    get(id: string): Issue | undefined {
      return issues.value.find((i) => i.id === id);
    },
    update(id: string, patch: Partial<Issue>): boolean {
      return commit(issues.value.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    },
  };
}
