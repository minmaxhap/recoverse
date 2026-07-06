<template>
  <section class="deliverySection" aria-label="다시 발견하기">
    <!-- 도착한 편지 -->
    <button
      v-if="arrivalReflectionId"
      class="arrivalCard"
      type="button"
      @click="$emit('open-arrival', arrivalReflectionId)"
    >
      <IconBadge icon="envelope" tint="white" />
      <span class="arrivalBody">
        <span class="arrivalCaption">과거의 내가 보낸 편지</span>
        <strong>{{ arrivalWindowLabel ?? "예전" }} 남긴 회고가 도착했어요</strong>
        <span v-if="arrivalPreview" class="arrivalPreview">{{ arrivalPreview }}</span>
      </span>
      <svg class="arrivalChevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m6 3.5 4.5 4.5L6 12.5" />
      </svg>
    </button>

    <!-- 기록은 있지만 아직 도착한 편지가 없을 때 -->
    <p v-else-if="hasReflections" class="quietNote">
      아직 도착한 편지가 없어요 · 시간이 지나면 여기로 배달돼요
    </p>

    <!-- 첫 방문: 서비스 흐름 설명 -->
    <article v-else class="explainCard paperPanel">
      <h2>Recoverse는 이렇게 흘러가요</h2>
      <ol class="explainSteps">
        <li>
          <span class="stepNum">1</span>
          <div>
            <strong>30초 작성</strong>
            <p>질문 하나에 짧게 답해요.</p>
          </div>
        </li>
        <li>
          <span class="stepNum">2</span>
          <div>
            <strong>조용히 보관</strong>
            <p>답변은 이 기기에만 저장돼요.</p>
          </div>
        </li>
        <li>
          <span class="stepNum">3</span>
          <div>
            <strong>미래에 도착</strong>
            <p>시간이 지나면 과거의 답변이 다시 찾아와요.</p>
          </div>
        </li>
      </ol>
    </article>
  </section>
</template>

<script setup lang="ts">
import IconBadge from "./IconBadge.vue";

defineProps<{
  arrivalPreview: string;
  arrivalReflectionId?: string;
  arrivalWindowLabel?: string;
  hasReflections: boolean;
}>();

defineEmits<{
  "open-arrival": [reflectionId: string];
  "start-quick": [];
}>();
</script>

<style scoped>
.deliverySection { display: grid; }

.arrivalCard {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 18px;
  border: 0;
  border-radius: var(--radius-panel);
  background: var(--surface-letter);
  box-shadow: var(--shadow-letter);
  text-align: left;
  animation: rc-pop-in 320ms var(--ease-spring) both;
  transition: transform var(--motion-quick) var(--ease-spring);
}
.arrivalCard:active { transform: scale(0.98); }

.arrivalBody { display: grid; gap: 3px; min-width: 0; }
.arrivalCaption { color: var(--text-on-letter-soft); font-size: 12px; font-weight: var(--label-weight); }
.arrivalBody strong {
  color: var(--text-on-letter);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.01em;
  word-break: keep-all;
}
.arrivalPreview {
  color: var(--text-on-letter-soft);
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.arrivalChevron { width: 16px; height: 16px; color: var(--text-on-letter-soft); }

.quietNote {
  margin: 0;
  padding: 14px 16px;
  border-radius: var(--radius-card);
  background: var(--surface-ink-wash);
  color: var(--text-tertiary);
  font-size: 13px;
  text-align: center;
}

.explainCard { display: grid; gap: 16px; padding: 20px; }
.explainCard h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}
.explainSteps { margin: 0; padding: 0; list-style: none; display: grid; gap: 14px; }
.explainSteps li { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; }
.stepNum {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--surface-letter);
  color: var(--accent-sage);
  font-size: 13px;
  font-weight: 700;
}
.explainSteps strong { display: block; font-size: 14px; font-weight: var(--label-weight); color: var(--text-primary); }
.explainSteps p { margin: 2px 0 0; color: var(--text-tertiary); font-size: 13px; line-height: 1.5; }
</style>
