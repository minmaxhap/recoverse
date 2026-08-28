<template>
  <AppShell variant="read">
    <BackHeader label="다시 발견" @back="$emit('back')" />
    <header class="issueHead">
      <span class="eyebrow red">{{ acrossLabel }}</span>
      <h1 class="pageTitle">{{ group.question }}</h1>
      <div class="rule" />
    </header>

    <div class="timeline">
      <section
        v-for="(entry, i) in group.entries"
        :key="i"
        class="yearBlock"
        :style="{ animationDelay: `${0.1 + i * 0.18}s` }"
      >
        <div class="yside">
          <div class="yearMark"><span>{{ entry.year }}</span></div>
          <small class="fineprint">{{ entry.issueTitle }}</small>
        </div>
        <div class="aside">
          <RediscoverEntryAnswers
            :participants="entry.participants"
            :answers="entry.answers"
          />
        </div>
      </section>
    </div>

    <!-- 지난 해의 답을 읽고 나면 하고 싶은 건 하나다 — 올해의 답을 쓰는 것. -->
    <section class="answerAgain">
      <div class="rule" />
      <p class="againLead">{{ againLead }}</p>
      <button type="button" class="againCta" @click="$emit('write', group.question)">
        이 질문에 올해도 답하기 →
      </button>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QuestionGroup } from '../lib/rediscover';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import RediscoverEntryAnswers from '../components/RediscoverEntryAnswers.vue';

const props = defineProps<{ group: QuestionGroup }>();
defineEmits<{ back: []; write: [string] }>();

const acrossLabel = computed(() => {
  const ys = props.group.years;
  if (ys.length <= 1) return `ACROSS ${ys[0] ?? ''}`;
  return `ACROSS ${ys[0]}–${ys[ys.length - 1]}`;
});

const againLead = computed(() => {
  const last = props.group.years[props.group.years.length - 1];
  const thisYear = String(new Date().getFullYear());
  if (last === thisYear) return '올해도 이 질문에 한 번 더 답해볼까요.';
  return `${last}년의 답이 마지막이에요. 지금의 나는 뭐라고 답할까요.`;
});
</script>

<style scoped>
.issueHead {
  margin: 8px 0 20px;
  display: grid;
  gap: 8px;
}
.answerAgain {
  display: grid;
  justify-items: start;
  gap: 10px;
  margin-top: 26px;
}
.againLead {
  margin: 0;
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.6;
  color: var(--dim-strong);
}
.againCta {
  padding: 13px 18px;
  background: var(--ink);
  color: var(--paper);
  border: 1px solid var(--ink);
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.12s ease;
}
.againCta:hover {
  background: var(--vermilion);
  border-color: var(--vermilion);
  color: var(--vermilion-ink);
}
.yearBlock {
  margin-bottom: 30px;
  animation: rise 0.55s ease both;
}
.yearMark span {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 700;
  color: var(--vermilion);
}
.yside {
  margin-bottom: 4px;
}

/* 데스크톱: 왼쪽 여백 컬럼(120px)에 연도 마커 고정, 오른쪽 답변 흐름 */
@media (min-width: 1024px) {
  .yearBlock {
    display: grid;
    grid-template-columns: var(--year-margin) 1fr;
    gap: 0;
  }
  .yside {
    border-right: 1px solid var(--hairline);
    padding-right: 18px;
    text-align: right;
    margin-bottom: 0;
  }
  .aside {
    padding-left: 18px;
  }
}
</style>
