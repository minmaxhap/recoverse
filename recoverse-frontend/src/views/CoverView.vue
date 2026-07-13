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

    <button v-if="moment" class="momentCard" @click="$emit('open-group', moment.groupKey)">
      <span class="eyebrow gold">{{ momentLabel }}</span>
      <span class="momentQ">{{ moment.question }}</span>
      <span class="momentA">“{{ momentTeaser }}”</span>
      <span class="momentMeta">{{ moment.year }} · {{ moment.issueTitle }} →</span>
    </button>

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
import { computed } from 'vue';
import type { Issue } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import CoverBackIssues from '../components/CoverBackIssues.vue';
import CoverEntryList from '../components/CoverEntryList.vue';
import VocButton from '../components/VocButton.vue';
import type { RediscoveryMoment } from '../lib/rediscover';

const props = defineProps<{ readonly issues: readonly Issue[]; readonly moment?: RediscoveryMoment | null }>();
defineEmits<{
  navigate: ['create' | 'join' | 'solo' | 'paper' | 'rediscover'];
  open: [string];
  'open-group': [string];
}>();

const momentLabel = computed(() => {
  const m = props.moment;
  if (!m) return '';
  if (m.anniversary) return m.yearsAgo <= 1 ? '1년 전 오늘 즈음' : `${m.yearsAgo}년 전 오늘 즈음`;
  return '오늘의 재발견';
});

const momentTeaser = computed(() => {
  const m = props.moment;
  if (!m) return '';
  const first = m.participants.map((n) => m.answers[n]?.text).find((t) => t && t.trim());
  return first ?? '';
});
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
.momentCard {
  width: 100%;
  display: grid;
  gap: 6px;
  text-align: left;
  border: 1px solid var(--ink);
  background: var(--paper-card);
  padding: 18px 16px;
  margin: 24px 0;
  cursor: pointer;
  color: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.momentCard:hover {
  border-color: var(--vermilion);
  box-shadow: 3px 3px 0 var(--vermilion);
  transform: translate(-1px, -1px);
}
.momentQ {
  font-family: var(--font-display);
  font-size: 19px;
  line-height: 1.5;
  font-weight: 700;
}
.momentA {
  font-family: var(--font-display);
  font-size: 15px;
  line-height: 1.7;
  color: var(--dim-strong);
}
.momentMeta {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--dim);
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
