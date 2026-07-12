<template>
  <AppShell variant="write">
    <BackHeader :label="creating ? '새 호 발행' : '코드로 참여'" @back="$emit('back')" />
    <h1 class="pageTitle">{{ creating ? '이번 호의 발행인은?' : '어느 호에 합류해요?' }}</h1>

    <div class="stack">
      <KindChips v-if="creating" v-model="kind" />

      <div v-if="!creating" class="fieldGroup">
        <label class="fieldLabel" for="sessionCode">세션 코드</label>
        <input
          id="sessionCode"
          v-model="codeDraft"
          class="field code"
          placeholder="ABCD"
          maxlength="4"
          inputmode="text"
          autocapitalize="characters"
          autocomplete="one-time-code"
          spellcheck="false"
          :aria-invalid="Boolean(error)"
          aria-describedby="sessionCodeHelp entryError"
          @input="codeDraft = codeDraft.toUpperCase()"
        />
        <span id="sessionCodeHelp" class="helper">초대받은 4자리 코드를 입력해요.</span>
      </div>

      <div class="fieldGroup">
        <label class="fieldLabel" for="playerName">{{ creating ? '발행인 이름' : '내 이름' }}</label>
        <input
          id="playerName"
          v-model="nameDraft"
          class="field"
          placeholder="이름"
          maxlength="12"
          autocomplete="name"
          :aria-invalid="Boolean(error)"
          aria-describedby="playerNameHelp entryError"
        />
        <span id="playerNameHelp" class="helper">이번 호에 표시될 이름이에요.</span>
      </div>

      <p v-if="error" id="entryError" class="error" role="alert">{{ error }}</p>
      <p v-else-if="busy" class="inlineNotice" role="status">세션과 연결하고 있어요.</p>
      <button type="button" class="cta" :disabled="busy || !canSubmit" :aria-busy="busy" @click="submit">
        {{ busy ? '연결 중…' : creating ? '발행 준비' : '합류하기' }}
      </button>
      <p v-if="creating" class="fineprint">
        세션 내용은 이 프로토타입의 공유 저장소에 올라가요 — 코드를 아는 사람은 볼 수 있어요.
      </p>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Kind } from '@recoverse/shared';
import AppShell from '../../components/AppShell.vue';
import BackHeader from '../../components/BackHeader.vue';
import KindChips from '../../components/KindChips.vue';
import { api, ApiError } from '../../lib/api';
import { useIdentity } from '../../composables/useIdentity';

const props = defineProps<{ intent: 'create' | 'join' }>();
const emit = defineEmits<{ back: []; entered: [string] }>();

const creating = computed(() => props.intent === 'create');
const identity = useIdentity();

const kind = ref<Kind>('yearend');
const nameDraft = ref('');
const codeDraft = ref('');
const busy = ref(false);
const error = ref('');

const canSubmit = computed(
  () => nameDraft.value.trim().length > 0 && (creating.value || codeDraft.value.length === 4),
);

async function submit() {
  if (!canSubmit.value || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    const name = nameDraft.value.trim();
    if (creating.value) {
      const state = await api.createSession(name, kind.value);
      identity.set(state.meta.code, name, true, state.playerToken);
      emit('entered', state.meta.code);
    } else {
      const code = codeDraft.value.trim().toUpperCase();
      const state = await api.join(code, name);
      identity.set(code, name, false, state.playerToken);
      emit('entered', code);
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '연결에 실패했어요. 잠시 후 다시 시도해주세요.';
  } finally {
    busy.value = false;
  }
}
</script>
