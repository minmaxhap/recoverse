<template>
  <div>
    <Headline :no="roundNo" :question="state.meta.question ?? ''" :asker="state.meta.asker ?? ''" />

    <template v-if="iAnswered">
      <div class="center small">
        <p class="waiting">제출 완료 — {{ state.answered.length }}/{{ state.players.length }}명 답했어요</p>
        <div class="dotRow">
          <ParticipantDot
            v-for="name in state.players"
            :key="name"
            :color="colorFor(name, state.players)"
            :dim="!state.answered.includes(name)"
          />
        </div>
        <p class="fineprint">{{ waitingHint }}</p>
      </div>
    </template>

    <template v-else>
      <textarea v-model="draft" class="field area" placeholder="지금 떠오르는 그대로, 짧아도 좋아요" />
      <div class="gap" />
      <button class="cta" :disabled="!draft.trim() || busy" @click="onSubmit">내 답 싣기</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SessionStateResponse } from '@recoverse/shared';
import Headline from '../../components/Headline.vue';
import ParticipantDot from '../../components/ParticipantDot.vue';
import { colorFor } from '../../lib/palette';
import { api } from '../../lib/api';

const props = defineProps<{ state: SessionStateResponse; me: string }>();
const emit = defineEmits<{ applied: [SessionStateResponse] }>();

const draft = ref('');
const busy = ref(false);
const sent = ref(false);

const roundNo = computed(() => props.state.meta.roundIdx + 1);
const iAnswered = computed(() => sent.value || props.state.answered.includes(props.me));
const waitingHint = computed(() =>
  props.state.players.length >= 3 ? '모두 제출하면 누가 썼게가 시작돼요' : '모두 제출하면 스프레드가 열려요',
);

async function onSubmit() {
  if (!draft.value.trim() || busy.value) return;
  busy.value = true;
  try {
    const next = await api.answer(props.state.meta.code, props.me, draft.value.trim());
    sent.value = true;
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
  text-align: center;
}
.center.small {
  padding-top: 10px;
}
.dotRow {
  display: flex;
  gap: 10px;
}
</style>
