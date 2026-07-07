<template>
  <div>
    <template v-if="myTurn">
      <h1 class="pageTitle">{{ roundNo }}번째 헤드라인,<br />내 차례</h1>
      <p class="lede">모두에게 던질 질문을 적어주세요.</p>
      <textarea
        v-model="draft"
        class="field area"
        placeholder="예) 올해의 나를 건물 하나로 표현한다면?"
      />
      <PastQuestions :history="state.meta.history" />
      <div class="gap" />
      <button class="cta" :disabled="!draft.trim() || busy" @click="onSubmit">헤드라인 확정</button>
    </template>

    <div v-else class="center">
      <ParticipantDot :color="colorFor(state.meta.asker ?? '', state.players)" :size="56" pulse />
      <h1 class="pageTitle centered">{{ state.meta.asker }}이(가)<br />질문을 쓰는 중</h1>
      <PastQuestions :history="state.meta.history" centered />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SessionStateResponse } from '@recoverse/shared';
import ParticipantDot from '../../components/ParticipantDot.vue';
import PastQuestions from '../../components/PastQuestions.vue';
import { colorFor } from '../../lib/palette';
import { api } from '../../lib/api';

const props = defineProps<{ state: SessionStateResponse; me: string }>();
const emit = defineEmits<{ applied: [SessionStateResponse] }>();

const draft = ref('');
const busy = ref(false);
const roundNo = computed(() => props.state.meta.roundIdx + 1);
const myTurn = computed(() => props.state.meta.asker === props.me);

async function onSubmit() {
  if (!draft.value.trim() || busy.value) return;
  busy.value = true;
  try {
    const next = await api.question(props.state.meta.code, props.me, draft.value.trim());
    draft.value = '';
    emit('applied', next);
  } catch {
    /* 폴링 복구 */
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.center {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding-top: 8vh;
  text-align: center;
}
</style>
