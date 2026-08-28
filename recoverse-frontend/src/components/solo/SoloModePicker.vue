<template>
  <section class="modePicker" aria-labelledby="soloModeTitle">
    <span class="eyebrow red">START A PAGE</span>
    <h2 id="soloModeTitle">지금 무엇부터 남길까요?</h2>
    <p class="modeLead">지금 가장 가벼운 입구 하나만 골라보세요.</p>
    <div class="modeList">
      <button v-for="option in options" :key="option.id" type="button" class="modeOption" @click="$emit('select', option.id)">
        <span class="modeCopy">
          <b>{{ option.title }}</b>
          <small>{{ option.description }}</small>
        </span>
        <span class="modeArrow" aria-hidden="true">→</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SoloMode } from './reviewContent';

// 번호는 책장과 호 목차 — 진짜 차례가 있는 곳에만 남긴다. 시작 방식은 순서가 아니라
// 나란한 세 갈래라, 01/02/03을 붙이면 목차의 번호까지 습관처럼 보이게 만든다.
const options = [
  { id: 'quick', title: '바로 쓰기', description: '오늘, 힘든 일, 다음 행동을 짧게 정리해요.' },
  { id: 'review', title: '대상을 골라 리뷰하기', description: '사진·식사·대화처럼 구체적인 것에서 시작해요.' },
  { id: 'free', title: '직접 엮기', description: '내 질문과 지난 질문을 자유롭게 목차로 엮어요.' },
] as const satisfies readonly { readonly id: SoloMode; readonly title: string; readonly description: string }[];

defineEmits<{ select: [SoloMode] }>();
</script>

<style scoped>
.modePicker { display: grid; gap: 12px; margin-top: 8px; }
.modePicker h2 { margin: 0; font-family: var(--font-display); font-size: 25px; line-height: 1.45; text-wrap: balance; }
.modeLead { max-width: 38rem; margin: 0 0 8px; color: var(--dim); font-size: 14px; line-height: 1.65; }
.modeList { display: grid; border-top: 1px solid var(--ink); }
.modeOption { min-height: 88px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 16px 4px; text-align: left; background: none; border: 0; border-bottom: 1px solid var(--ink); color: inherit; cursor: pointer; }
.modeOption:hover, .modeOption:focus-visible { background: var(--paper-card); }
.modeCopy { min-width: 0; display: grid; gap: 4px; }
.modeCopy b { font-family: var(--font-display); font-size: 19px; }
.modeCopy small { color: var(--dim); font-size: 13px; line-height: 1.55; }
.modeArrow { font-size: 20px; transition: transform 0.15s ease; }
.modeOption:hover .modeArrow { transform: translateX(3px); }
@media (min-width: 768px) { .modeOption { min-height: 96px; padding-inline: 12px; } }
</style>
