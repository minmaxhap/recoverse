<template>
  <AppShell variant="write">
    <BackHeader label="혼자 쓰기" @back="$emit('back')" />
    <p class="lede">스스로에게 질문을 던지고 답해보세요. 발행하면 책장에 꽂혀요.</p>

    <div class="stack">
      <KindChips v-model="kind" />
      <input v-model="title" class="field" placeholder="제목 (예: 제주 여행 회고, 6월의 회고)" />
      <input v-model="name" class="field" placeholder="내 이름" />
    </div>

    <RoundEditor :participants="participants" :rounds="rounds" @update:rounds="rounds = $event" />

    <div class="gap" />
    <button class="cta" :disabled="!canPublish" @click="publish">
      발행하기 ({{ rounds.length }}개 질문)
    </button>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Kind, Round } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import KindChips from '../components/KindChips.vue';
import RoundEditor from '../components/RoundEditor.vue';
import { issueFromDraft } from '../lib/issueBuilder';
import { useShelf } from '../composables/useShelf';

const emit = defineEmits<{ back: []; published: [] }>();

const shelf = useShelf();
const kind = ref<Kind>('free');
const title = ref('');
const name = ref('');
const rounds = ref<Round[]>([]);

const participants = computed(() => (name.value.trim() ? [name.value.trim()] : []));
const canPublish = computed(() => participants.value.length > 0 && rounds.value.length > 0);

function publish() {
  if (!canPublish.value) return;
  const date = new Date().toISOString().slice(0, 10);
  const issue = issueFromDraft(
    { kind: kind.value, date, title: title.value, participants: participants.value, rounds: rounds.value },
    'solo',
  );
  shelf.add(issue);
  emit('published');
}
</script>
