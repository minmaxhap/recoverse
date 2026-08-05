<template>
  <section ref="flowRoot" class="reviewFlow">
    <!-- 단계 이동만 한 번 읽어준다. 섹션 전체를 live region으로 두면 타이핑까지 다시 낭독된다. -->
    <p class="srOnly" role="status">{{ stepAnnouncement }}</p>

    <button type="button" class="backChoice" @click="goBack">
      ← {{ draft.phase === 'lens' || draft.phase === 'complete' ? '시작 방식 다시 고르기' : '이전 단계' }}
    </button>

    <template v-if="draft.phase === 'lens'">
      <span class="eyebrow red">REVIEW LENS</span>
      <h2 id="lensTitle" ref="flowTitle" tabindex="-1">무엇을 펼쳐볼까요?</h2>
      <p class="reviewLead">한꺼번에 고르지 않아도 돼요. 지금 눈에 걸리는 대상 하나만 선택하세요.</p>
      <div class="lensCatalog" aria-labelledby="lensTitle">
        <button v-for="lens in REVIEW_LENSES" :key="lens.id" type="button" class="lensOption" @click="selectLens(lens.id)">
          <b>{{ lens.title }}</b><small>{{ lens.promise }}</small>
        </button>
      </div>
    </template>

    <template v-else-if="draft.phase === 'context' && selectedLens">
      <span class="eyebrow red">{{ selectedLens.title }} REVIEW</span>
      <h2 ref="flowTitle" tabindex="-1">어느 장면을 살펴볼까요?</h2>
      <p class="reviewLead">범위는 렌즈와 별개예요. 정하기 어렵다면 ‘요즘’ 그대로 시작하세요.</p>
      <!-- 하나만 고르는 자리이므로 toggle(aria-pressed)이 아니라 radio 의미를 쓴다. -->
      <div class="scopeList" role="radiogroup" aria-label="리뷰 범위">
        <button
          v-for="scope in REVIEW_SCOPES"
          :key="scope.id"
          type="button"
          role="radio"
          class="scopeOption"
          :class="{ active: draft.scopeType === scope.id }"
          :aria-checked="draft.scopeType === scope.id"
          @click="setScope(scope.id)"
        >{{ scope.label }}</button>
      </div>
      <label v-if="draft.scopeType === 'custom'" class="fieldGroup">
        <span class="fieldLabel">직접 정한 범위</span>
        <input class="field" :value="draft.scopeLabel" placeholder="예: 포항 여행, 티셔츠 제작 프로젝트" @input="setScopeLabel" />
      </label>
      <aside class="sourceGuide">
        <span class="eyebrow">SOURCE GUIDE</span>
        <p>{{ selectedLens.sourceHints[0] }}</p>
        <small>Recoverse가 자료를 자동으로 읽거나 가져오지는 않아요.</small>
      </aside>
      <button type="button" class="cta" :disabled="!scopeReady" @click="openItems">살펴볼 장면 고르기</button>
    </template>

    <template v-else-if="draft.phase === 'items' && selectedLens">
      <span class="eyebrow red">{{ selectedLens.title }} · {{ scopeName }}</span>
      <h2 ref="flowTitle" tabindex="-1">기억할 장면을 1~3개 남겨요</h2>
      <p class="reviewLead">교훈이나 결론은 없어도 괜찮아요. 맛있어서, 웃겨서, 그냥 기억하고 싶어서도 충분해요.</p>
      <div class="reviewItems">
        <fieldset v-for="(item, index) in draft.items" :key="item.id" class="reviewItem">
          <legend>{{ String(index + 1).padStart(2, '0') }}</legend>
          <label class="fieldGroup">
            <span class="fieldLabel">{{ selectedLens.selectionPrompt }}</span>
            <input class="field itemLabel" :value="item.label" placeholder="짧은 이름이나 장면" @input="updateItem(index, 'label', $event)" />
          </label>
          <label class="fieldGroup">
            <span class="fieldLabel">{{ selectedLens.reflectionPrompt }}</span>
            <textarea class="field area short itemNote" :value="item.note" placeholder="한 줄이어도 충분해요" @input="updateItem(index, 'note', $event)" />
          </label>
          <button v-if="draft.items.length > 1" type="button" class="removeItem" @click="removeItem(index)">이 장면 빼기</button>
        </fieldset>
      </div>
      <button v-if="draft.items.length < 3" type="button" class="addItem" @click="addItem">＋ 장면 하나 더</button>
      <p class="fineprint">{{ itemHint }}</p>
      <button type="button" class="cta" :disabled="completedItemCount === 0" @click="completeLens">이 렌즈 마치기</button>
    </template>

    <template v-else-if="draft.phase === 'complete' && selectedLens">
      <span class="eyebrow red">LENS COMPLETE</span>
      <h2 ref="flowTitle" tabindex="-1">{{ selectedLens.title }} 리뷰를 목차에 실었어요</h2>
      <p class="reviewLead">이 한 렌즈만으로 발행해도 되고, 다른 대상을 한 묶음 더 살펴봐도 돼요.</p>
      <div class="completeActions">
        <button type="button" class="cta" @click="$emit('publish')">이대로 책장에 꽂기</button>
        <button type="button" class="ghost" @click="addLens">다른 렌즈 추가하기</button>
        <button type="button" class="editContents" @click="$emit('edit')">목차에서 질문과 답 고치기</button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { ReviewContext } from '@recoverse/shared';
