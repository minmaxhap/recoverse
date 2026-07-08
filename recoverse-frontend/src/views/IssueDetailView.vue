<template>
  <AppShell variant="read">
    <BackHeader label="책장으로" @back="$emit('back')" />

    <header class="issueHead">
      <span class="eyebrow red">{{ issue.date.slice(0, 4) }} ISSUE</span>
      <h1 class="pageTitle">{{ issue.title }}</h1>
      <div class="rule" />
      <p class="fineprint">{{ issue.participants.join(' · ') }}</p>
      <p v-if="issue.originNote" class="originNote">{{ issue.originNote }}</p>
    </header>

    <article v-for="(round, i) in issue.rounds" :key="i" class="archiveRound">
      <SpreadLayout :two-col="round.answers && Object.keys(round.answers).length >= 4">
        <template #left>
          <Headline :no="i + 1" :question="round.question" :asker="round.asker" />
        </template>
        <template #right>
          <AnswerQuote
            v-for="(name, j) in issue.participants"
            v-show="round.answers?.[name]"
            :key="name"
            :text="round.answers?.[name]?.text ?? ''"
            :name="name"
            :color="colorAt(j)"
            still
          />
        </template>
      </SpreadLayout>
    </article>

    <p v-if="issue.rounds.length === 0" class="empty">아직 옮겨 적은 질문이 없는 호예요.</p>

    <div class="gap big" />
    <button class="endLink" @click="onRemove">이 호를 책장에서 빼기</button>
  </AppShell>
</template>

<script setup lang="ts">
import type { Issue } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import Headline from '../components/Headline.vue';
import AnswerQuote from '../components/AnswerQuote.vue';
import SpreadLayout from '../components/SpreadLayout.vue';
import { colorAt } from '../lib/palette';
import { useShelf } from '../composables/useShelf';

const props = defineProps<{ issue: Issue }>();
const emit = defineEmits<{ back: []; removed: [] }>();

const shelf = useShelf();

function onRemove() {
  if (!window.confirm('이 호를 책장에서 뺄까요? 되돌릴 수 없어요.')) return;
  shelf.remove(props.issue.id);
  emit('removed');
}
</script>

<style scoped>
.issueHead {
  margin: 8px 0 26px;
  display: grid;
  gap: 8px;
}
.archiveRound {
  margin-bottom: 34px;
}
.empty {
  font-size: 14px;
  color: var(--dim);
}
.originNote {
  margin: 4px 0 0;
  padding: 12px;
  border-left: 3px solid var(--vermilion);
  background: var(--paper-card);
  color: var(--dim-strong);
  font-size: 13px;
  line-height: 1.65;
}
</style>
