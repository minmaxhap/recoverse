<template>
  <AppShell variant="write">
    <BackHeader :label="creating ? '새 호 발행' : '코드로 참여'" @back="$emit('back')" />
    <h1 class="pageTitle">{{ creating ? '이번 호의 발행인은?' : '어느 호에 합류해요?' }}</h1>

    <div class="stack">
      <KindChips v-if="creating" v-model="kind" />
      <input
        v-if="!creating"
        v-model="codeDraft"
        class="field code"
        placeholder="세션 코드 4자리"
        maxlength="4"
        autocapitalize="characters"
        @input="codeDraft = codeDraft.toUpperCase()"
      />
      <input v-model="nameDraft" class="field" placeholder="내 이름" maxlength="12" />
      <p v-if="error" class="error">{{ error }}</p>
      <button class="cta" :disabled="busy || !canSubmit" @click="submit">
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
      identity.set(state.meta.code, name, true);
      emit('entered', state.meta.code);
    } else {
      const code = codeDraft.value.trim().toUpperCase();
      await api.join(code, name);
      identity.set(code, name, false);
      emit('entered', code);
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '연결에 실패했어요. 잠시 후 다시 시도해주세요.';
  } finally {
    busy.value = false;
  }
}
</script>
