import { defaultTitle, type Issue } from '@recoverse/shared';

/**
 * 책장을 사람이 읽는 Markdown으로 내보낸다 (스펙 리서치: JSON은 기계용 백업이지
 * 10년 뒤 열어볼 파일이 아니다). 질문은 헤딩, 답은 인용문으로 옮겨 편집·이식이 쉽게 한다.
 * 순수 변환(issueToMarkdown/shelfToMarkdown)과 다운로드(exportShelfMarkdown)를 분리해
 * 변환 로직을 DOM 없이 단위 테스트할 수 있게 한다.
 */

/** 여러 줄 답을 인용문 블록으로. 빈 줄도 인용문 안에 유지한다. */
function blockquote(text: string): string {
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? `> ${line}` : '>'))
    .join('\n');
}

function roundToMarkdown(issue: Issue, round: Issue['rounds'][number]): string {
  const answered = issue.participants
    .map((name) => ({ name, text: round.answers[name]?.text?.trim() ?? '' }))
    .filter((entry) => entry.text.length > 0)
    .map((entry) => `> **${entry.name}**\n${blockquote(entry.text)}`);
  const answers = answered.length > 0 ? answered.join('\n>\n') : '> _(아직 빈 답)_';
  return `## ${round.question}\n\n${answers}`;
}

export function issueToMarkdown(issue: Issue): string {
  const title = issue.title.trim() || defaultTitle(issue.kind, issue.date);
  const people = issue.participants.filter((name) => name.trim().length > 0);
  const byline = people.length > 0 ? `${issue.date} · ${people.join(', ')}` : issue.date;
  const rounds = issue.rounds.map((round) => roundToMarkdown(issue, round));
  return [`# ${title}`, byline, '', rounds.join('\n\n')].join('\n').trimEnd() + '\n';
}

export function shelfToMarkdown(issues: readonly Issue[]): string {
  if (issues.length === 0) return '# Recoverse 책장\n\n아직 꽂힌 호가 없어요.\n';
  return issues.map(issueToMarkdown).join('\n---\n\n').trimEnd() + '\n';
}

function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportShelfMarkdown(issues: readonly Issue[]): void {
  const today = new Date().toISOString().slice(0, 10);
  downloadMarkdown(`recoverse_책장_${today}.md`, shelfToMarkdown(issues));
}
