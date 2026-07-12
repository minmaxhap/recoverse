<template>
  <div>
    <Headline :no="roundNo" :question="state.meta.question ?? ''" :asker="state.meta.asker ?? ''" />

    <template v-if="iAnswered">
      <div class="center small" role="status">
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
      <div class="fieldGroup">
        <label class="fieldLabel" for="answerDraft">내 답</label>
        <textarea
          id="answerDraft"
          v-model="draft"
          class="field area"
          :placeholder="answerPlaceholder"
          :aria-invalid="Boolean(error)"
          aria-describedby="answerHelp answerError"
        />
        <span id="answerHelp" class="helper">짧은 메모여도 괜찮아요. 나중에 그대로 한 면이 됩니다.</span>
      </div>
      <div class="reflectionPrompts">
        <p class="fineprint">막히면 하나만 눌러서 이어 써보세요.</p>
        <div class="promptChips">
          <button
            v-for="prompt in expansionPrompts"
            :key="prompt"
            type="button"
            class="promptChip"
            @click="appendPrompt(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
      </div>
      <div class="gap" />
      <p v-if="error" id="answerError" class="error" role="alert">{{ error }}</p>
      <p v-else-if="busy" class="inlineNotice" role="status">답을 싣고 있어요.</p>
      <button type="button" class="cta" :disabled="!draft.trim() || busy" :aria-busy="busy" @click="onSubmit">
        {{ busy ? '싣는 중…' : '내 답 싣기' }}
      </button>
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
import { getFormat } from '../../data/formats';

const props = defineProps<{ state: SessionStateResponse; me: string; playerToken: string }>();
const emit = defineEmits<{ applied: [SessionStateResponse] }>();

const expansionPrompts = [
  '그때 가장 선명한 장면은?',
  '왜 그렇게 느꼈을까?',
  '지금의 나는 뭐라고 답할까?',
] as const;

const draft = ref('');
const busy = ref(false);
const sent = ref(false);
const error = ref('');

const roundNo = computed(() => props.state.meta.roundIdx + 1);
const iAnswered = computed(() => sent.value || props.state.answered.includes(props.me));
const answerPlaceholder = computed(() => getFormat(props.state.meta.format ?? '')?.hint ?? '지금 떠오르는 그대로, 짧아도 좋아요');
const waitingHint = computed(() =>
  props.state.players.length >= 3 ? '모두 제출하면 누가 썼게가 시작돼요' : '모두 제출하면 스프레드가 열려요',
);

function appendPrompt(prompt: string) {
  const separator = draft.value.trim().length > 0 ? '\n\n' : '';
  draft.value = `${draft.value}${separator}${prompt}\n`;
}

async function onSubmit() {
  if (!draft.value.trim() || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    const next = await api.answer(props.state.meta.code, props.me, props.playerToken, draft.value.trim());
    sent.value = true;
    emit('applied', next);
  } catch (e) {
    if (e instanceof Error) {
      error.value = '답을 저장하지 못했어요. 연결을 확인하고 다시 시도해주세요.';
    } else {
      error.value = '답을 저장하지 못했어요. 잠시 후 다시 시도해주세요.';
    }
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
.reflectionPrompts {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}
.promptChips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.promptChip {
  padding: 8px 10px;
  border: 1px solid var(--hairline);
  background: var(--paper-card);
  color: var(--dim-strong);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.promptChip:focus-visible {
  outline: 2px solid var(--vermilion);
  outline-offset: 2px;
}
</style>
