<template>
  <section v-if="reflection" class="detailPage">
    <header class="detailHeader">
      <div>
        <span class="eyebrow">{{ reflection.isCompleted ? "이 시기의 나" : "이어쓰는 기억" }}</span>
        <h1>{{ reflection.title }}</h1>
        <div class="detailMeta" aria-label="회고 상태">
          <span>{{ answeredCount }}개 답변</span>
          <span aria-hidden="true">·</span>
          <span>{{ updatedDate }} 수정</span>
          <span v-if="!reflection.isCompleted" aria-hidden="true">·</span>
          <span v-if="!reflection.isCompleted">진행률 {{ reflection.completionRate }}%</span>
        </div>
      </div>
    </header>

    <main class="detailShell">
      <section class="heroPanel">
        <span class="heroLabel">{{ reflection.period.label }}</span>
        <h2>{{ representativeScene }}</h2>
        <p>{{ representativeEmotion }}</p>
      </section>

      <section class="actionPanel" aria-label="회고 주요 행동">
        <button
          v-if="reflection.isCompleted"
          class="primaryAction"
          type="button"
          @click="$emit('review-again')"
        >
          같은 질문 다시 보기
        </button>
        <button
          v-else
          class="primaryAction"
          type="button"
          @click="$emit('edit')"
        >
          이어쓰기
        </button>
        <button
          class="secondaryAction"
          type="button"
          :disabled="shareableItems.length === 0"
          @click="openShareOptions"
        >
          공유하기
        </button>
        <button v-if="reflection.isCompleted" class="tertiaryAction" type="button" @click="$emit('edit')">
          답변 수정
        </button>
      </section>

      <section v-if="shareableItems.length > 0" class="sharePanel">
        <details ref="shareDetailsRef">
          <summary>공유할 답변 고르기</summary>
          <p>친구에게 보여줘도 괜찮은 질문만 고르면 수정할 수 없는 읽기 전용 화면이 만들어집니다.</p>
          <div class="shareList">
            <label v-for="item in shareableItems" :key="item.question.id" class="shareOption">
              <input v-model="shareSelection" type="checkbox" :value="item.question.id" />
              <span>{{ item.question.text }}</span>
            </label>
          </div>
          <button
            class="shareButton"
            type="button"
            :disabled="shareSelection.length === 0"
            @click="$emit('share', shareSelection)"
          >
            읽기 전용 링크 만들기
          </button>
        </details>
      </section>

      <section class="answerList" aria-label="질문과 답변">
        <article
          v-for="item in answerItems"
          :key="item.question.id"
          class="answerCard"
          :class="{ empty: !item.answerText }"
        >
          <span>{{ item.groupLabel }}</span>
          <h3>{{ item.question.text }}</h3>
          <p v-if="item.answerText">{{ item.answerText }}</p>
          <p v-else-if="item.answer?.skipped">이 질문은 지금은 넘겼어요.</p>
          <p v-else>아직 비어 있는 질문이에요. 필요하면 이어쓰기에서 천천히 채울 수 있어요.</p>
        </article>
      </section>
    </main>
  </section>

  <section v-else class="detailPage emptyState">
    <span class="eyebrow">회고 열람</span>
    <h1>열어볼 기억을 찾지 못했어요.</h1>
    <p>홈으로 돌아가면 오늘 다시 떠오른 기억을 보거나 새 기억을 시작할 수 있어요.</p>
    <button class="primaryAction" type="button" @click="$emit('back-home')">홈으로 돌아가기</button>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Answer, Question, Reflection } from "../types/reflection";

const props = defineProps<{
  reflection: Reflection | null;
}>();

defineEmits<{
  "back-home": [];
  edit: [];
  "review-again": [];
  share: [questionIds: string[]];
}>();

const shareSelection = ref<string[]>([]);
const shareDetailsRef = ref<HTMLDetailsElement | null>(null);

const questions = computed<Question[]>(() =>
  props.reflection?.questionGroups.flatMap((group) => group.questions) ?? []
);
const answerMap = computed(() => new Map(props.reflection?.answers.map((answer) => [answer.questionId, answer]) ?? []));
const answeredCount = computed(() =>
  props.reflection?.answers.filter((answer) => answer.value.trim().length > 0).length ?? 0
);
const firstAnsweredText = computed(() =>
  props.reflection?.answers.find((answer) => answer.value.trim())?.value.trim() ?? ""
);
const representativeScene = computed(() => {
  if (!props.reflection) return "";
  return props.reflection.representativeSentence ?? (firstAnsweredText.value || "아직 대표 장면이 없어요.");
});
const representativeEmotion = computed(() => {
  const emotionQuestion = questions.value.find((question) => question.text.includes("감정"));
  const emotionAnswer = emotionQuestion
    ? answerMap.value.get(emotionQuestion.id)?.value.trim()
    : "";
  if (emotionAnswer) return `가장 가까운 감정: ${emotionAnswer}`;
  return answeredCount.value > 0
    ? "지금은 답변 전체를 천천히 읽어보는 화면입니다."
    : "첫 답변을 남기면 이곳에 기억의 요약이 생깁니다.";
});
const updatedDate = computed(() => {
  if (!props.reflection) return "";
  return new Date(props.reflection.updatedAt).toLocaleDateString("ko-KR");
});
const answerItems = computed(() => {
  if (!props.reflection) return [];

  return props.reflection.questionGroups.flatMap((group) =>
    group.questions.map((question) => {
      const answer = answerMap.value.get(question.id) as Answer | undefined;
      return {
        groupLabel: group.label,
        question,
        answer,
        answerText: answer?.value.trim() ?? "",
      };
    })
  );
});
const shareableItems = computed(() =>
  answerItems.value.filter(
    (item) => item.question.visibility === "public" && item.answerText.trim().length > 0
  )
);

