<template>
  <AppShell variant="read">
    <BackHeader label="다시 발견" @back="$emit('back')" />
    <h1 class="pageTitle">같은 질문,<br />다른 해의 나</h1>
    <p class="lede">여러 해에 걸쳐 반복된 질문일수록 위에 올라와요. 하나를 골라 시간 여행을 시작하세요.</p>

    <button v-if="moment" class="momentCard" @click="$emit('open', moment.groupKey)">
      <span class="eyebrow gold">{{ momentLabel }}</span>
      <span class="momentQ">{{ moment.question }}</span>
      <span class="momentA">“{{ momentTeaser }}”</span>
      <span class="momentMeta">{{ moment.year }} · {{ moment.issueTitle }} →</span>
    </button>

    <div v-if="groups.length === 0" class="stack">
      <p class="empty">아직 책장이 비어 있어요. 세션을 하거나 종이 회고를 복간하면 여기서 이어져요.</p>
      <button class="ghost" @click="$emit('addSamples')">예시 지난 호 3권 꽂아보기</button>
    </div>

    <button v-for="g in groups" :key="g.key" class="redisRow" @click="$emit('open', g.key)">
      <span class="redisQ">{{ g.question }}</span>
      <span class="yearChips">
        <em v-for="y in g.years" :key="y">{{ y }}</em>
        <b v-if="g.years.length > 1">{{ g.years.length }}개의 해</b>
      </span>
    </button>

    <template v-if="hasSamples">
      <div class="gap" />
      <button class="endLink" @click="$emit('removeSamples')">예시 데이터 지우기</button>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QuestionGroup, RediscoveryMoment } from '../lib/rediscover';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';

const props = defineProps<{
  groups: QuestionGroup[];
  hasSamples: boolean;
  moment: RediscoveryMoment | null;
}>();
defineEmits<{ back: []; open: [string]; addSamples: []; removeSamples: [] }>();

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
.momentCard {
  width: 100%;
  display: grid;
  gap: 6px;
  text-align: left;
  border: 1px solid var(--ink);
  background: var(--paper-card);
  padding: 18px 16px;
  margin-bottom: 22px;
  cursor: pointer;
  color: inherit;
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
.empty {
  font-size: 14px;
  color: var(--dim);
}
.redisRow {
  width: 100%;
  display: grid;
  gap: 8px;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--hairline);
  padding: 16px 2px;
  cursor: pointer;
  color: inherit;
}
.redisQ {
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1.55;
  font-weight: 700;
}
.yearChips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.yearChips em {
  font-style: normal;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  border: 1px solid var(--ink);
  padding: 2px 8px;
}
.yearChips b {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--vermilion);
}
</style>
