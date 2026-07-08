<template>
  <div>
    <template v-if="myTurn">
      <h1 class="pageTitle">{{ roundNo }}번째 헤드라인,<br />내 차례</h1>
      <p class="lede">모두에게 던질 질문을 적어주세요.</p>
      <div class="formatChips" role="radiogroup" aria-label="회고 포맷">
        <button
          type="button"
          role="radio"
          :aria-checked="formatId === ''"
          class="fchip"
          :class="{ active: formatId === '' }"
          @click="selectFormat('')"
        >
          자유 질문
        </button>
        <button
          v-for="format in FORMATS"
          :key="format.id"
          type="button"
          role="radio"
          :aria-checked="formatId === format.id"
          class="fchip"
          :class="{ active: formatId === format.id }"
          @click="selectFormat(format.id)"
        >
          {{ format.label }}
        </button>
      </div>
      <textarea
        v-model="draft"
        class="field area"
        :readonly="!!formatId"
        placeholder="예) 올해의 나를 건물 하나로 표현한다면?"
      />
      <QuestionSuggest v-if="!formatId" :kind="state.meta.kind" :exclude="pastQuestions" @pick="onPick" />
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
import QuestionSuggest from '../../components/QuestionSuggest.vue';
import { colorFor } from '../../lib/palette';
import { api } from '../../lib/api';
import { FORMATS, getFormat } from '../../data/formats';

const props = defineProps<{ state: SessionStateResponse; me: string; playerToken: string }>();
const emit = defineEmits<{ applied: [SessionStateResponse] }>();

const draft = ref('');
const formatId = ref('');
const busy = ref(false);
const roundNo = computed(() => props.state.meta.roundIdx + 1);
const myTurn = computed(() => props.state.meta.asker === props.me);
const pastQuestions = computed(() => props.state.meta.history.map((r) => r.question));

function onPick(question: string) {
  formatId.value = '';
  draft.value = question;
}

function selectFormat(id: string) {
  formatId.value = id;
  const format = getFormat(id);
  if (format) draft.value = format.prompt;
}

async function onSubmit() {
  if (!draft.value.trim() || busy.value) return;
  busy.value = true;
  try {
    const next = await api.question(
      props.state.meta.code,
      props.me,
      props.playerToken,
      draft.value.trim(),
      formatId.value || undefined,
    );
    draft.value = '';
    formatId.value = '';
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
.formatChips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.fchip {
  padding: 6px 11px;
  font-size: 12px;
  font-weight: 700;
  background: var(--paper);
  color: var(--ink);
  border: 1px solid var(--ink);
  cursor: pointer;
}
.fchip.active {
  background: var(--ink);
  color: var(--paper);
}
</style>
