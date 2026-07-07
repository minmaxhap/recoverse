<template>
  <AppShell variant="write">
    <BackHeader label="복간 — 종이 회고 옮기기" @back="$emit('back')" />
    <p class="lede">보이는 그대로 옮겨 적으면, 지난 호로 책장에 꽂혀요.</p>

    <div class="stack">
      <input v-model="year" class="field" inputmode="numeric" placeholder="연도 (예: 2019)" />
      <input v-model="namesInput" class="field" placeholder="참여자 (쉼표 구분 — 예: 민희, 지원)" />
    </div>

    <RoundEditor :participants="participants" :rounds="rounds" @update:rounds="rounds = $event" />

    <div class="gap" />
    <button class="cta" :disabled="!canPublish" @click="publish">
      지난 호로 꽂기 ({{ rounds.length }}개 질문)
    </button>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Round } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import RoundEditor from '../components/RoundEditor.vue';
import { issueFromDraft } from '../lib/issueBuilder';
import { useShelf } from '../composables/useShelf';

const emit = defineEmits<{ back: []; published: [] }>();

const shelf = useShelf();
const year = ref('');
const namesInput = ref('');
const rounds = ref<Round[]>([]);

const participants = computed(() =>
  namesInput.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);
const validYear = computed(() => /^\d{4}$/.test(year.value.trim()));
const canPublish = computed(() => validYear.value && participants.value.length > 0 && rounds.value.length > 0);

function publish() {
  if (!canPublish.value) return;
  // 연도만 아는 복간 → date는 그 해 1월 1일로 (다시 발견 연도는 date.slice(0,4)로 파생)
  const date = `${year.value.trim()}-01-01`;
  const issue = issueFromDraft(
    {
      kind: 'yearend',
      date,
      title: `${year.value.trim()} 연말호 (복간)`,
      participants: participants.value,
      rounds: rounds.value,
    },
    'paper',
  );
  shelf.add(issue);
  emit('published');
}
</script>
