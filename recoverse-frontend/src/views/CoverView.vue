<template>
  <AppShell variant="read">
    <div class="coverTools noPrint">
      <VocButton />
    </div>

    <header class="masthead">
      <div class="rule thick" />
      <h1 class="brand">RECOVERSE</h1>
      <div class="deck">
        <span>질문과 답으로 만드는 연말호</span>
        <span>EST. 2016</span>
      </div>
      <div class="rule" />
    </header>

    <div class="coverSplit">
      <p class="coverline">
        한 해에 한 번,<br />
        우리는 서로에게<br />
        <em>질문</em>이 된다.
      </p>

      <CoverEntryList @navigate="$emit('navigate', $event)" />
    </div>

    <CoverBackIssues :issues="issues" @navigate="$emit('navigate', $event)" @open="$emit('open', $event)" />
  </AppShell>
</template>

<script setup lang="ts">
import type { Issue } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import CoverBackIssues from '../components/CoverBackIssues.vue';
import CoverEntryList from '../components/CoverEntryList.vue';
import VocButton from '../components/VocButton.vue';

defineProps<{ readonly issues: readonly Issue[] }>();
defineEmits<{ navigate: ['create' | 'join' | 'solo' | 'paper' | 'rediscover']; open: [string] }>();
</script>

<style scoped>
.coverTools {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
.masthead .brand {
  font-family: var(--font-display);
  font-size: clamp(30px, 9vw, 40px);
  letter-spacing: 0.02em;
  margin: 10px 0 6px;
  font-weight: 700;
}
.masthead .deck {
  display: grid;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding-bottom: 10px;
  line-height: 1.5;
}
.coverline {
  font-family: var(--font-display);
  font-size: 30px;
  line-height: 1.5;
  margin: 34px 0 36px;
}
.coverline em {
  font-style: normal;
  color: var(--vermilion);
  background: linear-gradient(var(--vermilion), var(--vermilion)) left bottom / 0% 3px no-repeat;
  animation: drawUnderline 0.7s ease 0.5s both;
  padding-bottom: 2px;
}
@keyframes drawUnderline {
  to {
    background-size: 100% 3px;
  }
}

@media (min-width: 1024px) {
  .masthead .deck {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .coverSplit {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    align-items: start;
  }
  .coverSplit .coverline {
    padding-right: 40px;
    border-right: 1px solid var(--hairline);
    font-size: 34px;
  }
}
</style>
