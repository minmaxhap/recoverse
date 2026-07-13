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
    <button class="cta d4" :disabled="saved" @click="onSave">
      {{ saved ? '책장에 꽂아뒀어요' : '내 책장에 이번 호 꽂기' }}
    </button>
    <button v-if="saved" class="endLink" @click="$emit('done')">서재로 돌아가기</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { KIND_LABELS, type SessionStateResponse } from '@recoverse/shared';
import PublishScene from '../../components/PublishScene.vue';
import { useShelf } from '../../composables/useShelf';
import { totalScores, mindReaders } from '../../lib/guessing';
import { issueFromSession } from '../../lib/issueBuilder';

const props = defineProps<{ state: SessionStateResponse }>();

defineEmits<{
  done: [];
}>();

const shelf = useShelf();
const saved = ref(false);
const saveError = ref('');

const issueYear = computed(() => props.state.meta.date.slice(0, 4));
const kindLabel = computed(() => KIND_LABELS[props.state.meta.kind]);
const readers = computed(() => mindReaders(totalScores(props.state.pastGuesses)));

function onSave(): void {
  if (saved.value) return;

  saveError.value = '';
  if (!shelf.add(issueFromSession(props.state))) {
    saveError.value = '브라우저 저장 공간에 저장하지 못했어요. 용량을 비우고 다시 시도해주세요.';
    return;
  }

  saved.value = true;
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
