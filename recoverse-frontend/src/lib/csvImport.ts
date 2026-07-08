import type { Round } from '@recoverse/shared';

const YEAR_RE = /^\d{4}$/;
const RESERVED_HEADERS = new Set([
  'year',
  '연도',
  'date',
  '날짜',
  'title',
  '제목',
  'participants',
  '참여자',
  'asker',
  '질문자',
  'question',
  '질문',
  'format',
  '포맷',
]);

export class CsvImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvImportError';
  }
}

export interface CsvImportResult {
  readonly year: string;
  readonly title: string;
  readonly participants: readonly string[];
  readonly rounds: readonly Round[];
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (char === '\n') {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function headerIndex(headers: readonly string[], candidates: readonly string[]): number {
  return headers.findIndex((header) => candidates.includes(header));
}

function splitParticipants(value: string): string[] {
  return value
    .split(/[;,|]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function answerName(header: string): string | null {
  if (header.startsWith('answer:')) return header.slice('answer:'.length).trim();
  if (header.startsWith('답변:')) return header.slice('답변:'.length).trim();
  if (RESERVED_HEADERS.has(header)) return null;
  return header;
}

export function parseReflectionCsv(text: string): CsvImportResult {
  const rows = parseCsvRows(text.trim());
  if (rows.length < 2) throw new CsvImportError('헤더와 최소 1개의 질문 행이 필요해요.');

  const [rawHeaders, ...bodyRows] = rows;
  const headers = rawHeaders.map((header) => header.trim().toLowerCase());
  const questionIndex = headerIndex(headers, ['question', '질문']);
  if (questionIndex < 0) throw new CsvImportError('question 또는 질문 컬럼이 필요해요.');

  const yearIndex = headerIndex(headers, ['year', '연도']);
  const dateIndex = headerIndex(headers, ['date', '날짜']);
  const titleIndex = headerIndex(headers, ['title', '제목']);
  const askerIndex = headerIndex(headers, ['asker', '질문자']);
  const formatIndex = headerIndex(headers, ['format', '포맷']);
  const participantsIndex = headerIndex(headers, ['participants', '참여자']);
  const answerColumns = headers
    .map((header, index) => ({ header, index, name: answerName(header) }))
    .filter((column): column is { readonly header: string; readonly index: number; readonly name: string } =>
      column.name !== null && column.index !== questionIndex,
    );

  if (answerColumns.length === 0) throw new CsvImportError('참여자 이름 또는 answer:이름 컬럼이 필요해요.');

  const participantsFromRows = bodyRows.flatMap((row) =>
    participantsIndex >= 0 ? splitParticipants(row[participantsIndex] ?? '') : [],
  );
  const participants = unique([...participantsFromRows, ...answerColumns.map((column) => column.name)]);
  const rounds: Round[] = [];

  for (const row of bodyRows) {
    const question = (row[questionIndex] ?? '').trim();
    if (!question) continue;

    const answers: Round['answers'] = {};
    for (const column of answerColumns) {
      const text = (row[column.index] ?? '').trim();
      if (text) answers[column.name] = { text };
    }
    if (Object.keys(answers).length === 0) continue;

    const asker = askerIndex >= 0 ? (row[askerIndex] ?? '').trim() : '';
    const round: Round = {
      asker: asker || participants[rounds.length % participants.length] || '질문자',
      question,
      answers,
    };
    const format = formatIndex >= 0 ? (row[formatIndex] ?? '').trim() : '';
    if (format) round.format = format;
    rounds.push(round);
  }

  if (rounds.length === 0) throw new CsvImportError('가져올 수 있는 질문과 답변이 없어요.');

  const first = bodyRows[0] ?? [];
  const dateYear = dateIndex >= 0 ? (first[dateIndex] ?? '').slice(0, 4) : '';
  const rawYear = yearIndex >= 0 ? (first[yearIndex] ?? '').trim() : dateYear;
  return {
    year: YEAR_RE.test(rawYear) ? rawYear : '',
    title: titleIndex >= 0 ? (first[titleIndex] ?? '').trim() : '',
    participants,
    rounds,
  };
}
