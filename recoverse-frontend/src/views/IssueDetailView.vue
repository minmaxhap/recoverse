<template>
  <AppShell variant="read">
    <BackHeader label="책장으로" @back="$emit('back')" />

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

    <p v-if="issue.rounds.length === 0" class="empty">아직 옮겨 적은 질문이 없는 호예요.</p>

    <div class="gap big" />
    <div class="shareBox">
      <button class="ghost" :disabled="sharing" @click="onShare">
        {{ sharing ? '링크 만드는 중…' : shareUrl ? '공유 링크 다시 복사' : '읽기 전용 공유 링크 만들기' }}
      </button>
      <p v-if="shareUrl" class="shareUrl">{{ copied ? '링크를 복사했어요 ✓' : shareUrl }}</p>
      <p v-if="shareError" class="error">{{ shareError }}</p>
      <p class="fineprint">링크를 아는 사람은 이 호를 읽을 수 있어요.</p>
    </div>

    <div class="gap" />
    <button class="endLink" @click="onRemove">이 호를 책장에서 빼기</button>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Issue } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import Headline from '../components/Headline.vue';
import AnswerQuote from '../components/AnswerQuote.vue';
import SpreadLayout from '../components/SpreadLayout.vue';
import { colorAt } from '../lib/palette';
import { useShelf } from '../composables/useShelf';
import { api, ApiError } from '../lib/api';

const props = defineProps<{ issue: Issue }>();
const emit = defineEmits<{ back: []; removed: [] }>();

const shelf = useShelf();

const sharing = ref(false);
const shareUrl = ref('');
const copied = ref(false);
const shareError = ref('');

function shareLink(id: string): string {
  return `${window.location.origin}${window.location.pathname}?share=${id}`;
}

async function onShare() {
  if (sharing.value) return;
  shareError.value = '';
  try {
    // 이미 공유한 호면 같은 링크 재사용 (서버 스냅샷이 그대로 남아 있음)
    let id = props.issue.shareId;
    if (!id) {
      sharing.value = true;
      const res = await api.createShare(props.issue);
      id = res.shareId;
      shelf.update(props.issue.id, { shareId: id });
    }
    shareUrl.value = shareLink(id);
    try {
      await navigator.clipboard.writeText(shareUrl.value);
      copied.value = true;
    } catch {
      copied.value = false;
    }
  } catch (e) {
    shareError.value = e instanceof ApiError ? e.message : '공유 링크를 만들지 못했어요.';
  } finally {
    sharing.value = false;
  }
}

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
.shareBox {
  display: grid;
  gap: 8px;
}
.shareUrl {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--hairline);
  background: var(--paper-card);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
  color: var(--dim-strong);
}
</style>
