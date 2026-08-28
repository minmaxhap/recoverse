<template>
  <div v-if="summary.resumable" class="resumeSlot">
    <button class="resumeCard" type="button" @click="$emit('resume')">
      <span class="eyebrow red">이어서 쓰기</span>
      <span class="resumeTitle">{{ titleText }}</span>
      <span class="resumeMeta">{{ metaText }} →</span>
    </button>

    <!-- 초고는 하나뿐이라, 마음에 안 드는 것을 버리지 못하면 질문을 손으로 지워야 했다.
         묻는 자리를 카드 밖에 두는 이유는 이어 쓰려던 손이 버리기를 스치지 않게 하기 위해서다. -->
    <p v-if="error" class="resumeError" role="alert">{{ error }}</p>
    <div v-else-if="confirming" class="discardConfirm" role="group" aria-label="초고 버리기 확인">
      <span>쓰던 초고를 버릴까요?</span>
      <button type="button" class="discardYes" @click="$emit('discard')">버리기</button>
      <button type="button" class="discardNo" @click="confirming = false">그대로 두기</button>
    </div>
    <button v-else type="button" class="discardLink" @click="confirming = true">새로 시작</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { KIND_LABELS } from '@recoverse/shared';
import type { SoloIssueDraftSummary } from '../composables/useSoloIssueDraft';

const props = withDefaults(
  defineProps<{ readonly summary: SoloIssueDraftSummary; readonly error?: string }>(),
  { error: '' },
);
defineEmits<{ resume: []; discard: [] }>();

const confirming = ref(false);

// 버려졌든 다른 초고로 갈렸든, 카드가 달라지면 묻던 상태는 남지 않는다.
watch(() => props.summary.updatedAt, () => { confirming.value = false; });

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
.resumeSlot {
  display: grid;
  justify-items: start;
  gap: 6px;
  margin-bottom: 20px;
}

.resumeCard {
  width: 100%;
  display: grid;
  gap: 5px;
  text-align: left;
  padding: 14px;
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

.discardLink,
.discardNo {
  min-height: 44px;
  padding: 8px 0;
  background: none;
  border: 0;
  color: var(--dim-strong);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.discardLink:hover,
.discardNo:hover {
  color: var(--vermilion);
}

.discardConfirm {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--dim-strong);
}

.discardYes {
  min-height: 44px;
  padding: 8px 13px;
  background: var(--paper-card);
  border: 1px solid var(--vermilion);
  color: var(--vermilion);
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.discardYes:hover {
  background: var(--vermilion);
  color: var(--vermilion-ink);
}

.resumeError {
  margin: 0;
  color: var(--vermilion);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
}

@media (min-width: 1024px) {
  .resumeSlot {
    margin-bottom: 0;
  }
  .resumeCard {
    padding: clamp(10px, 1.6vh, 14px) 14px;
  }
  .resumeTitle {
    font-size: clamp(15px, 1.9vh, 18px);
  }
}
</style>
