<template>
  <section class="modePicker" aria-labelledby="soloModeTitle">
    <span class="eyebrow red">START A PAGE</span>
    <h2 id="soloModeTitle">지금 무엇부터 남길까요?</h2>
    <p class="modeLead">정답을 고르는 일이 아니에요. 지금 가장 가벼운 입구 하나만 골라보세요.</p>
    <div class="modeList">
      <button v-for="option in options" :key="option.id" type="button" class="modeOption" @click="$emit('select', option.id)">
        <span class="modeNo">{{ option.no }}</span>
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

const options = [
  { id: 'quick', no: '01', title: '바로 쓰기', description: '오늘, 힘든 일, 다음 행동을 짧게 정리해요.' },
  { id: 'review', no: '02', title: '대상을 골라 리뷰하기', description: '사진·식사·대화처럼 구체적인 것에서 시작해요.' },
  { id: 'free', no: '03', title: '직접 엮기', description: '내 질문과 지난 질문을 자유롭게 목차로 엮어요.' },
] as const satisfies readonly { readonly id: SoloMode; readonly no: string; readonly title: string; readonly description: string }[];

defineEmits<{ select: [SoloMode] }>();
</script>

<style scoped>
.modePicker { display: grid; gap: 12px; margin-top: 8px; }
.modePicker h2 { margin: 0; font-family: var(--font-display); font-size: 25px; line-height: 1.45; text-wrap: balance; }
.modeLead { max-width: 38rem; margin: 0 0 8px; color: var(--dim); font-size: 14px; line-height: 1.65; }
.modeList { display: grid; border-top: 1px solid var(--ink); }
.modeOption { min-height: 88px; display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 16px 4px; text-align: left; background: none; border: 0; border-bottom: 1px solid var(--ink); color: inherit; cursor: pointer; }
.modeOption:hover, .modeOption:focus-visible { background: var(--paper-card); }
.modeNo { font-family: var(--font-display); color: var(--vermilion); font-weight: 700; }
.modeCopy { min-width: 0; display: grid; gap: 4px; }
.modeCopy b { font-family: var(--font-display); font-size: 19px; }
.modeCopy small { color: var(--dim); font-size: 13px; line-height: 1.55; }
.modeArrow { font-size: 20px; transition: transform 0.15s ease; }
.modeOption:hover .modeArrow { transform: translateX(3px); }
@media (min-width: 768px) { .modeOption { min-height: 96px; padding-inline: 12px; } }
</style>
