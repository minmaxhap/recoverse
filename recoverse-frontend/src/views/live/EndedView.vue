<template>
  <div class="center completing">
    <span class="eyebrow gold pressEyebrow">이번 호 발행</span>
    <PublishScene :year="issueYear" :kind-label="kindLabel" />

    <h1 class="pageTitle centered d1">{{ issueYear }} {{ kindLabel }},<br />발행 완료</h1>
    <p class="waiting d2">질문 {{ state.meta.history.length }}개 · {{ state.players.join(' · ') }}</p>

    <div v-if="readers.names.length > 0" class="mindReader d3">
      <span class="eyebrow gold">올해의 독심술사</span>
      <p class="readerName">{{ readers.names.join(' · ') }}</p>
      <p class="fineprint">{{ readers.score }}번 적중</p>
    </div>

    <p v-if="saveError" class="error d4" role="alert">{{ saveError }}</p>
    <p v-if="shareError" class="error d4" role="alert">{{ shareError }}</p>
    <button v-if="!isSaved" type="button" class="cta d4" @click="onSave">
      내 책장에 이번 호 꽂기
    </button>
    <button v-else type="button" class="cta d4" :disabled="sharing" @click="onShare">
      {{ sharing ? '공유 링크 만드는 중…' : '친구에게 결과 보내기' }}
    </button>
    <div v-if="shareUrl" class="shareResult">
      <p class="shareUrl">{{ shareUrl }}</p>
      <p v-if="copied" class="fineprint" role="status">링크를 복사했어요.</p>
    </div>
    <button v-if="isSaved" class="endLink" @click="$emit('done')">책장으로 돌아가기</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { KIND_LABELS, type SessionStateResponse } from '@recoverse/shared';
import PublishScene from '../../components/PublishScene.vue';
import { useShelf } from '../../composables/useShelf';
import { totalScores, mindReaders } from '../../lib/guessing';
import { issueFromSession } from '../../lib/issueBuilder';
import { issueFingerprint } from '../../lib/archivePreview';
import { api } from '../../lib/api';

const props = defineProps<{ state: SessionStateResponse }>();

defineEmits<{
  done: [];
}>();

const shelf = useShelf();
const saveError = ref('');
const sharing = ref(false);
const shareUrl = ref('');
const shareError = ref('');
const copied = ref(false);

// 이 세션에서 만들 호. id는 매번 새로 나지만 지문은 내용으로 결정되므로,
// 마감 화면을 새로고침하거나 다시 저장해도 같은 호가 책장에 두 번 꽂히지 않는다.
const pendingIssue = issueFromSession(props.state);
const fingerprint = issueFingerprint(pendingIssue);
const savedIssue = computed(() =>
  shelf.issues.value.find((issue) => issueFingerprint(issue) === fingerprint),
);
const isSaved = computed(() => savedIssue.value !== undefined);

const issueYear = computed(() => props.state.meta.date.slice(0, 4));
const kindLabel = computed(() => KIND_LABELS[props.state.meta.kind]);
const readers = computed(() => mindReaders(totalScores(props.state.pastGuesses)));

function onSave(): void {
  if (isSaved.value) return;

  saveError.value = '';
  if (!shelf.add(pendingIssue)) {
    saveError.value = '브라우저 저장 공간에 저장하지 못했어요. 용량을 비우고 다시 시도해주세요.';
    return;
  }
}

function shareLink(id: string): string {
  return `${window.location.origin}/shared/${id}`;
}

async function onShare(): Promise<void> {
  const issue = savedIssue.value;
  if (!issue || sharing.value) return;

  sharing.value = true;
  shareError.value = '';
  try {
    let id = issue.shareId;
    if (!id) {
      const response = await api.createShare(issue);
      id = response.shareId;
      if (!shelf.update(issue.id, { shareId: id })) throw new Error('share-save-failed');
    }
    shareUrl.value = shareLink(id);
    copied.value = await navigator.clipboard.writeText(shareUrl.value).then(
      () => true,
      () => false,
    );
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    shareError.value = '공유 링크를 만들지 못했어요.';
  } finally {
    sharing.value = false;
  }
}
</script>

<style scoped>
.center {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding-top: 6vh;
  text-align: center;
}

.pressEyebrow {
  opacity: 0;
  animation: fadeUp 0.5s ease 0.05s both;
}

.d1 {
  opacity: 0;
  animation: fadeUp 0.5s ease 1.08s both;
}

.d2 {
  opacity: 0;
  animation: fadeUp 0.5s ease 1.24s both;
}

.d3 {
  opacity: 0;
  animation: pressPop 0.5s cubic-bezier(0.34, 1.3, 0.5, 1) 1.46s both;
}

.d4 {
  opacity: 0;
  animation: fadeUp 0.5s ease 1.68s both;
}

.mindReader {
  display: grid;
  gap: 4px;
  justify-items: center;
  padding: 16px 0;
}

.readerName {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  margin: 2px 0 0;
}

.shareResult {
  display: grid;
  gap: 8px;
  width: 100%;
}

.shareUrl {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--hairline);
  background: var(--paper-card);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pressPop {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  60% {
    opacity: 1;
    transform: scale(1.04);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
