<template>
  <AppShell variant="write">
    <BackHeader label="혼자 엮기" @back="$emit('back')" />

    <header class="soloIntro">
      <span class="eyebrow red">SOLO ISSUE</span>
      <h1 class="pageTitle">오늘의 질문을 한 호로 엮어요</h1>
      <p class="lede">처음부터 완성된 글을 쓰지 않아도 괜찮아요. 질문 하나와 거친 답 하나면 책장에 꽂을 수 있어요.</p>
    </header>

    <section class="issueSetup" aria-labelledby="soloSetupTitle">
      <div class="sectionHead">
        <span class="eyebrow">COVER NOTE</span>
        <h2 id="soloSetupTitle">표지 정보</h2>
      </div>

      <div class="fieldGroup">
        <span class="fieldLabel">이번 호 종류</span>
        <KindChips v-model="kind" />
      </div>

      <label class="fieldGroup">
        <span class="fieldLabel">표지 제목 선택</span>
        <input v-model="title" class="field" :placeholder="defaultIssueTitle" />
        <span class="helper">비워두면 {{ defaultIssueTitle }}로 꽂혀요.</span>
      </label>

      <label class="fieldGroup">
        <span class="fieldLabel">이 호에 실릴 이름</span>
        <input v-model="name" class="field" placeholder="나" />
        <span class="helper">답변 옆 바이라인과 다시 발견에 이 이름이 실려요.</span>
      </label>
    </section>

    <section v-if="shelf.issues.value.length" class="sourceIssue" aria-labelledby="sourceIssueTitle">
      <div class="sectionHead">
        <span class="eyebrow">FROM THE SHELF</span>
        <h2 id="sourceIssueTitle">지난 호 질문 이어쓰기</h2>
      </div>
      <label class="fieldGroup">
        <span class="fieldLabel">질문을 가져올 호</span>
        <select v-model="sourceIssueId" class="field selectField">
          <option value="">새 질문으로 시작</option>
          <option v-for="issue in shelf.issues.value" :key="issue.id" :value="issue.id">
            {{ issue.title }} · 질문 {{ issue.rounds.length }}개
          </option>
        </select>
      </label>
      <p v-if="sourceIssue" class="helper">
        {{ sourceIssue.title }}의 질문을 순서대로 불러와, 지금의 답으로 새 호를 엮어요.
      </p>
    </section>

    <RoundEditor
      :participants="participants"
      :rounds="rounds"
      :current-round="currentRound"
      :kind="kind"
      :template-rounds="templateRounds"
      :draft-state-label="draftStateLabel"
      @update:rounds="updateRounds"
      @update:current-round="updateCurrentRound"
    />

    <p v-if="restoreNotice" class="helper draftNotice" role="status">{{ restoreNotice }}</p>
    <p v-if="editorialError" class="error" role="alert">{{ editorialError }}</p>
    <p class="helper publishHelp">{{ publishHelp }}</p>
    <button class="cta" :disabled="!canPublish || publishing" @click="publish">책장에 꽂기</button>

    <!-- 발행 연출: 표지가 조립되어 책장에 꽂히는 장면 (탭하면 건너뛰기) -->
    <Transition name="page">
      <div v-if="publishing" class="publishOverlay" role="status" @click="finishPublish">
        <span class="eyebrow gold">이번 호 발행</span>
        <PublishScene :year="date.slice(0, 4)" :kind-label="kindLabelText" />
        <p class="pageTitle centered overlayTitle">{{ issueTitle }},<br />책장에 꽂는 중</p>
        <p class="fineprint">탭하면 바로 책장으로 가요</p>
      </div>
    </Transition>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { defaultTitle, KIND_LABELS, kstTodayISO, type Kind, type Round } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import KindChips from '../components/KindChips.vue';
import PublishScene from '../components/PublishScene.vue';
import RoundEditor from '../components/RoundEditor.vue';
import {
  draftHasContent,
  SOLO_DEFAULT_NAME,
  SOLO_ISSUE_DRAFT_VERSION,
  useSoloIssueDraft,
  type SoloIssueCurrentRoundDraft,
  type SoloIssueDraftV2,
} from '../composables/useSoloIssueDraft';
import { useShelf } from '../composables/useShelf';
import { issueFromDraft, roundIsAnswered } from '../lib/issueBuilder';

const emit = defineEmits<{ back: []; published: [] }>();

const shelf = useShelf();
const kind = ref<Kind>('free');
const title = ref('');
const name = ref(SOLO_DEFAULT_NAME);
const rounds = ref<Round[]>([]);
const currentRound = ref<SoloIssueCurrentRoundDraft>({ question: '', formatId: '', answers: {} });
const publishError = ref('');
const restoreNotice = ref('');
const publishing = ref(false);
const sourceIssueId = ref('');
const soloDraft = useSoloIssueDraft();
const draftReady = ref(false);

