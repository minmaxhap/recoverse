<template>
  <div class="center">
    <div class="stampEnd">閉</div>
    <h1 class="pageTitle centered">{{ state.meta.date.slice(0, 4) }} {{ kindLabel }},<br />발행 완료</h1>
    <p class="waiting">질문 {{ state.meta.history.length }}개 · {{ state.players.join(' · ') }}</p>

    <div v-if="readers.names.length > 0" class="mindReader">
      <span class="eyebrow gold">올해의 독심술사</span>
      <p class="readerName">{{ readers.names.join(' · ') }}</p>
      <p class="fineprint">{{ readers.score }}번 적중</p>
    </div>

    <button class="cta" :disabled="saved" @click="onSave">
      {{ saved ? '책장에 꽂혔어요' : '내 책장에 이번 호 꽂기' }}
    </button>
    <button v-if="saved" class="endLink" @click="$emit('done')">표지로 돌아가기</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { KIND_LABELS, type SessionStateResponse } from '@recoverse/shared';
import { totalScores, mindReaders } from '../../lib/guessing';
import { issueFromSession } from '../../lib/issueBuilder';
import { useShelf } from '../../composables/useShelf';

const props = defineProps<{ state: SessionStateResponse }>();
const emit = defineEmits<{ done: [] }>();

const shelf = useShelf();
const saved = ref(false);

const kindLabel = computed(() => `${KIND_LABELS[props.state.meta.kind]}호`);
const readers = computed(() => mindReaders(totalScores(props.state.pastGuesses)));

function onSave() {
  if (saved.value) return;
  shelf.add(issueFromSession(props.state));
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
.stampEnd {
  font-family: var(--font-display);
  font-size: 44px;
  color: var(--vermilion);
  border: 2px solid var(--vermilion);
  border-radius: 50%;
  width: 84px;
  height: 84px;
  display: grid;
  place-items: center;
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
</style>
