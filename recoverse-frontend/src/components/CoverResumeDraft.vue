<template>
  <button v-if="summary.resumable" class="resumeCard" type="button" @click="$emit('resume')">
    <span class="eyebrow red">이어서 쓰기</span>
    <span class="resumeTitle">{{ titleText }}</span>
    <span class="resumeMeta">{{ metaText }} →</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { KIND_LABELS } from '@recoverse/shared';
import type { SoloIssueDraftSummary } from '../composables/useSoloIssueDraft';

const props = defineProps<{ readonly summary: SoloIssueDraftSummary }>();
defineEmits<{ resume: [] }>();

/**
 * 표지 제목 → 쓰던 질문 → 종류 순으로 부른다. "자유 쓰는 중"은 종류 이름일 뿐이라
 * 어떤 초고인지 알려주지 못한다. 쓰던 질문이 있으면 그게 가장 알아보기 쉽다.
 */
const titleText = computed(
  () => props.summary.title || props.summary.leadQuestion || `${KIND_LABELS[props.summary.kind]} 쓰는 중`,
);

const progressText = computed(() => {
  const { savedRoundCount, answeredRoundCount, hasPendingQuestion } = props.summary;
  // 답을 쓴 질문만 "실었다"고 한다. 답 없이 담아둔 질문은 아직 기다리는 중이다.
  if (answeredRoundCount > 0) return `질문 ${answeredRoundCount}개 실었어요`;
  if (savedRoundCount > 0) return `질문 ${savedRoundCount}개 답 기다리는 중`;
  if (hasPendingQuestion) return '질문을 쓰는 중';
  return '막 시작했어요';
});

// 가운뎃점은 한 줄에 하나까지. 종류는 제목이 이미 말하거나 몰라도 되는 정보다.
const metaText = computed(() => {
  const when = relativeTime(props.summary.updatedAt);
  return when ? `${progressText.value} · ${when}` : progressText.value;
});

/** 이어쓰기 카드의 "언제 저장했는지"를 가볍게 표시. 잘못된 값은 조용히 생략한다. */
function relativeTime(iso: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const date = new Date(then);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
</script>

<style scoped>
.resumeCard {
  width: 100%;
  display: grid;
  gap: 5px;
  text-align: left;
  padding: 14px;
  margin-bottom: 20px;
  border: 1px solid var(--ink);
  border-left: 3px solid var(--vermilion);
  background: var(--paper-card);
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.resumeCard:hover {
  box-shadow: inset 0 -3px 0 var(--vermilion);
}

.resumeTitle {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
}

.resumeMeta {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--dim);
}

@media (min-width: 1024px) {
  .resumeCard {
    margin-bottom: 0;
    padding: clamp(10px, 1.6vh, 14px) 14px;
  }
  .resumeTitle {
    font-size: clamp(15px, 1.9vh, 18px);
  }
}
</style>
