import type { ReviewContext } from '@recoverse/shared';
import { REVIEW_LENSES, REVIEW_SCOPES } from '../components/solo/reviewContent';

/**
 * 리뷰 렌즈로 쓴 답에 붙는 꼬리표.
 * 질문(렌즈의 고정 질문)은 해마다 같아야 재발견이 묶이므로, 매번 달라지는 장면 이름과
 * 범위는 질문에서 빼내 여기로 온다 — 답 옆에 놓여 "무엇에 대한 답인지"를 알려준다.
 *
 * `subject`가 없는 라운드는 장면 이름이 질문 안에 박혀 있던 옛 형식이다.
 * 그 호들은 이미 발행돼 글자를 바꿀 수 없으니 꼬리표 없이 그대로 둔다(null).
 */
export interface ReviewSubjectLabel {
  /** 장면 이름 — '한강 야경 사진' */
  readonly subject: string;
  /** 어느 렌즈의 어느 범위였는지 — '요즘 · 사진' */
  readonly source: string;
}

export function reviewSubjectLabel(review: ReviewContext | undefined): ReviewSubjectLabel | null {
  const subject = review?.subject?.trim();
  if (!review || !subject) return null;

  const scopeLabel =
    review.scope.type === 'custom'
      ? review.scope.label?.trim() ?? ''
      : REVIEW_SCOPES.find((scope) => scope.id === review.scope.type)?.label ?? '';
  const lensTitle = REVIEW_LENSES.find((lens) => lens.id === review.lensId)?.title ?? '';

  return { subject, source: [scopeLabel, lensTitle].filter(Boolean).join(' · ') };
}
