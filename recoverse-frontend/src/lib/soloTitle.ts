import { defaultTitle, type Kind, type Round, type SoloMode } from '@recoverse/shared';
import { REVIEW_LENSES } from '../components/solo/reviewContent';

type SoloTitleInput = {
  readonly kind: Kind;
  readonly date: string;
  readonly mode: SoloMode;
  readonly answeredRounds: readonly Round[];
};

function monthDayLabel(date: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const month = Number(match?.[2]);
  const day = Number(match?.[3]);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  return `${month}월 ${day}일`;
}

function quickTitle(pathId: string | undefined, monthDay: string, fallback: string): string {
  switch (pathId) {
    case 'solo-today':
      return `${monthDay}의 장면`;
    case 'solo-hard-moment':
      return `넘기지 않고 본 장면 · ${monthDay}`;
    case 'solo-next-action':
      return `다음 한 걸음 · ${monthDay}`;
    default:
      return fallback;
  }
}

function reviewTitle(answeredRounds: readonly Round[], monthDay: string, fallback: string): string {
  const titlesById = new Map(REVIEW_LENSES.map((lens) => [lens.id, lens.title]));
  const seen = new Set<string>();
  const titles: string[] = [];

  for (const round of answeredRounds) {
    const lensId = round.review?.lensId;
    if (!lensId) return fallback;
    const lensTitle = titlesById.get(lensId);
    if (!lensTitle) return fallback;
    if (seen.has(lensId)) continue;
    seen.add(lensId);
    titles.push(lensTitle);
  }

  const firstTitle = titles[0];
  if (!firstTitle) return fallback;
  if (titles.length === 1) return `${firstTitle} 리뷰 · ${monthDay}`;
  return `${firstTitle} 외 ${titles.length - 1}개 리뷰 · ${monthDay}`;
}

export function deriveSoloTitle(input: SoloTitleInput): string {
  const fallback = defaultTitle(input.kind, input.date);
  const monthDay = monthDayLabel(input.date);
  if (!monthDay) return fallback;

  switch (input.mode) {
    case 'quick':
      return quickTitle(input.answeredRounds[0]?.pathId, monthDay, fallback);
    case 'review':
      return reviewTitle(input.answeredRounds, monthDay, fallback);
    case 'free':
      return fallback;
    default: {
      const exhaustiveMode: never = input.mode;
      return exhaustiveMode;
    }
  }
}
