<template>
  <section ref="root" class="askAgain" aria-labelledby="askAgainTitle">
    <span class="eyebrow red">다음 호를 위해</span>
    <h2 id="askAgainTitle" ref="titleEl" tabindex="-1">이 질문, 내년에도 물어볼까요?</h2>
    <p class="askLead">담아둔 질문은 다음에 쓰기를 열면 맨 위에 놓여 있어요.</p>

    <ul class="askList">
      <li v-for="question in questions" :key="question">
        <label class="askRow" :class="{ off: !picked.has(question) }">
          <input
            type="checkbox"
            :checked="picked.has(question)"
            @change="toggle(question)"
          />
          <span class="askQuestion">{{ question }}</span>
        </label>
      </li>
    </ul>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div class="askActions">
      <button type="button" class="cta" :disabled="picked.size === 0" @click="keep">
        {{ picked.size }}개 담고 책장으로
      </button>
      <button type="button" class="linkBtn" @click="$emit('skip')">담지 않고 책장으로</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuestionSets } from '../../composables/useQuestionSets';

/**
 * 발행 직후 딱 한 번 묻는다. 이 앱에는 반복이라는 개념이 없어서, 같은 질문을 다시 만나려면
 * 사람이 기억해서 찾아와야 했다 — 기억하는 일을 앱이 맡는 유일한 자리다.
 *
 * 알림도 계정도 서버도 쓰지 않는다. 고른 질문은 기존 질문 세트 하나에 담길 뿐이고,
 * 다음에 쓰기를 열 때 거기 놓여 있는 것으로 약속을 지킨다.
 */
const props = defineProps<{ readonly questions: readonly string[] }>();
const emit = defineEmits<{ kept: [readonly string[]]; skip: [] }>();

const questionSets = useQuestionSets();
const titleEl = ref<HTMLHeadingElement | null>(null);
const error = ref('');

// 기본은 전부 담김. 방금 쓴 사람에게 "지울 것 고르기"가 "담을 것 고르기"보다 쉽고,
// 무엇을 담는지는 버튼의 개수로 늘 보인다 — 모르는 새 쌓이지 않게.
const picked = ref(new Set(props.questions));

onMounted(() => titleEl.value?.focus({ preventScroll: true }));

function toggle(question: string): void {
  const next = new Set(picked.value);
  if (!next.delete(question)) next.add(question);
  picked.value = next;
}

function keep(): void {
  const chosen = props.questions.filter((question) => picked.value.has(question));
  if (chosen.length === 0) return;
  if (!questionSets.keepForNextTime(chosen)) {
    error.value = '다시 물을 질문으로 담지 못했어요. 브라우저 저장 공간을 비우고 다시 시도해주세요.';
    return;
  }
  emit('kept', chosen);
}
</script>

<style scoped>
.askAgain {
  display: grid;
  gap: 10px;
  margin: 6px 0 8px;
}

.askAgain h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 25px;
  line-height: 1.45;
  text-wrap: balance;
}

.askAgain h2:focus-visible {
  outline: 2px solid var(--vermilion);
  outline-offset: 4px;
}

.askLead {
  max-width: 40rem;
  margin: 0 0 4px;
  color: var(--dim);
  font-size: 14px;
  line-height: 1.65;
}

.askList {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  border-top: 1px solid var(--ink);
}

.askRow {
  display: flex;
  align-items: start;
  gap: 11px;
  min-height: 52px;
  padding: 13px 12px;
  background: var(--paper-card);
  border-bottom: 1px solid var(--ink);
  cursor: pointer;
}

.askRow input {
  flex: none;
  width: 19px;
  height: 19px;
  margin: 1px 0 0;
  accent-color: var(--vermilion);
}

.askQuestion {
  min-width: 0;
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

/* 뺀 줄은 지워지지 않고 물러난다 — 마음이 바뀌면 다시 누를 수 있게 자리에 남긴다. */
.askRow.off .askQuestion {
  color: var(--dim);
}

.askActions {
  display: grid;
  justify-items: start;
  gap: 12px;
  margin-top: 4px;
}

.linkBtn {
  justify-self: start;
  min-height: 44px;
  padding: 8px 0;
  background: none;
  border: none;
  color: var(--dim-strong);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.linkBtn:hover {
  color: var(--vermilion);
}
</style>