const date = computed(() => kstTodayISO());
const defaultIssueTitle = computed(() => defaultTitle(kind.value, date.value));
const issueTitle = computed(() => title.value.trim() || defaultIssueTitle.value);
const participants = computed(() => [name.value.trim() || SOLO_DEFAULT_NAME]);
const answeredRoundCount = computed(() => rounds.value.filter(roundIsAnswered).length);
const pendingRoundCount = computed(() => rounds.value.length - answeredRoundCount.value);
const canPublish = computed(() => answeredRoundCount.value > 0);
const kindLabelText = computed(() => KIND_LABELS[kind.value]);
const sourceIssue = computed(() => shelf.issues.value.find((issue) => issue.id === sourceIssueId.value));
const templateRounds = computed(() =>
  (sourceIssue.value?.rounds ?? [])
    .filter((round) => round.question.trim())
    .map((round) => (round.format ? { question: round.question, format: round.format } : { question: round.question })),
);
const publishHelp = computed(() => {
  if (!canPublish.value) return '질문 하나와 답 하나를 목차에 실으면 발행할 수 있어요.';
  if (pendingRoundCount.value > 0) {
    return `지금 발행하면 답을 쓴 ${answeredRoundCount.value}개 질문만 실려요. 답 대기 중인 ${pendingRoundCount.value}개는 빠져요.`;
  }
  return '지금 발행하면 이 호가 내 책장에 저장돼요.';
});
// 홈의 이어쓰기 peek와 같은 기준(draftHasContent)을 쓰도록 draft 객체로 판정한다.
const hasDraftContent = computed(() => draftHasContent(buildDraft()));
const draftStatusMessage = computed(() =>
  soloDraft.savedAt.value && soloDraft.status.value === 'saved' ? `저장됨 ${savedTimeText(soloDraft.savedAt.value)}` : '',
);
const draftStateLabel = computed(() => {
  if (soloDraft.status.value === 'error') return '저장 실패';
  if (draftStatusMessage.value) return draftStatusMessage.value;
  return hasDraftContent.value ? '저장 준비 중' : '새 질문';
});
const draftError = computed(() => {
  if (soloDraft.status.value !== 'error') return '';
  if (soloDraft.error.value === 'not_found') return '';
  return '임시 저장하지 못했어요. 브라우저 저장 공간을 비우고, 이 화면을 닫기 전에 다시 시도해주세요.';
});
const editorialError = computed(() => publishError.value || draftError.value);

function savedTimeText(savedAt: string): string {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(savedAt),
  );
}

function buildDraft(): SoloIssueDraftV2 {
  return {
    version: SOLO_ISSUE_DRAFT_VERSION,
    updatedAt: new Date().toISOString(),
    kind: kind.value,
    title: title.value,
    name: name.value,
    sourceIssueId: sourceIssueId.value,
    rounds: rounds.value,
    currentRound: currentRound.value,
  };
}

function applyDraft(draft: SoloIssueDraftV2): void {
  kind.value = draft.kind;
  title.value = draft.title;
  name.value = draft.name || SOLO_DEFAULT_NAME;
  sourceIssueId.value = draft.sourceIssueId;
  rounds.value = [...draft.rounds];
  currentRound.value = draft.currentRound;
}

function persistDraft(): void {
  const result = soloDraft.save(buildDraft());
  if (!result.ok) restoreNotice.value = '';
}

function restoreDraft(): void {
  const restored = soloDraft.load({ legacy: { kind: kind.value, roundCount: rounds.value.length } });
  let clearedStaleSource = false;
  if (restored.ok) {
    applyDraft(restored.draft);
    restoreNotice.value = restored.migratedFromLegacy ? '이전 질문 임시 저장을 복원했어요.' : '복원됨';
    if (sourceIssueId.value && !sourceIssue.value) {
      sourceIssueId.value = '';
      clearedStaleSource = true;
    }
  }
  draftReady.value = true;
  if (clearedStaleSource) persistDraft();
}

watch(
  [kind, title, name, sourceIssueId, rounds, currentRound],
  () => {
    if (draftReady.value) persistDraft();
  },
  { deep: true, flush: 'sync' },
);

onMounted(restoreDraft);

function updateRounds(nextRounds: Round[]): void {
  rounds.value = nextRounds;
}

function updateCurrentRound(nextRound: SoloIssueCurrentRoundDraft): void {
  currentRound.value = nextRound;
}

function publish(): void {
  if (!canPublish.value || publishing.value) return;
  publishError.value = '';

  const issue = issueFromDraft(
    { kind: kind.value, date: date.value, title: issueTitle.value, participants: participants.value, rounds: rounds.value },
    'solo',
  );
  if (!shelf.add(issue)) {
    publishError.value = '브라우저 저장 공간에 저장하지 못했어요. 용량을 비우고 다시 시도해주세요.';
    return;
  }
  if (!soloDraft.clear().ok) {
    publishError.value =
      '책장에는 꽂았지만 임시 저장을 비우지 못했어요. 브라우저 저장 공간을 확인하고 다시 시도해주세요.';
    return;
  }

  publishing.value = true;
  window.setTimeout(finishPublish, 1450);
}

function finishPublish(): void {
  if (!publishing.value) return;
  publishing.value = false;
  emit('published');
}
</script>

<style scoped>
.soloIntro {
  display: grid;
  gap: 4px;
  margin-bottom: 18px;
}

.soloIntro .pageTitle {
  margin-bottom: 0;
}

.issueSetup {
  display: grid;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--ink);
  background: var(--paper-card);
}

.sourceIssue {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  padding: 14px;
  border-top: 3px solid var(--ink);
  border-bottom: 1px solid var(--hairline);
}

.sectionHead {
  display: grid;
  gap: 3px;
}

.sectionHead h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 1.35;
}

.publishHelp {
  margin-top: 16px;
  text-align: center;
}

.draftNotice {
  margin-top: 12px;
  text-align: center;
}

.publishOverlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 14px;
  padding: 24px;
  background: color-mix(in srgb, var(--paper) 92%, transparent);
  cursor: pointer;
}

.overlayTitle {
  margin: 0;
}
</style>
