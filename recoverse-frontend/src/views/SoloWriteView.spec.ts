// @vitest-environment jsdom

import { mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { Issue, Round } from '@recoverse/shared';
import { SOLO_ISSUE_DRAFT_V2_KEY, type SoloIssueDraftV2 } from '../composables/useSoloIssueDraft';

const SHELF_KEY = 'recoverse_issues_v1';
const LEGACY_SOLO_FLOW_STATE_KEY = 'recoverse_solo_flow_v1';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function issue(id: string): Issue {
  return {
    id,
    kind: 'yearend',
    date: '2025-12-31',
    title: '2025 Year End',
    participants: ['Mina'],
    rounds: [{ asker: 'Mina', question: 'Source question?', format: 'three-scenes', answers: { Mina: { text: 'Then' } } }],
    source: 'solo',
  };
}

function draft(sourceIssueId = 'source-1'): SoloIssueDraftV2 {
  const rounds: readonly Round[] = [
    { asker: 'Mina', question: 'Finished question?', answers: { Mina: { text: 'Finished answer' } } },
  ];
  return {
    version: 2,
    updatedAt: '2026-07-19T12:00:00.000Z',
    kind: 'yearend',
    title: 'Recovered issue',
    name: 'Mina',
    sourceIssueId,
    rounds,
    currentRound: {
      question: 'Current question?',
      formatId: '',
      answers: { Mina: 'Current answer' },
    },
  };
}

function savedTimeText(savedAt: string): string {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(savedAt),
  );
}

async function mountSolo(props: Record<string, unknown> = {}): Promise<VueWrapper> {
  vi.resetModules();
  const component = await import('./SoloWriteView.vue');
  return mount(component.default, { props });
}

async function flushDraftSave(): Promise<void> {
  await nextTick();
  await nextTick();
}

async function chooseFreeMode(wrapper: VueWrapper): Promise<void> {
  const option = wrapper.findAll('.modeOption').find((button) => button.text().includes('직접 엮기'));
  if (option) await option.trigger('click');
}

async function openReviewLens(wrapper: VueWrapper, lensName: string): Promise<void> {
  const reviewMode = wrapper.findAll('.modeOption').find((button) => button.text().includes('대상을 골라'));
  if (reviewMode) await reviewMode.trigger('click');
  const lens = wrapper.findAll('.lensOption').find((button) => button.text().includes(lensName));
  if (lens) await lens.trigger('click');
}

async function completeReviewItem(wrapper: VueWrapper, label: string, note: string): Promise<void> {
  await wrapper.get('.reviewFlow .cta').trigger('click');
  await wrapper.get('.itemLabel').setValue(label);
  await wrapper.get('.itemNote').setValue(note);
  await wrapper.get('.reviewFlow .cta').trigger('click');
}