import {
  createEmptyReviewDraft,
  REVIEW_LENSES,
  REVIEW_SCOPES,
  scopeDisplayName,
  type ReviewDraft,
  type ReviewLensId,
  type ReviewScopeType,
} from './reviewContent';

/**
 * 발행되는 것은 평범한 질문/답 한 줄이다.
 * 렌즈·범위를 `Round.format`에 실어 보내지 않는다 — format은 열람 화면의 조판 ID라는
 * 별도 계약이고, 여기에 다른 뜻을 끼워 넣으면 export/import 계약이 조용히 바뀐다.
 * 기계가 읽는 lens/scope 보존은 shared `Round.review?`(T1.1/T1.3)가 생긴 뒤에 얹는다.
 */
export type ReviewRoundInput = {
  readonly question: string;
  readonly answer: string;
  readonly review: ReviewContext;
};

const props = defineProps<{ readonly draft: ReviewDraft }>();
const emit = defineEmits<{
  back: [];
  edit: [];
  publish: [];
  complete: [readonly ReviewRoundInput[]];
  'update:draft': [ReviewDraft];
}>();

const flowRoot = ref<HTMLElement | null>(null);
const flowTitle = ref<HTMLHeadingElement | null>(null);

const selectedLens = computed(() => REVIEW_LENSES.find((lens) => lens.id === props.draft.lensId));
const scopeName = computed(() => scopeDisplayName(props.draft.scopeType, props.draft.scopeLabel));
const scopeReady = computed(() => props.draft.scopeType !== 'custom' || props.draft.scopeLabel.trim().length > 0);
const completedItemCount = computed(() => props.draft.items.filter((item) => item.label.trim() && item.note.trim()).length);
const itemHint = computed(() =>
  completedItemCount.value === 0
    ? '장면 이름과 한 줄만 적으면 목차에 실려요. 교훈이나 다음 행동은 없어도 돼요.'
    : `${completedItemCount.value}개 장면을 실을 수 있어요.`,
);

/** 단계 이동을 스크린리더에 한 번만 알린다. 순서는 렌즈 → 범위 → 장면 → 완료. */
const stepAnnouncement = computed(() => {
  switch (props.draft.phase) {
    case 'lens':
      return '1단계 · 렌즈 고르기';
    case 'context':
      return `2단계 · 범위와 자료 안내${selectedLens.value ? ` · ${selectedLens.value.title}` : ''}`;
    case 'items':
      return `3단계 · 장면 1~3개 적기 · ${scopeName.value}`;
    case 'complete':
      return '4단계 · 이 렌즈를 마쳤어요';
  }
  return '';
});

watch(
  () => props.draft.phase,
  async () => {
    await nextTick();
    flowRoot.value?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    flowTitle.value?.focus({ preventScroll: true });
  },
);

// 모드를 고르고 이 화면이 처음 열릴 때도 키보드 포커스를 데려온다 — 안 그러면 body로 떨어져
// 탭 순서가 화면 맨 처음부터 다시 시작된다.
onMounted(() => flowTitle.value?.focus({ preventScroll: true }));

function eventValue(event: Event): string {
  return event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement ? event.target.value : '';
}

function updateDraft(next: ReviewDraft): void {
  emit('update:draft', next);
}

function selectLens(lensId: ReviewLensId): void {
  updateDraft({ ...props.draft, phase: 'context', lensId, scopeType: 'recent', scopeLabel: '' });
}

function setScope(scopeType: ReviewScopeType): void {
  updateDraft({ ...props.draft, scopeType, scopeLabel: scopeType === 'custom' ? props.draft.scopeLabel : '' });
}

function setScopeLabel(event: Event): void {
  updateDraft({ ...props.draft, scopeLabel: eventValue(event) });
}

function openItems(): void {
  if (!scopeReady.value) return;
  updateDraft({ ...props.draft, phase: 'items' });
}

function updateItem(index: number, field: 'label' | 'note', event: Event): void {
  const item = props.draft.items[index];
  if (!item) return;
  const items = props.draft.items.map((candidate, itemIndex) =>
    itemIndex === index ? { ...candidate, [field]: eventValue(event) } : candidate,
  );
  updateDraft({ ...props.draft, items });
}

