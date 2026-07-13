<template>
  <AppShell variant="read">
    <BackHeader class="noPrint" label="책장으로" @back="$emit('back')" />

    <header class="issueHead">
      <span class="eyebrow red">{{ issue.date.slice(0, 4) }} ISSUE</span>
      <input v-if="editing" v-model="draftTitle" class="field pageTitleInput" type="text" aria-label="호 제목" />
      <h1 v-else class="pageTitle">{{ issue.title }}</h1>
      <div class="rule" />
      <p class="fineprint">{{ issue.participants.join(' · ') }}</p>
    </header>

    <div class="exportActions noPrint" aria-label="내보내기">
      <button v-if="!editing" class="ghost" type="button" @click="startEdit">제목·답변 수정</button>
      <template v-else>
        <button class="ghost" type="button" @click="saveEdit">저장</button>
        <button class="ghost" type="button" @click="cancelEdit">취소</button>
      </template>
      <button class="ghost" type="button" @click="printIssue">PDF로 저장 / 인쇄</button>
      <p class="fineprint">브라우저 인쇄 창에서 대상 장치를 “PDF로 저장”으로 고르면 파일로 보관할 수 있어요.</p>
    </div>

    <article v-for="(round, i) in issue.rounds" :key="i" class="archiveRound">
      <SpreadLayout :two-col="round.answers && Object.keys(round.answers).length >= 4">
        <template #left>
          <Headline :no="i + 1" :question="round.question" :asker="round.asker" />
        </template>
        <template #right>
          <div v-if="editing" class="editAnswers">
            <label v-for="name in issue.participants.filter((p) => draftRounds[i]?.answers[p])" :key="name" class="editAnswer">
              <span class="editAnswerName">{{ name }}</span>
              <textarea v-model="draftRounds[i].answers[name].text" class="field area short" />
            </label>
          </div>
          <RoundAnswers
            v-else
            :participants="issue.participants"
            :answers="round.answers"
            :format="round.format"
            still
          />
        </template>
      </SpreadLayout>
    </article>

    <p v-if="issue.rounds.length === 0" class="empty">아직 옮겨 적은 질문이 없는 호예요.</p>

    <div class="gap big noPrint" />
    <div class="shareBox noPrint">
      <button class="ghost" :disabled="sharing" @click="onShare">
        {{ sharing ? '링크 만드는 중…' : shareUrl ? '공유 링크 다시 복사' : '읽기 전용 공유 링크 만들기' }}
      </button>
      <p v-if="shareUrl" class="shareUrl">{{ copied ? '링크를 복사했어요 ✓' : shareUrl }}</p>
      <p v-if="shareError" class="error">{{ shareError }}</p>
      <p class="fineprint">링크를 아는 사람은 이 호를 읽을 수 있어요.</p>
    </div>

    <div class="gap noPrint" />
    <button class="endLink noPrint" @click="onRemove">이 호를 책장에서 빼기</button>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Issue, Round } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import Headline from '../components/Headline.vue';
import RoundAnswers from '../components/RoundAnswers.vue';
import SpreadLayout from '../components/SpreadLayout.vue';
import { useShelf } from '../composables/useShelf';
import { api, ApiError } from '../lib/api';

const props = defineProps<{ issue: Issue }>();
const emit = defineEmits<{ back: []; removed: [] }>();

const shelf = useShelf();

const sharing = ref(false);
const shareUrl = ref('');
const copied = ref(false);
const shareError = ref('');

const editing = ref(false);
const draftTitle = ref('');
const draftRounds = ref<Round[]>([]);

function cloneRounds(rounds: Round[]): Round[] {
  return rounds.map((r) => ({
    ...r,
    answers: Object.fromEntries(Object.entries(r.answers).map(([name, a]) => [name, { ...a }])),
  }));
}

function startEdit() {
  draftTitle.value = props.issue.title;
  draftRounds.value = cloneRounds(props.issue.rounds);
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
}

function saveEdit() {
  shelf.update(props.issue.id, { title: draftTitle.value, rounds: draftRounds.value });
  editing.value = false;
}

function shareLink(id: string): string {
  return `${window.location.origin}${window.location.pathname}?share=${id}`;
}

function printIssue(): void {
  window.print();
}

async function onShare() {
  if (sharing.value) return;
  shareError.value = '';
  try {
    // 이미 공유한 호면 같은 링크 재사용 (서버 스냅샷이 그대로 남아 있음)
    let id = props.issue.shareId;
    if (!id) {
      sharing.value = true;
      const res = await api.createShare(props.issue);
      id = res.shareId;
      shelf.update(props.issue.id, { shareId: id });
    }
    shareUrl.value = shareLink(id);
    try {
      await navigator.clipboard.writeText(shareUrl.value);
      copied.value = true;
    } catch {
      copied.value = false;
    }
  } catch (e) {
    shareError.value = e instanceof ApiError ? e.message : '공유 링크를 만들지 못했어요.';
  } finally {
    sharing.value = false;
  }
}

function onRemove() {
  if (!window.confirm('이 호를 책장에서 뺄까요? 되돌릴 수 없어요.')) return;
  shelf.remove(props.issue.id);
  emit('removed');
}
</script>

<style scoped>
.issueHead {
  margin: 8px 0 26px;
  display: grid;
  gap: 8px;
}
.archiveRound {
  margin-bottom: 34px;
}
.exportActions {
  display: grid;
  gap: 8px;
  margin: 0 0 26px;
}
.empty {
  font-size: 14px;
  color: var(--dim);
}
.pageTitleInput {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
}
.editAnswers {
  display: grid;
  gap: 14px;
}
.editAnswer {
  display: grid;
  gap: 6px;
}
.editAnswerName {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--dim);
}
.shareBox {
  display: grid;
  gap: 8px;
}
.shareUrl {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--hairline);
  background: var(--paper-card);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
  color: var(--dim-strong);
}
</style>
