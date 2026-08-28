<template>
  <div class="pastPick" :class="{ open }">
    <button v-if="!open" type="button" class="pickOpen" @click="openPanel">지난 호 질문 다시 쓰기</button>

    <div v-else class="panel">
      <div class="panelHead">
        <span class="eyebrow">지난 호에서 고르기</span>
        <button type="button" class="close" aria-label="닫기" @click="open = false">✕</button>
      </div>

      <input
        ref="searchEl"
        v-model="query"
        class="field searchField"
        type="text"
        placeholder="질문 검색"
        aria-label="지난 호 질문 검색"
      />

      <p v-if="candidates.length === 0" class="helper">
        {{ query.trim() ? '찾는 질문이 없어요.' : '지난 호에 아직 가져올 질문이 없어요.' }}
      </p>

      <ul v-else class="list">
        <li v-for="group in visible" :key="group.key">
          <button type="button" class="pick" @click="choose(group.question)">
            <span class="qText">{{ group.question }}</span>
            <span class="qMeta">
              {{ latestOf(group).issueTitle }} · {{ latestOf(group).year }}
              <em v-if="group.years.length > 1">{{ group.years.length }}개의 해</em>
            </span>
          </button>
        </li>
      </ul>

      <button v-if="hiddenCount > 0" type="button" class="moreLink" @click="showAll = true">
        {{ hiddenCount }}개 더 보기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { normalizeQuestion, type Issue } from '@recoverse/shared';
import { filterGroups, groupByQuestion, type QuestionGroup } from '../lib/rediscover';

const props = defineProps<{
  readonly issues: readonly Issue[];
  /** 이미 목차에 있거나 지금 쓰고 있는 질문 — 다시 권하지 않는다. */
  readonly exclude: readonly string[];
}>();
const emit = defineEmits<{ pick: [string] }>();

/** 검색으로 좁히기 전에도 훑을 만한 길이 */
const VISIBLE = 6;

const open = ref(false);
const query = ref('');
const showAll = ref(false);
const searchEl = ref<HTMLInputElement | null>(null);

const excluded = computed(() => new Set(props.exclude.map(normalizeQuestion).filter(Boolean)));

// 같은 질문이 여러 해에 걸쳐 있으면 한 줄로 묶인다 — 같은 질문을 다시 만나는 게 이 앱의 핵심이라서.
const candidates = computed(() =>
  filterGroups(groupByQuestion([...props.issues]), query.value).filter((group) => !excluded.value.has(group.key)),
);
const visible = computed(() => (showAll.value ? candidates.value : candidates.value.slice(0, VISIBLE)));
const hiddenCount = computed(() => (showAll.value ? 0 : Math.max(0, candidates.value.length - VISIBLE)));

function latestOf(group: QuestionGroup) {
  return group.entries[group.entries.length - 1];
}

function openPanel(): void {
  open.value = true;
  query.value = '';
  showAll.value = false;
  void nextTick(() => searchEl.value?.focus());
}

// 빈 목차의 시작 안내에서 이 패널을 대신 열어준다.
defineExpose({ open: openPanel });

function choose(question: string): void {
  emit('pick', question);
  open.value = false;
}

// 검색을 고치면 다시 짧은 목록으로 — 좁힌 결과부터 보게.
watch(query, () => {
  showAll.value = false;
});
</script>

<style scoped>
.pickOpen {
  background: none;
  border: none;
  padding: 8px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--vermilion);
  text-decoration: underline;
  cursor: pointer;
}

.panel {
  margin-top: 12px;
  border: 1px solid var(--ink);
  background: var(--paper-card);
  padding: 14px;
  display: grid;
  gap: 12px;
}

.panelHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--dim);
  cursor: pointer;
  padding: 0 2px;
}

.searchField {
  padding: 10px 12px;
  font-size: 14px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
}

.pick {
  width: 100%;
  display: grid;
  gap: 3px;
  text-align: left;
  background: none;
  border: none;
  border-top: 1px solid var(--hairline);
  padding: 11px 2px;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
}

.list li:first-child .pick {
  border-top: none;
}

.qText {
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.5;
  transition: color 0.12s ease;
}

.pick:hover .qText {
  color: var(--vermilion);
}

.qMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--dim);
}

.qMeta em {
  font-style: normal;
  color: var(--vermilion);
}

.moreLink {
  justify-self: start;
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--dim-strong);
  text-decoration: underline;
  cursor: pointer;
}

.moreLink:hover {
  color: var(--vermilion);
}
</style>
