import type { Issue } from '@recoverse/shared';

export type ArchiveDisposition = 'new' | 'duplicate' | 'conflict';

export interface ArchivePreviewItem {
  readonly issue: Issue;
  readonly disposition: ArchiveDisposition;
}

export interface ArchivePreview {
  readonly items: readonly ArchivePreviewItem[];
  readonly newCount: number;
  readonly duplicateCount: number;
  readonly conflictCount: number;
}

function normalized(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function issueFingerprint(issue: Issue): string {
  const rounds = issue.rounds
    .map((round) => {
      const answers = Object.entries(round.answers)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, answer]) => `${normalized(name)}:${normalized(answer.text)}`)
        .join('|');
      return `${normalized(round.question)}:${normalized(round.asker)}:${answers}`;
    })
    .join('~');
  return [issue.date, normalized(issue.title), issue.kind, rounds].join('::');
}

export function previewArchiveImport(incoming: readonly Issue[], existing: readonly Issue[]): ArchivePreview {
  const existingIds = new Set(existing.map((issue) => issue.id));
  const existingFingerprints = new Set(existing.map(issueFingerprint));
  const seenIncoming = new Set<string>();
  const items = incoming.map((issue) => {
    const fingerprint = issueFingerprint(issue);
    const disposition: ArchiveDisposition = existingIds.has(issue.id) && !existingFingerprints.has(fingerprint)
      ? 'conflict'
      : existingFingerprints.has(fingerprint) || seenIncoming.has(fingerprint)
        ? 'duplicate'
        : 'new';
    seenIncoming.add(fingerprint);
    return { issue, disposition };
  });
  return {
    items,
    newCount: items.filter((item) => item.disposition === 'new').length,
    duplicateCount: items.filter((item) => item.disposition === 'duplicate').length,
    conflictCount: items.filter((item) => item.disposition === 'conflict').length,
  };
}
