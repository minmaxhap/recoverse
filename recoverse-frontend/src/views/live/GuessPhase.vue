<template>
  <div>
    <Headline :no="roundNo" :question="state.meta.question ?? ''" :asker="state.meta.asker ?? ''" />

    <template v-if="iGuessed">
      <div class="center small" role="status">
        <p class="waiting">추측 완료 — {{ state.guessed.length }}/{{ state.players.length }}명</p>
        <p v-if="pendingGuessNames.length > 0" class="fineprint">{{ pendingGuessNames.join(', ') }} 님 추측 기다리는 중</p>
        <p class="fineprint">모두 추측하면 작성자가 공개돼요</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button
          v-if="isHost"
          type="button"
          class="ghost forceBtn"
          :disabled="busy"
          :aria-busy="busy"
          @click="onReveal"
        >
          {{ busy ? '공개 중…' : '그냥 공개하기' }}
        </button>
      </div>
    </template>

    <template v-else>
      <p class="lede">누가 어떤 답을 썼을까요? 각 답에 이름을 배정해주세요.</p>
      <div class="spread">
        <figure v-for="entry in order" :key="entry.owner" class="quote">
          <blockquote>
            <b class="label">{{ entry.label }}.</b> {{ answerText(entry.owner) }}
          </blockquote>
          <figcaption v-if="entry.owner === me" class="mine">
            <span class="eyebrow gold">내 답</span>
          </figcaption>
          <figcaption v-else class="chips">
            <button
              v-for="candidate in otherNames"
              :key="candidate"
              type="button"
              class="nameChip"
              :class="{
                picked: assignment[entry.owner] === candidate,
                used: usedBy(candidate) && assignment[entry.owner] !== candidate,
              }"
              :aria-pressed="assignment[entry.owner] === candidate"
              :disabled="usedBy(candidate) && assignment[entry.owner] !== candidate"
              @click="pick(entry.owner, candidate)"
            >
              {{ candidate }}
            </button>
          </figcaption>
        </figure>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="button" class="cta" :disabled="!allAssigned || busy" :aria-busy="busy" @click="onConfirm">
        {{ busy ? '확정 중…' : '추측 확정' }}
      </button>
      <p class="waiting" role="status">{{ state.guessed.length }}/{{ state.players.length }}명 추측 완료</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SessionStateResponse } from '@recoverse/shared';
import Headline from '../../components/Headline.vue';
import { shuffledAnswerOrder } from '../../lib/guessing';
import { api } from '../../lib/api';

const props = defineProps<{ state: SessionStateResponse; me: string; isHost: boolean; playerToken: string }>();
const emit = defineEmits<{ applied: [SessionStateResponse] }>();

const busy = ref(false);
const error = ref('');
const assignment = ref<Record<string, string>>({}); // owner → guessedName

const roundNo = computed(() => props.state.meta.roundIdx + 1);
const iGuessed = computed(() => props.state.guessed.includes(props.me));

// 전 기기 동일한 결정적 셔플 순서
const order = computed(() =>
  props.state.answers
    ? shuffledAnswerOrder(props.state.meta.code, props.state.meta.roundIdx, props.state.answers)
    : [],
);
const otherNames = computed(() => props.state.players.filter((p) => p !== props.me));
const pendingGuessNames = computed(() => props.state.players.filter((n) => !props.state.guessed.includes(n)));

function answerText(owner: string): string {
  return props.state.answers?.[owner]?.text ?? '';
}

function usedBy(candidate: string): boolean {
  return Object.values(assignment.value).includes(candidate);
}

function pick(owner: string, candidate: string) {
  const next = { ...assignment.value };
  if (next[owner] === candidate) {
    delete next[owner];
  } else {
    next[owner] = candidate;
  }
  assignment.value = next;
}

const allAssigned = computed(() => {
  const assignable = order.value.filter((e) => e.owner !== props.me).map((e) => e.owner);
  return assignable.length > 0 && assignable.every((o) => assignment.value[o]);
});

async function onConfirm() {
  if (!allAssigned.value || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    const next = await api.guess(props.state.meta.code, props.me, props.playerToken, assignment.value);
    emit('applied', next);
  } catch (e) {
    if (e instanceof Error) {
      error.value = '추측을 저장하지 못했어요. 연결을 확인하고 다시 시도해주세요.';
    } else {
      error.value = '추측을 저장하지 못했어요. 잠시 후 다시 시도해주세요.';
    }
  } finally {
    busy.value = false;
  }
}

async function onReveal() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    const next = await api.reveal(props.state.meta.code, props.me, props.playerToken);
    emit('applied', next);
  } catch (e) {
    if (e instanceof Error) {
      error.value = '공개하지 못했어요. 연결을 확인하고 다시 시도해주세요.';
    } else {
      error.value = '공개하지 못했어요. 잠시 후 다시 시도해주세요.';
    }
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.spread {
  display: grid;
  gap: 0;
  margin-bottom: 20px;
}
.quote {
  margin: 0;
  padding: 16px 2px;
  border-bottom: 1px solid var(--hairline);
}
.quote blockquote {
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: 17px;
  line-height: 1.75;
}
.label {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--vermilion);
  margin-right: 4px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.nameChip {
  border: 1px solid var(--ink);
  background: var(--paper-card);
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
  color: var(--ink);
  transition: background 0.12s ease, color 0.12s ease, transform 0.1s ease;
}
.nameChip:not(:disabled):hover {
  background: var(--ink);
  color: var(--paper);
}
.nameChip:not(:disabled):active {
  transform: scale(0.95);
}
.nameChip:focus-visible {
  outline: 2px solid var(--vermilion);
  outline-offset: 2px;
}
.nameChip.picked {
  background: var(--ink);
  color: var(--paper);
}
.nameChip.used {
  opacity: 0.3;
  cursor: default;
}
.mine {
  min-height: 22px;
}
.center {
  display: grid;
  justify-items: center;
  gap: 12px;
  text-align: center;
}
.center.small {
  padding-top: 10px;
}
.forceBtn {
  width: auto;
  padding: 10px 16px;
  margin-top: 8px;
}
</style>