describe('SoloWriteView', () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('restores every visible solo draft field after remount', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(draft()));

    // When
    const wrapper = await mountSolo();

    // Then: 이어쓰기 안내가 맨 위에서 무엇이 돌아왔는지 말한다
    const resume = wrapper.get('.resumeBanner').text();
    expect(resume).toContain('쓰던 호를 이어서 열었어요');
    expect(resume).toContain('목차 1개');
    expect(resume).toContain('쓰던 질문 1개');
    expect(resume).toContain('표지 제목');
    expect(resume).toContain(`${savedTimeText(draft().updatedAt)} 저장`);
    expect(wrapper.find('.draftState').text()).toBe(`저장됨 ${savedTimeText(draft().updatedAt)}`);
    expect(wrapper.find('.draftState').text()).not.toBe('저장 준비 중');
    expect((wrapper.find('input[placeholder="나"]').element as HTMLInputElement).value).toBe('Mina');
    expect((wrapper.find('input[aria-label="표지 제목"]').element as HTMLInputElement).value).toBe('Recovered issue');
    expect(wrapper.get('.issueRow.active').text()).toContain('2025 Year End');
    const inputValues = wrapper.findAll('input.field').map((input) => (input.element as HTMLInputElement).value);
    expect(inputValues).toContain('Current question?');
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Current answer');
    expect(wrapper.text()).toContain('Finished question?');
  }, 10_000);

  it('clears only a restored stale source id and keeps written content', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('other-source')]));
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(draft('missing-source')));

    // When
    const wrapper = await mountSolo();
    await flushDraftSave();

    // Then
    const saved = JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}') as SoloIssueDraftV2;
    expect(wrapper.find('.issueRow.active').exists()).toBe(false);
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Current answer');
    expect(saved.sourceIssueId).toBe('');
    expect(saved.title).toBe('Recovered issue');
    expect(saved.currentRound.answers).toEqual({ Mina: 'Current answer' });
  });

  it('lays a past issue into the contents in one tap and can take it back', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);

    // When: 지난 호 한 줄을 누르면 그 구성 그대로 깔린다
    await wrapper.get('.issueRow').trigger('click');

    // Then
    expect(wrapper.get('.contentsList').text()).toContain('Source question?');
    expect(wrapper.get('.importNotice').text()).toContain('질문 1개를 목차에 담았어요');

    // When: 되돌린다
    await wrapper.get('.undo').trigger('click');

    // Then
    expect(wrapper.find('.contentsList').exists()).toBe(false);
    expect(wrapper.find('.importNotice').exists()).toBe(false);
  });

  it('says the set is already in the contents instead of piling up duplicates', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);
    await wrapper.get('.issueRow').trigger('click');

    // When
    await wrapper.get('.issueRow').trigger('click');

    // Then
    expect(wrapper.findAll('.contentsList li')).toHaveLength(1);
    expect(wrapper.get('.importNotice').text()).toContain('이미 목차에 있어요');
    expect(wrapper.find('.undo').exists()).toBe(false);
  });

  it('answers a question waiting in the contents in place, in a full-size field', async () => {
    // Given: 세트를 불러와 '답 대기' 질문이 목차에 깔린 상태
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);
    await wrapper.get('.issueRow').trigger('click');
    expect(wrapper.get('.contentsList').text()).toContain('답 대기');

    // When: 그 줄에서 바로 답을 쓴다
    await wrapper.get('.writeBtn').trigger('click');
    const panel = wrapper.get('.editPanel');
    // 새 질문 칸과 같은 크기의 칸이어야 한다 — 좁은 인라인 칸이 아니라.
    expect(panel.get('textarea').classes()).toContain('area');
    await panel.get('textarea').setValue('올해는 이렇게 답한다');
    expect((panel.get('.saveEdit').element as HTMLButtonElement).disabled).toBe(false);
    await panel.trigger('submit');

    // Then: 그 자리에 그대로 실린다
    const row = wrapper.get('.contentsList li');
    expect(row.text()).toContain('Source question?');
    expect(row.text()).toContain('올해는 이렇게 답한다');
    expect(row.text()).not.toContain('답 대기');
    expect(wrapper.findAll('.contentsList li')).toHaveLength(1);
    expect(wrapper.get('.writeBtn').text()).toBe('고쳐 쓰기');
  });

  it('points at the waiting questions and opens the first one on request', async () => {
    // Given: 세트를 불러와 답 대기 질문이 깔린 상태
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);
    await wrapper.get('.issueRow').trigger('click');

    // Then: 목차는 화면 아래에 있으므로 다음 할 일을 위에서 말한다
    expect(wrapper.get('.waitingBar').text()).toContain('답을 기다리는 질문 1개');

    // When
    await wrapper.get('.waitingGo').trigger('click');

    // Then: 그 줄이 쓰기 상태로 열린다
    expect(wrapper.get('.contentsList li').classes()).toContain('editing');
    expect(wrapper.find('.editPanel textarea').exists()).toBe(true);
  });

  it('opens the next waiting question after one is answered', async () => {
    // Given: 답 대기 두 줄
    localStorage.setItem(
      SOLO_ISSUE_DRAFT_V2_KEY,
      JSON.stringify({
        ...draft(''),
        rounds: [
          { asker: 'Mina', question: 'Waiting A?', answers: {} },
          { asker: 'Mina', question: 'Waiting B?', answers: {} },
        ],
      }),
    );
    const wrapper = await mountSolo();
    await wrapper.get('.waitingGo').trigger('click');

    // When: 첫 줄에 답하고 저장
    await wrapper.get('.editPanel textarea').setValue('A의 답');
    await wrapper.get('.editPanel').trigger('submit');

    // Then: 두 번째 대기 줄이 이어서 열린다
    const rows = wrapper.findAll('.contentsList li');
    expect(rows[0].classes()).not.toContain('editing');
    expect(rows[1].classes()).toContain('editing');
    expect(wrapper.get('.waitingBar').text()).toContain('답을 기다리는 질문 1개');
  });

  it('seats a question brought from rediscover in the question field', async () => {
    // When
    const wrapper = await mountSolo({ presetQuestion: '올해 가장 오래 남은 장면은?' });

    // Then
    const field = wrapper.get('input[placeholder="지금의 나에게 묻고 싶은 것"]');
    expect((field.element as HTMLInputElement).value).toBe('올해 가장 오래 남은 장면은?');
    expect(wrapper.find('.contentsList').exists()).toBe(false);
    expect(wrapper.find('.modePicker').exists()).toBe(false);
  });

  it('parks a brought question in the contents when something is already being written', async () => {
    // Given: 쓰던 질문이 있는 초고
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(draft('')));

    // When
    const wrapper = await mountSolo({ presetQuestion: '가져온 질문?' });

    // Then: 쓰던 질문은 그대로 두고 목차에 답 대기로 더한다
    const field = wrapper.get('input[placeholder="지금의 나에게 묻고 싶은 것"]');
    expect((field.element as HTMLInputElement).value).toBe('Current question?');
    expect(wrapper.get('.contentsList').text()).toContain('가져온 질문?');
    expect(wrapper.get('.waitingBar').text()).toContain('답을 기다리는 질문 1개');
  });

  it('lays a past issue out when arriving from "이 구성으로 쓰기"', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));

    // When
    const wrapper = await mountSolo({ presetIssueId: 'source-1' });

    // Then
    expect(wrapper.get('.contentsList').text()).toContain('Source question?');
    expect(wrapper.get('.importNotice').text()).toContain('질문 1개를 목차에 담았어요');
    expect(wrapper.find('.modePicker').exists()).toBe(false);
  });

  it('counts how many of the listed questions are answered', async () => {
    // Given
    localStorage.setItem(
      SOLO_ISSUE_DRAFT_V2_KEY,
      JSON.stringify({
        ...draft(''),
        rounds: [
          { asker: 'Mina', question: 'Answered?', answers: { Mina: { text: 'Yes' } } },
          { asker: 'Mina', question: 'Waiting?', answers: {} },
        ],
      }),
    );

    // When
    const wrapper = await mountSolo();

    // Then
    expect(wrapper.get('#contentsTitle').text()).toBe('질문 2개 중 1개 답했어요');
  });

  it('offers the three solo modes before an empty editor', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));

    // When
    const wrapper = await mountSolo();

    // Then
    const modes = wrapper.findAll('.modeOption').map((button) => button.text());
    expect(modes).toHaveLength(3);
    expect(modes[0]).toContain('바로 쓰기');
    expect(modes[1]).toContain('대상을 골라 리뷰하기');
    expect(modes[2]).toContain('직접 엮기');
    expect(wrapper.find('.roundEditor').exists()).toBe(false);
  });

  it('shows one shared catalog with twelve review lenses', async () => {
    // Given
    const wrapper = await mountSolo();

    // When
    await wrapper.findAll('.modeOption')[1].trigger('click');

    // Then
    const lenses = wrapper.findAll('.lensOption');
    expect(lenses).toHaveLength(12);
    expect(lenses.map((lens) => lens.text())).toEqual(
      expect.arrayContaining([
        expect.stringContaining('일기'),
        expect.stringContaining('사진'),
        expect.stringContaining('소비'),
        expect.stringContaining('대화'),
        expect.stringContaining('루틴'),
      ]),
    );
  });

  it('opens the existing editor with a quick-start question', async () => {
    // Given
    const wrapper = await mountSolo();

    // When
    await wrapper.findAll('.modeOption')[0].trigger('click');
    // 길이는 묻지 않는다 — 고른 값이 질문도 단계도 바꾸지 못했다.
    expect(wrapper.find('.quickLength').exists()).toBe(false);
    await wrapper.findAll('.quickOption')[0].trigger('click');

    // Then
    expect(wrapper.find('.roundEditor').exists()).toBe(true);
    expect((wrapper.get('input[placeholder="지금의 나에게 묻고 싶은 것"]').element as HTMLInputElement).value).toContain('오늘');
    const saved = JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}') as SoloIssueDraftV2;
    expect(saved.soloMode).toBe('quick');
    expect(saved.guidedPath).toEqual({ pathId: 'solo-today', pathRevision: 1, mode: 'standard', step: 0 });
    expect(saved.currentRound.pathId).toBe('solo-today');
    expect(saved.currentRound.pathStep).toBe(0);
  });

  it('lets the writer go back to the starting choices without losing what they wrote', async () => {
    // Given
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);
    await wrapper.get('input[placeholder="지금의 나에게 묻고 싶은 것"]').setValue('반쯤 쓰던 질문?');

    // When
    await wrapper.get('.backChoice').trigger('click');

    // Then
    expect(wrapper.findAll('.modeOption')).toHaveLength(3);
    await wrapper.findAll('.modeOption')[2].trigger('click');
    expect((wrapper.get('input[placeholder="지금의 나에게 묻고 싶은 것"]').element as HTMLInputElement).value).toBe(
      '반쯤 쓰던 질문?',
    );
  });

  it('parks the question in progress in the contents when a quick start replaces it', async () => {
    // Given
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);
    await wrapper.get('input[placeholder="지금의 나에게 묻고 싶은 것"]').setValue('먼저 쓰던 질문?');
    await wrapper.get('textarea').setValue('먼저 쓰던 답');
    await wrapper.get('.backChoice').trigger('click');

    // When
    await wrapper.findAll('.modeOption')[0].trigger('click');
    await wrapper.findAll('.quickOption')[0].trigger('click');

    // Then
    expect(wrapper.get('.roundEditor').text()).toContain('먼저 쓰던 질문?');
    expect(wrapper.get('.roundEditor').text()).toContain('먼저 쓰던 답');
    expect((wrapper.get('input[placeholder="지금의 나에게 묻고 싶은 것"]').element as HTMLInputElement).value).toContain(
      '오늘',
    );
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('');
  });

  it('leaves the review flow for the starting choices once a lens is finished', async () => {
    // Given
    const wrapper = await mountSolo();
    await openReviewLens(wrapper, '사진');
    await completeReviewItem(wrapper, '노을 사진', '색이 진해서 기억하고 싶다');

    // When
    await wrapper.get('.reviewFlow .backChoice').trigger('click');

    // Then
    expect(wrapper.findAll('.modeOption')).toHaveLength(3);
    await chooseFreeMode(wrapper);
    expect(wrapper.get('.roundEditor').text()).toContain('노을 사진');
  });

  it('does not treat a mode picked by mistake as something to resume', async () => {
    // Given
    const wrapper = await mountSolo();

    // When
    await chooseFreeMode(wrapper);
    await flushDraftSave();

    // Then
    const saved = JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}') as SoloIssueDraftV2;
    expect(saved.soloMode).toBe('free');
    const remounted = await mountSolo();
    expect(remounted.findAll('.modeOption')).toHaveLength(3);
  });

  it('uses recent as the default scope and guides the writer to their own sources', async () => {
    // Given
    const wrapper = await mountSolo();
    await wrapper.findAll('.modeOption')[1].trigger('click');

    // When
    await wrapper.findAll('.lensOption').find((lens) => lens.text().includes('사진'))?.trigger('click');

    // Then
    expect(wrapper.get('.scopeOption.active').text()).toContain('요즘');
    expect(wrapper.get('.sourceGuide').text()).toContain('사진첩');
    expect(wrapper.get('.sourceGuide').text()).toContain('직접');
  });

  it('publishes a one-line review without requiring a lesson or action', async () => {
    // Given
    const wrapper = await mountSolo();
    await openReviewLens(wrapper, '사진');
    await completeReviewItem(wrapper, '노을 사진', '색이 웃길 만큼 진해서 기억하고 싶다');

    // When
    await wrapper.get('.reviewFlow .cta').trigger('click');

    // Then
    const shelved = JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]') as Issue[];
    expect(shelved).toHaveLength(1);
    expect(shelved[0]?.rounds).toHaveLength(1);
    expect(shelved[0]?.rounds[0]?.question).toContain('요즘 사진');
    expect(shelved[0]?.rounds[0]?.answers['나']?.text).toBe('색이 웃길 만큼 진해서 기억하고 싶다');
    // 렌즈·범위는 질문 문장으로만 남는다. format은 열람 화면 조판 ID라는 기존 계약이라
    // 여기에 lens/scope를 실어 보내지 않는다(기계가 읽는 보존은 shared Round.review 몫).
    expect(shelved[0]?.rounds[0]?.format).toBeUndefined();
    expect((shelved[0]?.rounds[0] as Round & { review?: unknown })?.review).toEqual({
      lensId: 'photo',
      lensRevision: 1,
      scope: { type: 'recent' },
    });
  });

  it('keeps the finished review when the shelf cannot be written', async () => {
    // Given: 책장 쓰기만 실패하는 저장소
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string, value: string) {
          if (key === SHELF_KEY) throw new Error('quota exceeded');
          storage.setItem(key, value);
        },
      } satisfies Storage,
    });
    const wrapper = await mountSolo();
    await openReviewLens(wrapper, '식사');
    await completeReviewItem(wrapper, '늦은 국수', '혼자 먹었는데 안 외로웠다');

    // When
    await wrapper.get('.reviewFlow .cta').trigger('click');

    // Then: 실패를 말하고, 쓴 것은 목차와 초고에 그대로 남는다
    expect(wrapper.find('[role="alert"]').text()).toContain('저장 공간');
    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toHaveLength(0);
    const kept = JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}') as SoloIssueDraftV2;
    expect(kept.rounds?.[0]?.answers['나']?.text).toBe('혼자 먹었는데 안 외로웠다');
    expect(kept.soloMode).toBe('review');
    expect(kept.reviewComposer?.phase).toBe('complete');
  });

  it('adds a second lens to the same issue', async () => {
    // Given
    const wrapper = await mountSolo();
    await openReviewLens(wrapper, '사진');
    await completeReviewItem(wrapper, '산책 사진', '빛이 좋았다');
    await wrapper.get('.reviewFlow .ghost').trigger('click');
    const meal = wrapper.findAll('.lensOption').find((button) => button.text().includes('식사'));
    if (meal) await meal.trigger('click');
    await completeReviewItem(wrapper, '늦은 국수', '따뜻해서 좋았다');

    // When
    await wrapper.get('.reviewFlow .cta').trigger('click');

    // Then
    const shelved = JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]') as Issue[];
    expect(shelved[0]?.rounds).toHaveLength(2);
    expect(shelved[0]?.rounds.map((round) => round.question)).toEqual([
      expect.stringContaining('사진'),
      expect.stringContaining('식사'),
    ]);
    // 두 렌즈가 한 호에 섞여도 각 줄은 자기 렌즈 이름을 질문 문장으로 달고 간다.
    expect(shelved[0]?.rounds.map((round) => round.format)).toEqual([undefined, undefined]);
  });

  it('restores the selected lens, scope, and item after remount', async () => {
    // Given
    const first = await mountSolo();
    await openReviewLens(first, '업무');
    const month = first.findAll('.scopeOption').find((button) => button.text().includes('이번 달'));
    if (month) await month.trigger('click');
    await first.get('.reviewFlow .cta').trigger('click');
    await first.get('.itemLabel').setValue('배포 회의');
    first.unmount();

    // When
    const restored = await mountSolo();

    // Then
    expect(restored.get('.reviewFlow').text()).toContain('업무 · 이번 달');
    expect((restored.get('.itemLabel').element as HTMLInputElement).value).toBe('배포 회의');
  });

  it('keeps the review usable and explains when unified draft saving fails', async () => {
    // Given
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string, value: string) {
          if (key === SOLO_ISSUE_DRAFT_V2_KEY) throw new DOMException('quota exceeded', 'QuotaExceededError');
          storage.setItem(key, value);
        },
      } satisfies Storage,
    });
    const wrapper = await mountSolo();

    // When
    await wrapper.findAll('.modeOption')[1].trigger('click');

    // Then
    expect(wrapper.findAll('.lensOption')).toHaveLength(12);
    expect(wrapper.get('[role="alert"]').text()).toContain('임시 저장하지 못했어요');
  });

  it('hides the starting routes once the writer is under way', async () => {
    // Given
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(draft('')));

    // When
    const wrapper = await mountSolo();

    // Then
    expect(wrapper.find('.modePicker').exists()).toBe(false);
    expect(wrapper.find('.roundEditor').exists()).toBe(true);
  });

  it('does not let stale flow storage hide a valid issue draft', async () => {
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(draft('')));
    localStorage.setItem(
      LEGACY_SOLO_FLOW_STATE_KEY,
      JSON.stringify({
        mode: 'review',
        quickReady: false,
        updatedAt: '2026-07-18T12:00:00.000Z',
        review: {
          phase: 'context',
          lensId: 'photo',
          scopeType: 'recent',
          scopeLabel: '',
          items: [{ id: 'stale', label: '', note: '' }],
        },
      }),
    );

    const wrapper = await mountSolo();

    expect(wrapper.find('.roundEditor').exists()).toBe(true);
    expect(wrapper.find('.reviewFlow').exists()).toBe(false);
  });

  it('folds the set list away once questions are laid into the contents', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);

    // When
    await wrapper.get('.issueRow').trigger('click');

    // Then: 목록은 접히고 안내는 목록 밖에 남는다
    expect((wrapper.get('details.disclosure').element as HTMLDetailsElement).open).toBe(false);
    expect(wrapper.get('.importNotice').text()).toContain('질문 1개를 목차에 담았어요');
  });

  it('sends a past question straight to the question field without touching the contents', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);

    // When
    await wrapper.get('.pickOpen').trigger('click');
    await wrapper.get('.pick').trigger('click');

    // Then
    const questionField = wrapper.get('input[placeholder="지금의 나에게 묻고 싶은 것"]');
    expect((questionField.element as HTMLInputElement).value).toBe('Source question?');
    expect(wrapper.find('.contentsList').exists()).toBe(false);
  });

  it('clears the full draft only after publish succeeds', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(draft()));
    const wrapper = await mountSolo();

    // When
    await wrapper.find('button.cta').trigger('click');

    // Then
    expect(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY)).toBe('');
  });

  it('carries questions still waiting for an answer into the next issue instead of dropping them', async () => {
    // Given: 답을 쓴 질문 하나와 답 대기 질문 둘
    const waiting: SoloIssueDraftV2 = {
      ...draft(''),
      title: '이번 호',
      rounds: [
        { asker: 'Mina', question: 'Answered?', answers: { Mina: { text: 'Yes' } } },
        { asker: 'Mina', question: 'Waiting A?', answers: {} },
        { asker: 'Mina', question: 'Waiting B?', answers: {} },
      ],
      currentRound: { question: '', formatId: '', answers: {} },
    };
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(waiting));
    const wrapper = await mountSolo();

    // When
    await wrapper.find('button.cta').trigger('click');

    // Then: 발행된 호에는 답한 질문만
    const shelved = JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]') as Issue[];
    expect(shelved[0].rounds.map((round) => round.question)).toEqual(['Answered?']);

    // 그리고 답 대기 질문은 다음 호 초고로 남는다
    const kept = JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}') as SoloIssueDraftV2;
    expect(kept.rounds.map((round) => round.question)).toEqual(['Waiting A?', 'Waiting B?']);
    expect(kept.title).toBe('');
    expect(wrapper.get('.carried').text()).toContain('답 대기 2개');
    expect(wrapper.get('.overlayTitle').text()).toContain('이번 호');
  });

  it('warns that waiting questions move to the next issue rather than vanish', async () => {
    // Given
    localStorage.setItem(
      SOLO_ISSUE_DRAFT_V2_KEY,
      JSON.stringify({
        ...draft(''),
        rounds: [
          { asker: 'Mina', question: 'Answered?', answers: { Mina: { text: 'Yes' } } },
          { asker: 'Mina', question: 'Waiting?', answers: {} },
        ],
      }),
    );

    // When
    const wrapper = await mountSolo();

    // Then
    expect(wrapper.get('.publishHelp').text()).toContain('다음 호 초고로 남겨둬요');
  });

  it('preserves the full draft and shows guidance when publish cannot write to shelf', async () => {
    // Given
    const storage = createMemoryStorage();
    const fixture = draft();
    storage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    storage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string, value: string) {
          if (key === SHELF_KEY) throw new Error('quota exceeded');
          storage.setItem(key, value);
        },
      } satisfies Storage,
    });
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);

    // When
    await wrapper.find('button.cta').trigger('click');

    // Then
    expect(wrapper.find('[role="alert"]').text()).toContain('저장 공간');
    expect(JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}')).toMatchObject(fixture);
  });

  it('stays on the write screen and surfaces guidance when clearing the draft fails after shelf save succeeds', async () => {
    // Given
    const storage = createMemoryStorage();
    // 소스 호가 없는 드래프트로 격리 — 마운트 시 스테일 소스 정리가 드래프트를 재저장하지 않게 한다.
    const fixture = draft('');
    storage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string, value: string) {
          if (key === SOLO_ISSUE_DRAFT_V2_KEY && value === '') throw new Error('clear failed');
          storage.setItem(key, value);
        },
      } satisfies Storage,
    });
    const wrapper = await mountSolo();

    // When
    await wrapper.find('button.cta').trigger('click');

    // Then
    expect(wrapper.find('[role="alert"]').text()).toContain('임시 저장을 비우지 못했어요');
    expect(wrapper.find('.publishOverlay').exists()).toBe(false);
    expect(wrapper.emitted('published')).toBeUndefined();
    expect(JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}')).toMatchObject(fixture);
    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toHaveLength(1);
  });

  it('shows persistent editorial guidance and no saved timestamp when draft save fails', async () => {
    // Given
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string, value: string) {
          if (key === SOLO_ISSUE_DRAFT_V2_KEY) throw new Error('quota exceeded');
          storage.setItem(key, value);
        },
      } satisfies Storage,
    });
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);

    // When
    await wrapper.find('input[placeholder="나"]').setValue('Mina');
    await flushDraftSave();

    // Then
    expect(wrapper.text()).not.toMatch(/저장됨 \d{2}:\d{2}/);
    expect(wrapper.find('[role="alert"]').text()).toContain('임시 저장하지 못했어요');
    expect(wrapper.find('[role="alert"]').text()).toContain('다시 시도');
  });

  it('hides the restored success notice and keeps only failure guidance when a later draft save fails', async () => {
    // Given
    const storage = createMemoryStorage();
    const fixture = draft();
    storage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    storage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string, value: string) {
          if (key === SOLO_ISSUE_DRAFT_V2_KEY) throw new Error('quota exceeded');
          storage.setItem(key, value);
        },
      } satisfies Storage,
    });
    const wrapper = await mountSolo();

    // When
    await wrapper.find('input[placeholder="나"]').setValue('Joon');
    await flushDraftSave();

    // Then
    expect(wrapper.find('.resumeBanner').exists()).toBe(false);
    expect(wrapper.text()).not.toMatch(/저장됨 \d{2}:\d{2}/);
    expect(wrapper.find('.draftState').text()).toBe('저장 실패');
    expect(wrapper.find('[role="alert"]').text()).toContain('임시 저장하지 못했어요');
  });
});