function addItem(): void {
  if (props.draft.items.length >= 3) return;
  updateDraft({
    ...props.draft,
    items: [...props.draft.items, { id: crypto.randomUUID(), label: '', note: '' }],
  });
}

function removeItem(index: number): void {
  if (props.draft.items.length <= 1) return;
  updateDraft({ ...props.draft, items: props.draft.items.filter((_, itemIndex) => itemIndex !== index) });
}

function completeLens(): void {
  const lens = selectedLens.value;
  if (!lens) return;
  const completed = props.draft.items.filter((item) => item.label.trim() && item.note.trim());
  if (completed.length === 0) return;
  const rounds = completed.map((item) => ({
    question: `${scopeName.value} ${lens.title} · ${item.label.trim()} — ${lens.reflectionPrompt}`,
    answer: item.note.trim(),
    review: {
      lensId: lens.id,
      lensRevision: lens.revision,
      scope: {
        type: props.draft.scopeType,
        ...(props.draft.scopeType === 'custom' && props.draft.scopeLabel.trim()
          ? { label: props.draft.scopeLabel.trim() }
          : {}),
      },
    },
  }));
  updateDraft({ ...props.draft, phase: 'complete', items: completed });
  emit('complete', rounds);
}

function addLens(): void {
  updateDraft(createEmptyReviewDraft());
}

function goBack(): void {
  switch (props.draft.phase) {
    case 'lens':
      emit('back');
      return;
    case 'context':
      updateDraft({ ...props.draft, phase: 'lens', lensId: '' });
      return;
    case 'items':
      updateDraft({ ...props.draft, phase: 'context' });
      return;
    case 'complete':
      // 마친 렌즈는 이미 목차에 실렸으므로 되돌릴 단계가 없다 — 시작 방식 화면으로 내보낸다.
      emit('back');
      return;
  }
}
</script>

<style scoped>
.reviewFlow { min-width: 0; display: grid; gap: 12px; }
.reviewFlow h2 { margin: 0; font-family: var(--font-display); font-size: 25px; line-height: 1.45; text-wrap: balance; }
.reviewLead { max-width: 40rem; margin: 0 0 6px; color: var(--dim); font-size: 14px; line-height: 1.65; }
.backChoice { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--dim); font-weight: 700; cursor: pointer; }
.backChoice:hover { color: var(--vermilion); }
.lensCatalog { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--ink); border-left: 1px solid var(--ink); }
.lensOption { min-width: 0; min-height: 94px; display: grid; align-content: start; gap: 5px; padding: 13px; text-align: left; background: var(--paper-card); border: 0; border-right: 1px solid var(--ink); border-bottom: 1px solid var(--ink); color: inherit; cursor: pointer; }
.lensOption:hover, .lensOption:focus-visible { background: var(--ink); color: var(--paper); }
.lensOption b { font-family: var(--font-display); font-size: 17px; }
.lensOption small { color: var(--dim); font-size: 12px; line-height: 1.5; }
.lensOption:hover small, .lensOption:focus-visible small { color: var(--on-ink-dim); }
.scopeList { display: flex; flex-wrap: wrap; gap: 7px; }
.scopeOption { min-height: 44px; padding: 9px 13px; background: var(--paper-card); border: 1px solid var(--ink); color: inherit; font-weight: 700; cursor: pointer; }
.scopeOption.active { background: var(--ink); color: var(--paper); }
.sourceGuide { display: grid; gap: 6px; padding: 14px; border-left: 3px solid var(--vermilion); background: var(--paper-card); }
.sourceGuide p, .sourceGuide small { margin: 0; line-height: 1.6; }
.sourceGuide p { font-family: var(--font-display); font-size: 16px; }
.sourceGuide small { color: var(--dim); font-size: 12px; }
.reviewItems { display: grid; gap: 12px; }
.reviewItem { min-width: 0; display: grid; gap: 12px; margin: 0; padding: 14px; border: 1px solid var(--ink); background: var(--paper-card); }
.reviewItem legend { padding: 0 6px; color: var(--vermilion); font-family: var(--font-display); font-weight: 700; }
.removeItem, .addItem, .editContents { min-height: 44px; justify-self: start; padding: 8px 0; background: none; border: 0; color: var(--dim); font-weight: 700; text-decoration: underline; cursor: pointer; }
.removeItem:hover, .addItem:hover, .editContents:hover { color: var(--vermilion); }
.completeActions { display: grid; gap: 9px; margin-top: 8px; }
@media (min-width: 768px) { .lensCatalog { grid-template-columns: repeat(3, minmax(0, 1fr)); } .reviewItems { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .lensCatalog { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
</style>