watch(
  () => props.reflection?.id,
  () => {
    shareSelection.value = shareableItems.value.map((item) => item.question.id);
  },
  { immediate: true }
);

function openShareOptions() {
  if (!shareDetailsRef.value) return;
  shareDetailsRef.value.open = true;
  shareDetailsRef.value.scrollIntoView({ block: "center", behavior: "smooth" });
}
</script>

<style scoped>
.detailPage {
  min-height: 100vh;
  background: var(--surface-base);
  color: var(--text-primary);
  padding: 24px var(--space-page-x) calc(112px + env(safe-area-inset-bottom));
}

.detailHeader,
.detailShell { width: min(940px, 100%); margin: 0 auto; }
.detailHeader { margin-bottom: 22px; }
h1, h2, h3, p { margin: 0; letter-spacing: 0; }

.detailHeader h1 {
  font-family: var(--font-display);
  font-size: clamp(28px, 5.4vw, 42px);
  line-height: var(--leading-tight);
  font-weight: var(--display-weight);
}

.detailMeta { margin-top: 7px; display: flex; flex-wrap: wrap; gap: 6px; color: var(--text-secondary); font-size: 12px; font-weight: var(--label-weight); }
.eyebrow, .heroLabel, .answerCard span { color: var(--accent-sage); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
.detailShell { display: grid; gap: 14px; }

.heroPanel,
.answerCard,
.actionPanel,
.sharePanel {
  border: 1px solid var(--border-subtle);
  background: rgba(255, 253, 248, 0.86);
  border-radius: var(--radius-card);
  box-shadow: 0 14px 32px rgba(58, 49, 43, 0.08);
}

.heroPanel { padding: clamp(22px, 4vw, 30px); display: grid; gap: 10px; background: linear-gradient(145deg, rgba(255,253,248,0.96), rgba(239,230,214,0.62)); }
.heroPanel h2 { font-family: var(--font-display); font-size: clamp(28px, 6vw, 42px); line-height: var(--leading-display); font-weight: var(--display-weight); overflow-wrap: anywhere; }
.heroPanel p, .answerCard p, .sharePanel p { color: var(--text-secondary); line-height: var(--leading-body); }

.actionPanel { padding: 12px; display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 10px; }
.primaryAction, .secondaryAction, .tertiaryAction, .shareButton { border-radius: var(--radius-pill); font-weight: var(--heading-weight); letter-spacing: 0; padding: 11px 14px; }
.primaryAction { border: 0; background: var(--accent-espresso); color: var(--surface-paper); }
.secondaryAction, .shareButton { border: 1px solid var(--border-strong); background: transparent; color: var(--text-primary); }
.secondaryAction:hover:not(:disabled), .secondaryAction:focus-visible, .shareButton:hover:not(:disabled), .shareButton:focus-visible { border-color: var(--accent-sage); background: rgba(111, 127, 107, 0.08); }
.tertiaryAction { border: 0; background: transparent; color: var(--text-secondary); padding: 9px 12px; font-size: 12px; text-decoration: underline; text-underline-offset: 4px; }
.tertiaryAction:hover:not(:disabled), .tertiaryAction:focus-visible { color: var(--text-primary); }
.secondaryAction:disabled, .tertiaryAction:disabled { opacity: 0.45; }

.sharePanel { padding: 16px; }
.sharePanel summary { cursor: pointer; font-weight: var(--heading-weight); }
.shareList, .answerList { display: grid; gap: 10px; }
.shareList { margin: 12px 0; }
.shareOption { border: 1px solid var(--border-subtle); border-radius: var(--radius-card); background: rgba(251, 244, 236, 0.56); padding: 10px; display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: start; }
.answerCard { padding: 18px; display: grid; gap: 8px; }
.answerCard h3 { font-size: 17px; line-height: var(--leading-tight); font-weight: var(--heading-weight); }
.answerCard.empty { border-style: dashed; }
.emptyState { display: grid; place-items: center; align-content: center; gap: 14px; text-align: center; }
.emptyState p { max-width: 380px; color: var(--text-secondary); line-height: 1.6; }

@media (max-width: 720px) {
  .detailPage { padding: 16px 16px calc(108px + env(safe-area-inset-bottom)); }
  .actionPanel { grid-template-columns: 1fr; }
  .heroPanel h2 { font-size: 26px; }
}
</style>
