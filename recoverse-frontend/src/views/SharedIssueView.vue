<template>
  <AppShell variant="read">
    <header class="masthead">
      <div class="rule thick" />
      <h1 class="brand">RECOVERSE</h1>
      <div class="deck">
        <span>읽기 전용으로 공유된 호</span>
        <span>SHARED ISSUE</span>
      </div>
      <div class="rule" />
    </header>

    <p v-if="loading" class="waiting">불러오는 중…</p>
    <p v-else-if="error" class="error shareError">{{ error }}</p>

    <template v-else-if="issue">
      <header class="issueHead">
        <span class="eyebrow red">{{ issue.date.slice(0, 4) }} ISSUE</span>
        <h1 class="pageTitle">{{ issue.title }}</h1>
        <div class="rule" />
        <p class="fineprint">{{ issue.participants.join(' · ') }}</p>
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

      <div class="gap big" />
      <button class="cta" @click="$emit('start')">나도 이런 회고 만들기</button>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Issue } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import Headline from '../components/Headline.vue';
import AnswerQuote from '../components/AnswerQuote.vue';
import SpreadLayout from '../components/SpreadLayout.vue';
import { colorAt } from '../lib/palette';
import { api, ApiError } from '../lib/api';

const props = defineProps<{ shareId: string }>();
defineEmits<{ start: [] }>();

const issue = ref<Issue | null>(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const res = await api.getShare(props.shareId);
    issue.value = res.issue;
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '공유된 호를 불러오지 못했어요.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.masthead .brand {
  font-family: var(--font-display);
  font-size: 40px;
  letter-spacing: 0.04em;
  margin: 10px 0 6px;
  font-weight: 700;
}
.masthead .deck {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding-bottom: 10px;
}
.issueHead {
  margin: 26px 0 26px;
  display: grid;
  gap: 8px;
}
.archiveRound {
  margin-bottom: 34px;
}
.shareError {
  margin-top: 30px;
  text-align: center;
}
</style>
