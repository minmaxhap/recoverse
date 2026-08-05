<template>
  <section class="quickPicker" aria-labelledby="quickTitle">
    <button type="button" class="backChoice" @click="$emit('back')">← 시작 방식 다시 고르기</button>
    <span class="eyebrow red">QUICK NOTE</span>
    <h2 id="quickTitle" ref="quickTitle" tabindex="-1">한 가지 질문부터 바로 써요</h2>
    <div class="quickList">
      <button v-for="item in quickStarts" :key="item.id" type="button" class="quickOption" @click="choose(item)">
        <b>{{ item.title }}</b><span>{{ item.promise }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

// 모드를 고른 뒤 이 화면이 열릴 때 포커스를 데려온다 — 리뷰 흐름과 같은 규칙.
const quickTitle = ref<HTMLHeadingElement | null>(null);
onMounted(() => quickTitle.value?.focus({ preventScroll: true }));

const quickStarts = [
  { id: 'today', title: '오늘 정리', promise: '남길 장면 하나를 골라요.', question: '오늘 여러 장면 중 다시 떠오르는 하나는 무엇인가요?' },
  { id: 'hard', title: '힘든 일 정리', promise: '해결보다 지금 적을 수 있는 만큼만.', question: '지금 적을 수 있는 것은 사실, 내 해석, 필요한 것 중 어느 쪽인가요?' },
  { id: 'next', title: '다음 행동', promise: '생각을 시작할 수 있는 한 동작으로 줄여요.', question: '지금 바라는 변화에 가까워지는 가장 작은 첫 동작은 무엇인가요?' },
] as const;

export type QuickStartSelection = {
  readonly question: string;
  readonly pathId: string;
  readonly pathRevision: number;
  readonly mode: 'short' | 'standard' | 'extended';
};

const emit = defineEmits<{ back: []; choose: [QuickStartSelection] }>();

function choose(item: (typeof quickStarts)[number]): void {
  const pathId = item.id === 'today' ? 'solo-today' : item.id === 'hard' ? 'solo-hard-moment' : 'solo-next-action';
  // mode는 초고 스키마가 계속 읽는 필드라 남기되, 길이를 묻지 않으므로 한 값으로 고정한다.
  // 고른 길이가 질문도 단계 수도 바꾸지 않아 선택이 아무 차이를 만들지 못했다.
  emit('choose', { question: item.question, pathId, pathRevision: 1, mode: 'standard' });
}
</script>

<style scoped>
.quickPicker { display: grid; gap: 12px; }
.quickPicker h2 { margin: 0 0 6px; font-family: var(--font-display); font-size: 25px; line-height: 1.45; }
.backChoice { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--dim); font-weight: 700; cursor: pointer; }
.backChoice:hover { color: var(--vermilion); }
.quickList { display: grid; gap: 8px; }
.quickOption { min-height: 72px; display: grid; gap: 4px; padding: 14px; text-align: left; background: var(--paper-card); border: 1px solid var(--ink); color: inherit; cursor: pointer; }
.quickOption:hover { box-shadow: inset 0 -3px 0 var(--vermilion); }
.quickOption b { font-family: var(--font-display); font-size: 17px; }
.quickOption span { color: var(--dim); font-size: 13px; line-height: 1.5; }
</style>
