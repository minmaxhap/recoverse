<template>
  <AppShell variant="read">
    <div class="adminShell">
      <header class="adminHead">
        <div>
          <span class="eyebrow red">VOC ADMIN</span>
          <h1>의견 상태 관리</h1>
        </div>
        <button class="cta ghost" type="button" @click="$emit('back')">서재로</button>
      </header>

      <div class="adminAuth">
        <input v-model="token" class="input" type="password" placeholder="ADMIN_TOKEN" />
        <button class="cta" type="button" @click="load">불러오기</button>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="loading" class="waiting">불러오는 중...</p>

      <section v-else class="vocList">
        <p v-if="entries.length === 0" class="waiting">아직 접수된 의견이 없어요.</p>
        <article v-for="entry in entries" :key="entry.id" class="vocRow">
          <div class="vocMeta">
            <strong>{{ entry.type }}</strong>
            <span>{{ entry.status }}</span>
            <small>{{ entry.createdAt }}</small>
          </div>
          <p>{{ entry.message }}</p>
          <p v-if="entry.contact || entry.authorName" class="fineprint">
            {{ [entry.authorName, entry.contact].filter(Boolean).join(' · ') }}
          </p>
          <div class="statusGrid">
            <button
              v-for="status in statuses"
              :key="status"
              type="button"
              class="statusBtn"
              :data-active="entry.status === status"
              @click="changeStatus(entry.id, status)"
            >
              {{ status }}
            </button>
          </div>
        </article>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VOC_STATUSES, type VocEntry, type VocStatus } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import { api } from '../lib/api';

defineEmits<{ back: [] }>();

const token = ref('');
const loading = ref(false);
const error = ref('');
const entries = ref<VocEntry[]>([]);
const statuses = VOC_STATUSES as readonly VocStatus[];

async function load(): Promise<void> {
  error.value = '';
  loading.value = true;
  try {
    const res = await api.listVoc(token.value);
    entries.value = res.entries;
  } catch (caught) {
    if (caught instanceof Error) {
      error.value = '관리자 토큰을 확인해주세요.';
      return;
    }
    error.value = '의견 목록을 불러오지 못했어요.';
  } finally {
    loading.value = false;
  }
}

async function changeStatus(id: string, status: VocStatus): Promise<void> {
  error.value = '';
  try {
    await api.updateVocStatus(token.value, id, status);
    await load();
  } catch (caught) {
    if (caught instanceof Error) {
      error.value = '상태를 바꾸지 못했어요.';
      return;
    }
    error.value = '상태를 저장하지 못했어요.';
  }
}
</script>

<style scoped>
.adminShell {
  display: grid;
  gap: 18px;
}

.adminHead {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.adminHead h1 {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: 30px;
}

.adminAuth {
  display: flex;
  gap: 8px;
}

.input {
  min-width: 0;
  flex: 1;
}

.vocList {
  display: grid;
  gap: 12px;
}

.vocRow {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--hairline);
  background: var(--paper-card);
}

.vocMeta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--dim);
}

.vocMeta strong {
  color: var(--ink);
}

.statusGrid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.statusBtn {
  padding: 5px 8px;
  background: var(--paper);
  border: 1px solid var(--hairline);
  color: var(--ink);
  font-size: 12px;
  cursor: pointer;
}

.statusBtn[data-active='true'] {
  border-color: var(--vermilion);
  color: var(--vermilion);
  font-weight: 800;
}
</style>
