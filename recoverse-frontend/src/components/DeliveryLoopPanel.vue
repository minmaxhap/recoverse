<template>
  <section class="deliverySection" aria-labelledby="delivery-title">
    <article class="deliveryCard paperPanel">
      <div>
        <span class="screenEyebrow">Rediscovery loop</span>
        <h2 id="delivery-title">쓰는 순간보다 다시 만나는 순간을 설계합니다.</h2>
      </div>
      <ol class="deliverySteps" aria-label="Recoverse 회고 흐름">
        <li>
          <span>01</span>
          <strong>30초 작성</strong>
          <p>첫 화면에서 바로 질문 하나에 답합니다.</p>
        </li>
        <li>
          <span>02</span>
          <strong>봉투 보관</strong>
          <p>답변은 책장 속 편지처럼 조용히 쌓입니다.</p>
        </li>
        <li>
          <span>03</span>
          <strong>미래 배달</strong>
          <p>시간이 지난 뒤 예전의 답변을 다시 열어봅니다.</p>
        </li>
      </ol>
    </article>

    <article class="arrivalCard paperPanel">
      <span class="screenEyebrow">Arrived today</span>
      <template v-if="arrivalReflectionId">
        <h2>오늘 도착한 과거 회고</h2>
        <p>{{ arrivalPreview }}</p>
        <button class="paperButton" type="button" @click="$emit('open-arrival', arrivalReflectionId)">
          다시 열어보기
        </button>
      </template>
      <template v-else>
        <h2>아직 도착한 회고가 없어요.</h2>
        <p>첫 답변을 남기면, 나중에 이 자리에 과거의 내가 도착합니다.</p>
        <button class="paperButton" type="button" @click="$emit('start-quick')">
          30초 회고 남기기
        </button>
      </template>
    </article>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  arrivalPreview: string;
  arrivalReflectionId?: string;
}>();

defineEmits<{
  "open-arrival": [reflectionId: string];
  "start-quick": [];
}>();
</script>

<style scoped>
.deliverySection { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.72fr); gap: 14px; align-items: stretch; }
.deliveryCard, .arrivalCard { padding: clamp(18px, 3vw, 24px); border-radius: 14px; }
.deliveryCard { display: grid; gap: 18px; background: linear-gradient(135deg, var(--surface-paper), rgba(221, 229, 216, 0.58)); }
.deliveryCard h2, .arrivalCard h2 { margin: 0; font-family: var(--font-display); font-weight: var(--display-weight); line-height: var(--leading-tight); color: var(--text-primary); }
.deliveryCard h2 { max-width: 560px; font-size: clamp(24px, 4vw, 34px); }
.deliverySteps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 0; padding: 0; list-style: none; }
.deliverySteps li { min-height: 136px; display: grid; align-content: start; gap: 7px; padding: 14px; border: 1px solid rgba(202, 188, 168, 0.58); border-radius: var(--radius-card); background: rgba(255, 253, 248, 0.64); }
.deliverySteps span { color: var(--accent-wax); font-family: var(--font-display); font-size: 14px; font-weight: var(--display-weight); }
.deliverySteps strong { color: var(--text-primary); font-size: 15px; font-weight: var(--heading-weight); }
.deliverySteps p, .arrivalCard p { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: var(--leading-body); word-break: keep-all; }
.arrivalCard { display: grid; gap: 12px; align-content: start; background: var(--surface-parchment); }
.arrivalCard h2 { font-size: clamp(21px, 3vw, 27px); }
.arrivalCard .paperButton { width: fit-content; min-width: 150px; }

@media (max-width: 760px) {
  .deliverySection { grid-template-columns: 1fr; }
  .deliverySteps { grid-template-columns: 1fr; }
  .deliverySteps li { min-height: 112px; }
}
</style>
