<template>
  <button v-if="summary.resumable" class="resumeCard" type="button" @click="$emit('resume')">
    <span class="eyebrow red">이어서 엮기</span>
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

const titleText = computed(() => props.summary.title || `${KIND_LABELS[props.summary.kind]} 쓰는 중`);

const progressText = computed(() => {
  const { savedRoundCount, hasPendingQuestion } = props.summary;
  if (savedRoundCount > 0) return `질문 ${savedRoundCount}개 실었어요`;
  if (hasPendingQuestion) return '질문을 쓰는 중';
  return '막 시작했어요';
});

const metaText = computed(() => {
  const parts = [KIND_LABELS[props.summary.kind], progressText.value];
  const when = relativeTime(props.summary.updatedAt);
  if (when) parts.push(when);
  return parts.join(' · ');
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
