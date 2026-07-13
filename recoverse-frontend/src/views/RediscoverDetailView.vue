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
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QuestionGroup } from '../lib/rediscover';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import RediscoverEntryAnswers from '../components/RediscoverEntryAnswers.vue';

const props = defineProps<{ group: QuestionGroup }>();
defineEmits<{ back: [] }>();

const acrossLabel = computed(() => {
  const ys = props.group.years;
  if (ys.length <= 1) return `ACROSS ${ys[0] ?? ''}`;
  return `ACROSS ${ys[0]}–${ys[ys.length - 1]}`;
});
</script>

<style scoped>
.issueHead {
  margin: 8px 0 20px;
  display: grid;
  gap: 8px;
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
