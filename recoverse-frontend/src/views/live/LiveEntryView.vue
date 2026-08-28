<template>
  <AppShell variant="write">
    <BackHeader :label="creating ? '친구들과 시작' : '코드로 참여'" @back="$emit('back')" />
    <h1 class="pageTitle">{{ creating ? '누구와 질문 놀이를 시작할까요?' : '초대 코드로 들어가기' }}</h1>

    <div class="stack">
      <details v-if="creating" class="kindDisclosure">
        <summary class="kindSummary">
          <span>모임 성격 (선택)</span>
          <span class="kindChevron" aria-hidden="true">＋</span>
        </summary>
        <div class="kindBody">
          <KindChips v-model="kind" />
        </div>
      </details>

      <div v-if="!creating" class="fieldGroup">
        <label class="fieldLabel" for="sessionCode">초대 코드</label>
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
          aria-label="초대 코드"
          :aria-invalid="Boolean(error)"
          aria-describedby="sessionCodeHelp entryError"
          @input="codeDraft = codeDraft.toUpperCase()"
        />
        <span id="sessionCodeHelp" class="helper">초대받은 4자리 코드를 입력해요.</span>
      </div>

      <div class="fieldGroup">
        <label class="fieldLabel" for="playerName">내 이름</label>
        <input
          id="playerName"
          v-model="nameDraft"
          class="field"
          placeholder="이름"
          maxlength="12"
          autocomplete="name"
          aria-label="내 이름"
          :aria-invalid="Boolean(error)"
          aria-describedby="entryError"
        />
      </div>

      <p v-if="error" id="entryError" class="error" role="alert">{{ error }}</p>
      <p v-else-if="busy" class="inlineNotice" role="status">세션과 연결하고 있어요.</p>
      <button type="button" class="cta" :disabled="busy || !canSubmit" :aria-busy="busy" @click="submit">
        {{ busy ? '연결 중…' : creating ? '방 만들기' : '들어가기' }}
      </button>
      <div v-if="creating" class="entryPromise">
        <p class="fineprint">초대 코드를 받은 사람들과 답을 함께 봐요.</p>
        <p class="bonusLine">둘이서도 시작할 수 있어요. 3명부터 ‘누가 썼게’도 열려요.</p>
      </div>
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

const props = defineProps<{ intent: 'create' | 'join'; prefillCode?: string }>();
const emit = defineEmits<{ back: []; entered: [string] }>();

const creating = computed(() => props.intent === 'create');
const identity = useIdentity();

const kind = ref<Kind>('yearend');
const nameDraft = ref('');
const codeDraft = ref(props.prefillCode ?? '');
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

<style scoped>
.kindDisclosure {
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
}

.kindSummary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 4px 2px;
  color: var(--dim-strong);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  list-style: none;
  cursor: pointer;
}

.kindSummary::-webkit-details-marker {
  display: none;
}

.kindSummary:focus-visible {
  outline: 2px solid var(--vermilion);
  outline-offset: 3px;
}

.kindChevron {
  color: var(--dim);
  font-size: 18px;
  transition: transform 0.18s ease;
}

.kindDisclosure[open] .kindChevron {
  transform: rotate(45deg);
}

.kindBody {
  padding: 4px 2px 14px;
}

.entryPromise {
  display: grid;
  gap: 4px;
}

.bonusLine {
  margin: 0;
  color: var(--dim-strong);
  font-family: var(--font-display);
  font-size: 13px;
  line-height: 1.6;
}
</style>
