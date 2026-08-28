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
  // 첫 화면에는 오늘의 렌즈 셋만 보인다. 이름으로 고르려면 나머지를 펼친 뒤 찾는다.
  const more = wrapper.find('.moreLenses');
  if (more.exists()) await more.trigger('click');
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

    // Then: 돌아온 것은 글 자체와 저장 표시가 말한다 — 배너로 한 번 더 말하지 않는다
    expect(wrapper.find('.resumeBanner').exists()).toBe(false);
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

  it('speaks up only when an older draft had to be moved across', async () => {
    // Given — v2는 없고 옛 형식 초고만 남아 있다
    localStorage.setItem(
      'recoverse_draft_round_free_0',
      JSON.stringify({ q: '옛 형식에 남아 있던 질문?', formatId: '', answers: { 나: '옛 답' } }),
    );

    // When
    const wrapper = await mountSolo();

    // Then — 사용자가 모르는 사이 벌어진 일이라 한 번은 알린다
    const banner = wrapper.get('.resumeBanner').text();
    expect(banner).toContain('이전 임시 저장을 옮겨 왔어요');
    expect(banner).toContain('쓰던 질문 1개');
  });

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

  it('starts with a few lenses and opens the full catalog on request', async () => {
    // Given
    const wrapper = await mountSolo();

    // When
    await wrapper.findAll('.modeOption')[1].trigger('click');

    // Then
    expect(wrapper.findAll('.lensOption')).toHaveLength(3);

    // When
    await wrapper.get('.moreLenses').trigger('click');

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
    expect(wrapper.get('.quickQuestion').text()).toContain('오늘');
    expect(wrapper.find('input[placeholder="지금의 나에게 묻고 싶은 것"]').exists()).toBe(false);
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
    expect(wrapper.get('.quickQuestion').text()).toContain('오늘');
    expect(wrapper.find('input[placeholder="지금의 나에게 묻고 싶은 것"]').exists()).toBe(false);
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

  it('holds back the cover fields and the publish button until an answer exists', async () => {
    // Given
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);

    // Then
    expect(wrapper.find('.cta').exists()).toBe(false);
    expect(wrapper.find('.coverNote').exists()).toBe(false);
    expect(wrapper.get('.publishHelp').text()).toContain('발행할 수 있어요');

    // When
    await wrapper.get('input[placeholder="지금의 나에게 묻고 싶은 것"]').setValue('첫 질문?');
    await wrapper.get('.qaBox textarea').setValue('첫 답');
    await wrapper.get('.qaBox .ghost').trigger('click');

    // Then
    expect(wrapper.get('.cta').text()).toContain('책장에 꽂기');
    expect(wrapper.find('.coverNote').exists()).toBe(true);
  });

  it('offers finishing or one more question after a quick answer, not a blank field', async () => {
    // Given
    const wrapper = await mountSolo();
    await wrapper.findAll('.modeOption')[0].trigger('click');
    await wrapper.findAll('.quickOption')[0].trigger('click');

    // When
    expect(wrapper.get('.qaBox .ghost').text()).toBe('이 답 남기기');
    await wrapper.get('.qaBox textarea').setValue('오늘 남은 장면 하나');
    await wrapper.get('.qaBox .ghost').trigger('click');

    // Then
    expect(wrapper.find('.qaBox').exists()).toBe(false);
    expect(wrapper.get('.quickDone .cta').text()).toContain('이대로 책장에 꽂기');
    expect(wrapper.findAll('.quickDone .cta')).toHaveLength(1);
    expect(wrapper.get('.quickDone .ghost').text()).toBe('질문 하나 더');
    expect(wrapper.get('.quickDone .linkAction').text()).toBe('목차에서 질문과 답 고치기');

    // And one more question brings back the purpose choices
    await wrapper.get('.quickDone .ghost').trigger('click');
    expect(wrapper.findAll('.quickOption')).toHaveLength(3);
  });

  it('opens the shared contents editor from the quick completion action', async () => {
    const wrapper = await mountSolo();
    await wrapper.findAll('.modeOption')[0].trigger('click');
    await wrapper.findAll('.quickOption')[0].trigger('click');
    await wrapper.get('.qaBox textarea').setValue('목차에서 다시 볼 답');
    await wrapper.get('.qaBox .ghost').trigger('click');

    await wrapper.get('.quickDone .linkAction').trigger('click');

    expect(wrapper.find('.quickDone').exists()).toBe(false);
    expect(wrapper.getComponent({ name: 'RoundEditor' }).props('presentation')).toBe('standard');
    expect(wrapper.get('.contentsList').text()).toContain('목차에서 다시 볼 답');
  });

  it('publishes a Quick note with the first answered path title', async () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-18T03:00:00.000Z'));
    const wrapper = await mountSolo();
    await wrapper.findAll('.modeOption')[0].trigger('click');
    await wrapper.findAll('.quickOption')[2].trigger('click');
    await wrapper.get('.qaBox textarea').setValue('내일 가장 먼저 문을 연다.');
    await wrapper.get('.qaBox .ghost').trigger('click');

    // When
    await wrapper.get('.quickDone .cta').trigger('click');

    // Then
    const shelved = JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]') as Issue[];
    expect(shelved[0]?.title).toBe('다음 한 걸음 · 8월 18일');
  });

  it('keeps an explicit cover title ahead of a derived Quick title', async () => {
    // Given
    localStorage.setItem(
      SOLO_ISSUE_DRAFT_V2_KEY,
      JSON.stringify({
        ...draft(''),
        title: '내가 직접 지은 제목',
        rounds: [
          {
            asker: 'Mina',
            question: '오늘의 장면은?',
            answers: { Mina: { text: '늦은 햇빛' } },
            pathId: 'solo-today',
          },
        ],
        currentRound: { question: '', formatId: '', answers: {} },
        soloMode: 'quick',
        quickReady: true,
      } satisfies SoloIssueDraftV2),
    );
    const wrapper = await mountSolo();

    // When
    await wrapper.get('.quickDone .cta').trigger('click');

    // Then
    const shelved = JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]') as Issue[];
    expect(shelved[0]?.title).toBe('내가 직접 지은 제목');
  });

  it('rewards the last saved solo answer with trim-only full text', async () => {
    // Given: 복원된 Quick 초고에는 먼저 쓴 답, 가장 최근 답, 아직 저장하지 않은 현재 답이 함께 있다.
    const latestAnswer = `  마지막 문장에는\n\n중간 빈 줄도   그대로 있다.  `;
    localStorage.setItem(
      SOLO_ISSUE_DRAFT_V2_KEY,
      JSON.stringify({
        ...draft(''),
        rounds: [
          { asker: 'Mina', question: 'First?', answers: { Mina: { text: '첫 문장' } } },
          { asker: 'Mina', question: 'Latest?', answers: { Mina: { text: latestAnswer } } },
        ],
        currentRound: { question: '', formatId: '', answers: { Mina: '저장 전 문장' } },
        soloMode: 'quick',
        quickReady: true,
      } satisfies SoloIssueDraftV2),
    );

    // When
    const wrapper = await mountSolo();

    // Then: 가장 최근에 목차에 실린 답만 가장자리 공백을 걷어 전체 DOM/접근성 이름으로 남긴다.
    const quote = wrapper.get('blockquote.quickAnswer');
    const expected = latestAnswer.trim();
    expect(quote.element.textContent).toBe(expected);
    expect(quote.attributes('aria-label')).toBe(expected);
    expect(quote.text()).not.toContain('첫 문장');
    expect(quote.text()).not.toContain('저장 전 문장');
  });

  it('keeps a long quick answer complete in the DOM while the style clamps only its display', async () => {
    // Given
    const longAnswer = `${'한 문장을 오래 남기기 위해 '.repeat(32)}끝`;
    expect(longAnswer.length).toBeGreaterThanOrEqual(500);
    localStorage.setItem(
      SOLO_ISSUE_DRAFT_V2_KEY,
      JSON.stringify({
        ...draft(''),
        rounds: [{ asker: 'Mina', question: 'Long?', answers: { Mina: { text: longAnswer } } }],
        currentRound: { question: '', formatId: '', answers: {} },
        soloMode: 'quick',
        quickReady: true,
      } satisfies SoloIssueDraftV2),
    );

    // When
    const wrapper = await mountSolo();

    // Then
    const quote = wrapper.get('blockquote.quickAnswer');
    expect(wrapper.text()).toContain(longAnswer);
    expect(quote.element.textContent).toBe(longAnswer);
    expect(quote.classes()).toContain('quickAnswer');
  });

  it('omits the quick quote when legacy content has no answer from the solo participant', async () => {
    // Given: 다른 이름의 답만 남은 손상된 초고는 발행 가능 판정과 별개로 내 문장 보상을 만들 수 없다.
    localStorage.setItem(
      SOLO_ISSUE_DRAFT_V2_KEY,
      JSON.stringify({
        ...draft(''),
        rounds: [{ asker: 'Other', question: 'Broken?', answers: { Other: { text: '남의 답' } } }],
        currentRound: { question: '', formatId: '', answers: {} },
        soloMode: 'quick',
        quickReady: true,
      } satisfies SoloIssueDraftV2),
    );

    // When
    const wrapper = await mountSolo();

    // Then
    expect(wrapper.find('.quickDone').exists()).toBe(true);
    expect(wrapper.find('blockquote.quickAnswer').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('남의 답');
  });

  it('continues quick writing with saved rounds intact and restores the reward after refresh', async () => {
    // Given
    const first = await mountSolo();
    await first.findAll('.modeOption')[0].trigger('click');
    await first.findAll('.quickOption')[0].trigger('click');
    await first.get('.qaBox textarea').setValue('다시 보고 싶은 첫 문장');
    await first.get('.qaBox .ghost').trigger('click');
    expect(first.get('blockquote.quickAnswer').text()).toBe('다시 보고 싶은 첫 문장');

    // When: 질문을 하나 더 고르러 갔다가, 새 입력을 시작하기 전에 새로고침한다.
    await first.get('.quickDone .ghost').trigger('click');
    const kept = JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}') as SoloIssueDraftV2;
    expect(kept.rounds).toHaveLength(1);
    await first.findAll('.quickOption')[1].trigger('click');
    expect(first.get('.contentsList').text()).toContain('다시 보고 싶은 첫 문장');
    first.unmount();

    const restored = await mountSolo();
    expect(restored.get('.contentsList').text()).toContain('다시 보고 싶은 첫 문장');
  });

  it('keeps the quick reward visible when unified draft saving fails', async () => {
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
    await wrapper.findAll('.modeOption')[0].trigger('click');
    await wrapper.findAll('.quickOption')[0].trigger('click');
    await wrapper.get('.qaBox textarea').setValue('저장 실패에도 남아야 할 문장');

    // When
    await wrapper.get('.qaBox .ghost').trigger('click');

    // Then
    expect(wrapper.get('blockquote.quickAnswer').text()).toBe('저장 실패에도 남아야 할 문장');
    expect(wrapper.get('[role="alert"]').text()).toContain('임시 저장하지 못했어요');
    expect(wrapper.get('.quickDone .cta').text()).toBe('이대로 책장에 꽂기');
  });

  it('keeps the quick reward and retry actions when publishing to the shelf fails', async () => {
    // Given
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
    await wrapper.findAll('.modeOption')[0].trigger('click');
    await wrapper.findAll('.quickOption')[0].trigger('click');
    await wrapper.get('.qaBox textarea').setValue('책장 실패에도 남아야 할 문장');
    await wrapper.get('.qaBox .ghost').trigger('click');

    // When
    await wrapper.get('.quickDone .cta').trigger('click');

    // Then
    expect(wrapper.get('blockquote.quickAnswer').text()).toBe('책장 실패에도 남아야 할 문장');
    expect(wrapper.get('[role="alert"]').text()).toContain('저장 공간');
    expect(wrapper.get('.quickDone .cta').text()).toBe('이대로 책장에 꽂기');
    expect(wrapper.get('.quickDone .ghost').text()).toBe('질문 하나 더');
  });

  it('keeps question sets out of the quick flow, where the question already arrived', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    const wrapper = await mountSolo();

    // When
    await wrapper.findAll('.modeOption')[0].trigger('click');
    await wrapper.findAll('.quickOption')[0].trigger('click');

    // Then
    expect(wrapper.find('.disclosure').exists()).toBe(false);
    expect(wrapper.getComponent({ name: 'RoundEditor' }).props('presentation')).toBe('quick');
  });

  it('uses the standard editor presentation outside quick mode', async () => {
    // Given
    const wrapper = await mountSolo();

    // When
    await chooseFreeMode(wrapper);

    // Then
    expect(wrapper.getComponent({ name: 'RoundEditor' }).props('presentation')).toBe('standard');
    expect(wrapper.find('input[placeholder="지금의 나에게 묻고 싶은 것"]').exists()).toBe(true);
    expect(wrapper.find('.questionSources').exists()).toBe(true);
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-18T03:00:00.000Z'));
    const wrapper = await mountSolo();
    await openReviewLens(wrapper, '사진');
    await completeReviewItem(wrapper, '노을 사진', '색이 웃길 만큼 진해서 기억하고 싶다');

    // When
    await wrapper.get('.reviewFlow .cta').trigger('click');

    // Then
    const shelved = JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]') as Issue[];
    expect(shelved).toHaveLength(1);
    expect(shelved[0]?.title).toBe('사진 리뷰 · 8월 18일');
    expect(shelved[0]?.rounds).toHaveLength(1);
    // 질문은 렌즈의 고정 한 줄 — 장면 이름이 섞이지 않아야 내년에 같은 질문으로 묶인다.
    expect(shelved[0]?.rounds[0]?.question).toBe('사진 밖에서 함께 기억나는 것은 무엇인가요?');
    expect(shelved[0]?.rounds[0]?.answers['나']?.text).toBe('색이 웃길 만큼 진해서 기억하고 싶다');
    // format은 열람 화면 조판 ID라는 기존 계약이라 여기에 lens/scope를 실어 보내지 않는다.
    expect(shelved[0]?.rounds[0]?.format).toBeUndefined();
    expect((shelved[0]?.rounds[0] as Round & { review?: unknown })?.review).toEqual({
      lensId: 'photo',
      lensRevision: 1,
      scope: { type: 'recent' },
      subject: '노을 사진',
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-18T03:00:00.000Z'));
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
    expect(shelved[0]?.title).toBe('사진 외 1개 리뷰 · 8월 18일');
    expect(shelved[0]?.rounds).toHaveLength(2);
    expect(shelved[0]?.rounds.map((round) => round.question)).toEqual([
      '사진 밖에서 함께 기억나는 것은 무엇인가요?',
      '맛과 상황에서 무엇이 남았나요?',
    ]);
    // 두 렌즈가 한 호에 섞여도 각 줄은 자기 렌즈와 장면 이름을 review로 달고 간다.
    expect(
      shelved[0]?.rounds.map((round) => (round as Round & { review?: { subject?: string } }).review?.subject),
    ).toEqual(['산책 사진', '늦은 국수']);
    expect(shelved[0]?.rounds.map((round) => round.format)).toEqual([undefined, undefined]);
  });

  it.each([
    ['query', { presetQuestion: '가져온 질문?' }],
    ['import', { presetIssueId: 'source-1' }],
  ])('keeps the shared generic title for the %s entry route', async (_route, props) => {
    // Given: 경로 메타데이터가 있는 초고여도 ?q / ?from 진입은 free 편집기로 우회한다.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-18T03:00:00.000Z'));
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    localStorage.setItem(
      SOLO_ISSUE_DRAFT_V2_KEY,
      JSON.stringify({
        ...draft(''),
        title: '',
        rounds: [
          {
            asker: 'Mina',
            question: '기존 질문?',
            answers: { Mina: { text: '기존 답' } },
            pathId: 'solo-today',
          },
        ],
        currentRound: { question: '', formatId: '', answers: {} },
        soloMode: 'quick',
        quickReady: true,
      } satisfies SoloIssueDraftV2),
    );
    const wrapper = await mountSolo(props);

    // When
    await wrapper.get('button.cta').trigger('click');

    // Then
    const shelved = JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]') as Issue[];
    expect(shelved[0]?.title).toBe('2026 연말호');
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

    // Then — 저장이 막혀도 고를 렌즈는 그대로 있고, 무엇이 잘못됐는지 말해준다
    expect(wrapper.findAll('.lensOption')).toHaveLength(3);
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
    await wrapper.get('.sourcesToggle').trigger('click');
    await wrapper.findAll('.sourceRoute').find((route) => route.text() === '지난 호 질문')?.trigger('click');
    await wrapper.get('.pick').trigger('click');

    // Then
    const questionField = wrapper.get('input[placeholder="지금의 나에게 묻고 싶은 것"]');
    expect((questionField.element as HTMLInputElement).value).toBe('Source question?');
    expect(wrapper.find('.contentsList').exists()).toBe(false);
  });

  it('gathers every way of finding a question behind one button', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);

    // Then: 빈 화면에는 쓰는 칸과 문 하나뿐 — 같은 곳을 가리키는 링크가 겹치지 않고,
    // 문을 열기 전에는 어떤 패널도 펼쳐져 있지 않다.
    expect(wrapper.find('.startRoutes').exists()).toBe(false);
    expect(wrapper.find('.suggestOpen').exists()).toBe(false);
    expect(wrapper.find('.pickOpen').exists()).toBe(false);
    expect(wrapper.find('.panel').exists()).toBe(false);
    expect(wrapper.get('.sourcesToggle').text()).toBe('질문 고르기');

    // When
    await wrapper.get('.sourcesToggle').trigger('click');

    // Then
    expect(wrapper.findAll('.sourceRoute').map((route) => route.text())).toEqual([
      '추천 질문',
      '저장한 질문 세트',
      '지난 호 질문',
      '닫기',
    ]);
  });

  it('opens the set list under the editor when the writer asks for it', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    const wrapper = await mountSolo();
    await chooseFreeMode(wrapper);
    expect((wrapper.get('details.disclosure').element as HTMLDetailsElement).open).toBe(false);

    // When
    await wrapper.get('.sourcesToggle').trigger('click');
    await wrapper.findAll('.sourceRoute').find((route) => route.text() === '저장한 질문 세트')?.trigger('click');

    // Then
    expect((wrapper.get('details.disclosure').element as HTMLDetailsElement).open).toBe(true);
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
    await wrapper.find('input[placeholder="지금의 나에게 묻고 싶은 것"]').setValue('저장이 막힌 질문?');
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
