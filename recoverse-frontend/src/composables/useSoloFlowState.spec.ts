// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyReviewDraft } from '../components/solo/reviewContent';
import { peekSoloFlowDraft, SOLO_FLOW_STATE_KEY } from './useSoloFlowState';

describe('peekSoloFlowDraft', () => {
  beforeEach(() => localStorage.clear());

  it('does not call a mode choice an unfinished draft', () => {
    localStorage.setItem(
      SOLO_FLOW_STATE_KEY,
      JSON.stringify({ mode: 'review', quickReady: false, review: createEmptyReviewDraft(), updatedAt: new Date().toISOString() }),
    );

    expect(peekSoloFlowDraft()).toBeNull();
  });

  it('offers a review again after a lens and scope are chosen', () => {
    const review = { ...createEmptyReviewDraft(), phase: 'context', lensId: 'photo' };
    localStorage.setItem(
      SOLO_FLOW_STATE_KEY,
      JSON.stringify({ mode: 'review', quickReady: false, review, updatedAt: new Date().toISOString() }),
    );

    expect(peekSoloFlowDraft()).toMatchObject({ resumable: true, title: '사진 리뷰 쓰는 중' });
  });
});
