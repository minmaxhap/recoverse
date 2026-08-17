<template>
  <AppShell variant="write">
    <BackHeader label="혼자 쓰기" @back="$emit('back')" />

    <!-- 표제는 시작 방식을 고르는 첫 화면에서만. 하위 화면은 각자 제목이 있어,
         같은 표제를 다시 얹으면 첫 행동만 화면 아래로 밀린다. -->
    <header v-if="showModePicker" class="soloIntro">
      <span class="eyebrow red">SOLO ISSUE</span>
      <h1 class="pageTitle">오늘의 질문을 한 호로 엮어요</h1>
    </header>

    <!-- 이어쓰기 안내는 맨 위, 무엇이 돌아왔는지와 함께 — 발행 버튼 옆에서 '복원됨'만 말하면 알 수 없다. -->
    <p v-if="restoreNotice" class="statusBanner resumeBanner" role="status">
      <span>{{ restoreNotice }}</span>
      <button type="button" class="statusRetry" @click="restoreNotice = ''">닫기</button>
    </p>

    <SoloModePicker v-if="showModePicker" @select="selectMode" />

    <SoloQuickPicker
      v-else-if="activeMode === 'quick' && !quickReady"
      @back="resetMode"
      @choose="chooseQuickStart"
    />

    <SoloReviewFlow
      v-else-if="activeMode === 'review'"
      :draft="reviewDraft"
      @back="resetMode"
      @update:draft="updateReviewDraft"
      @complete="completeReviewLens"
      @edit="openEditor"
      @publish="publishReview"
    />

    <template v-if="editorVisible">
    <!-- 쓰던 것을 그대로 둔 채 다른 시작 방식으로 건너갈 수 있게 — 없으면 한 번 고른 모드에 갇힌다. -->
    <button type="button" class="backChoice" @click="backToModes">← 시작 방식 다시 고르기</button>

    <!-- 안내는 목록 밖에 둔다 — 담은 뒤 목록이 접혀도 무엇이 담겼는지는 계속 보이게. -->
    <p v-if="importNotice" class="importNotice" role="status">
      <span class="helper">{{ importNotice }}</span>
      <button v-if="lastImported.length > 0" type="button" class="undo" @click="undoImport">되돌리기</button>
    </p>

    <!-- 바로 쓰기에서 답을 남긴 뒤: 남은 선택은 "여기서 끝낼까, 하나 더 쓸까"뿐이다. -->
    <section v-if="quickDone" class="quickDone" aria-labelledby="quickDoneTitle">
      <span class="eyebrow red">ANSWER SAVED</span>
      <h2 id="quickDoneTitle">답을 목차에 실었어요</h2>
      <blockquote
        v-if="latestQuickAnswer"
        class="quickAnswer"
        :aria-label="latestQuickAnswer"
      >{{ latestQuickAnswer }}</blockquote>
      <p class="helper">{{ publishHelp }}</p>
      <p v-if="editorialError" class="error" role="alert">{{ editorialError }}</p>
      <div class="quickDoneActions">
        <button class="cta" :disabled="!canPublish || publishing" @click="publish">이대로 책장에 꽂기</button>
        <button type="button" class="ghost" @click="continueQuick">질문 하나 더</button>
        <button type="button" class="linkAction" @click="activeMode = 'free'">목차에서 질문과 답 고치기</button>
      </div>
    </section>

    <RoundEditor
      v-else
      ref="editorEl"
      :participants="participants"
      :rounds="rounds"
      :current-round="currentRound"
      :kind="kind"
      :draft-state-label="draftStateLabel"
      :past-issues="shelf.issues.value"
      :save-label="activeMode === 'quick' ? '이 답 남기기' : '답 저장하고 다음 질문'"
      :presentation="activeMode === 'quick' ? 'quick' : 'standard'"
      @update:rounds="updateRounds"
      @update:current-round="updateCurrentRound"
      @browse-sets="openSets"
    >
      <!-- 발행은 답이 생긴 뒤에만 — 쓰기 전부터 비활성 버튼과 표지 칸을 보여주면
           답을 쓰면서 완성품 구성까지 동시에 생각하게 된다. -->
      <template #publish>
        <p v-if="editorialError" class="error" role="alert">{{ editorialError }}</p>
        <p class="helper publishHelp">{{ publishHelp }}</p>

        <template v-if="canPublish">
          <button class="cta" :disabled="publishing" @click="publish">책장에 꽂기</button>

          <details
            class="disclosure coverNote"
            :open="coverNoteOpen"
            @toggle="coverNoteOpen = ($event.target as HTMLDetailsElement).open"
          >
            <summary class="disclosureSummary">
              <span class="eyebrow red">COVER NOTE</span>
              <span class="disclosureText">표지 정보</span>
              <span class="disclosureChevron" aria-hidden="true">＋</span>
            </summary>
            <div class="disclosureBody">
              <div class="fieldGroup">
                <span class="fieldLabel">이번 호 종류</span>
                <KindChips v-model="kind" />
              </div>

              <label class="fieldGroup">
                <span class="fieldLabel">표지 제목 선택</span>
                <input v-model="title" class="field" aria-label="표지 제목" :placeholder="defaultIssueTitle" />
                <span class="helper">비워두면 {{ defaultIssueTitle }}로 꽂혀요.</span>
              </label>

              <label class="fieldGroup">
                <span class="fieldLabel">이 호에 실릴 이름</span>
                <input v-model="name" class="field" placeholder="나" />
              </label>
            </div>
          </details>
        </template>
      </template>
    </RoundEditor>

    <!-- 세트는 질문을 구하는 일이라 직접 엮기에서만. 쓰는 자리 아래에 둬 첫 화면을 비워둔다. -->
    <details
      v-if="activeMode === 'free'"
      ref="setsEl"
      class="disclosure"
      :open="sourceOpen"
      @toggle="sourceOpen = ($event.target as HTMLDetailsElement).open"
    >
      <summary class="disclosureSummary">
        <span class="eyebrow red">QUESTION SET</span>
        <span class="disclosureText">질문 세트 불러오기 · 만들기</span>
        <span class="disclosureChevron" aria-hidden="true">＋</span>
      </summary>
      <div class="disclosureBody">
        <QuestionSetPicker
          :issues="shelf.issues.value"
          :contents="contentsQuestions"
          :source-issue-id="sourceIssueId"
          :default-name="defaultIssueTitle"
          @update:source-issue-id="sourceIssueId = $event"
          @load="importQuestions"
          @manage="$emit('navigate', 'sets')"
        />
      </div>
    </details>
    </template>

    <p v-if="!editorVisible && editorialError" class="error flowError" role="alert">{{ editorialError }}</p>

    <!-- 발행 연출: 표지가 조립되어 책장에 꽂히는 장면 (탭하면 건너뛰기) -->
    <Transition name="page">
      <div v-if="publishing" class="publishOverlay" role="status" @click="finishPublish">
        <span class="eyebrow gold">이번 호 발행</span>
        <PublishScene :year="date.slice(0, 4)" :kind-label="kindLabelText" />
        <p class="pageTitle centered overlayTitle">{{ publishedTitle }},<br />책장에 꽂는 중</p>
        <p v-if="carriedCount > 0" class="fineprint carried">
          답 대기 {{ carriedCount }}개는 다음 호 초고로 옮겼어요
        </p>
        <p class="fineprint">탭하면 바로 책장으로 가요</p>
      </div>
    </Transition>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { KIND_LABELS, kstTodayISO, type Kind, type Round } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import KindChips from '../components/KindChips.vue';
import PublishScene from '../components/PublishScene.vue';
import QuestionSetPicker from '../components/QuestionSetPicker.vue';
import RoundEditor from '../components/RoundEditor.vue';
import SoloModePicker from '../components/solo/SoloModePicker.vue';
import SoloQuickPicker, { type QuickStartSelection } from '../components/solo/SoloQuickPicker.vue';
import SoloReviewFlow, { type ReviewRoundInput } from '../components/solo/SoloReviewFlow.vue';
import { createEmptyReviewDraft, type ReviewDraft, type SoloMode } from '../components/solo/reviewContent';
import {
  draftHasContent,
  SOLO_DEFAULT_NAME,
  SOLO_ISSUE_DRAFT_VERSION,
  useSoloIssueDraft,
  type SoloIssueCurrentRoundDraft,
  type SoloIssueDraftV2,
  type SoloGuidedPathState,
} from '../composables/useSoloIssueDraft';
import { useShelf } from '../composables/useShelf';
import { issueFromDraft, roundIsAnswered } from '../lib/issueBuilder';
import { deriveSoloTitle } from '../lib/soloTitle';

// preset*: 다른 화면에서 재료를 들고 들어올 때 — 재발견의 질문 하나, 지난 호 상세의 구성 한 벌.
const props = withDefaults(
  defineProps<{ readonly presetQuestion?: string; readonly presetIssueId?: string }>(),
  { presetQuestion: '', presetIssueId: '' },
);
const emit = defineEmits<{ back: []; published: [string]; navigate: ['sets'] }>();

const shelf = useShelf();
const kind = ref<Kind>('free');
const title = ref('');
const name = ref(SOLO_DEFAULT_NAME);
const rounds = ref<Round[]>([]);
const currentRound = ref<SoloIssueCurrentRoundDraft>({ question: '', formatId: '', answers: {} });
const publishError = ref('');
const restoreNotice = ref('');
const importNotice = ref('');
const publishing = ref(false);
const sourceIssueId = ref('');
// 방금 담은 질문들 — 되돌리기가 그 줄만 골라 뺀다.
const lastImported = ref<string[]>([]);
// 발행하며 다음 호로 넘긴 답 대기 질문 수 — 발행 연출에서 어디로 갔는지 알린다.
const carriedCount = ref(0);
// 발행 직후 화면 상태를 다음 호로 갈아끼우므로, 연출에 쓸 제목은 발행 시점 값을 붙잡아 둔다.
const publishedTitle = ref('');
const publishedId = ref('');
// 지난 호 가져오기는 소수만 쓰는 선택 기능 — 기본은 접어두고(네이티브 details), 필요할 때 펼친다.
const sourceOpen = ref(false);
// 표지 정보(종류·제목·이름)도 기본값이 있어 접어둔다 — 바로 질문부터 쓰게. 값이 있으면 펼친다.
const coverNoteOpen = ref(false);
const soloDraft = useSoloIssueDraft();
const draftReady = ref(false);
const editorEl = ref<InstanceType<typeof RoundEditor> | null>(null);
const setsEl = ref<HTMLDetailsElement | null>(null);

/** 세트 목록은 쓰는 자리 아래에 있다 — 열기만 하면 화면 밖이라 데려다 놓는다. */
function openSets(): void {
  sourceOpen.value = true;
  void nextTick(() => setsEl.value?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
}

const activeMode = ref<SoloMode | ''>('');
const quickReady = ref(false);
const guidedPath = ref<SoloGuidedPathState | undefined>();
const reviewDraft = ref<ReviewDraft>(createEmptyReviewDraft());

const date = computed(() => kstTodayISO());
const answeredRounds = computed(() => rounds.value.filter(roundIsAnswered));
const defaultIssueTitle = computed(() =>
  deriveSoloTitle({
    kind: kind.value,
    date: date.value,
    mode: activeMode.value || 'free',
    answeredRounds: answeredRounds.value,
  }),
);
const issueTitle = computed(() => title.value.trim() || defaultIssueTitle.value);
const participants = computed(() => [name.value.trim() || SOLO_DEFAULT_NAME]);
const answeredRoundCount = computed(() => answeredRounds.value.length);
const pendingRoundCount = computed(() => rounds.value.length - answeredRoundCount.value);
const canPublish = computed(() => answeredRoundCount.value > 0);
const latestQuickAnswer = computed(() => {
  const participant = participants.value[0];
  if (!participant) return '';
  for (let index = rounds.value.length - 1; index >= 0; index -= 1) {
    const round = rounds.value[index];
    const answer = round?.answers[participant]?.text.trim() ?? '';
    if (answer) return answer;
  }
  return '';
});
const kindLabelText = computed(() => KIND_LABELS[kind.value]);
const sourceIssue = computed(() => shelf.issues.value.find((issue) => issue.id === sourceIssueId.value));
const contentsQuestions = computed(() => rounds.value.map((round) => round.question));
const publishHelp = computed(() => {
  if (!canPublish.value) return '질문 하나와 답 하나를 목차에 실으면 발행할 수 있어요.';
  if (pendingRoundCount.value > 0) {
    return `지금 발행하면 답을 쓴 ${answeredRoundCount.value}개 질문만 실려요. 답 대기 중인 ${pendingRoundCount.value}개는 다음 호 초고로 남겨둬요.`;
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
const showModePicker = computed(() => draftReady.value && activeMode.value === '');
const editorVisible = computed(
  () => activeMode.value === 'free' || (activeMode.value === 'quick' && quickReady.value),
);
/**
 * 바로 쓰기에서 답을 저장해 쓰던 칸이 비워진 상태. 한 질문만 쓰기로 들어온 사람에게
 * 빈 질문 칸을 다시 내밀면 "또 써야 하나"로 읽힌다 — 끝낼지 이어갈지만 묻는다.
 * 초고 스키마는 그대로 두고 지금 값에서 파생한다.
 */
const quickDone = computed(
  () =>
    activeMode.value === 'quick' &&
    quickReady.value &&
    canPublish.value &&
    currentRound.value.question.trim() === '',
);

function savedTimeText(savedAt: string): string {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(savedAt),
  );
}

/**
 * 무엇이 돌아왔는지 말한다 — '복원됨'만으로는 뭐가 살아났는지 알 수 없다.
 * 복원 시점의 초고를 그대로 읽어 적으므로, 이어 쓰는 동안 문장이 바뀌지 않는다.
 */
function describeRestored(draft: SoloIssueDraftV2, migrated: boolean): string {
  const restored: string[] = [];
  if (draft.rounds.length > 0) restored.push(`목차 ${draft.rounds.length}개`);
  const writing =
    draft.currentRound.question.trim() !== '' ||
    Object.values(draft.currentRound.answers).some((text) => text.trim() !== '');
  if (writing) restored.push('쓰던 질문 1개');
  if (draft.title.trim() !== '') restored.push('표지 제목');

  const lead = migrated ? '이전 임시 저장을 옮겨 왔어요' : '쓰던 호를 이어서 열었어요';
  const what = restored.length > 0 ? restored.join(' · ') : '아직 빈 초고';
  const when = draft.updatedAt ? ` · ${savedTimeText(draft.updatedAt)} 저장` : '';
  return `${lead} — ${what}${when}`;
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
    soloMode: activeMode.value,
    quickReady: quickReady.value,
    guidedPath: guidedPath.value,
    reviewComposer: reviewDraft.value,
  };
}

/** 발행 뒤 남길 초고 — 답 대기 질문만 들고 다음 호로 넘어간다(제목은 새로 짓게 비운다). */
function carryOverDraft(carried: Round[]): SoloIssueDraftV2 {
  const keepsReviewComposer =
    activeMode.value === 'review' && reviewDraft.value.phase !== 'lens' && reviewDraft.value.phase !== 'complete';
  return {
    version: SOLO_ISSUE_DRAFT_VERSION,
    updatedAt: new Date().toISOString(),
    kind: kind.value,
    title: '',
    name: name.value,
    sourceIssueId: '',
    rounds: carried,
    currentRound: { question: '', formatId: '', answers: {} },
    soloMode: keepsReviewComposer ? 'review' : 'free',
    quickReady: false,
    guidedPath: undefined,
    reviewComposer: keepsReviewComposer ? reviewDraft.value : createEmptyReviewDraft(),
  };
}

function applyDraft(draft: SoloIssueDraftV2): void {
  kind.value = draft.kind;
  title.value = draft.title;
  name.value = draft.name || SOLO_DEFAULT_NAME;
  sourceIssueId.value = draft.sourceIssueId;
  rounds.value = [...draft.rounds];
  currentRound.value = draft.currentRound;
  // 쓴 것이 없으면 시작 방식부터 다시 묻는다 — 실수로 한 번 누른 모드가 다음 방문의
  // 첫 화면을 대신 정해버리면, 다른 입구를 고를 기회 자체가 사라진다.
  const resumable = draftHasContent(draft);
  activeMode.value = resumable ? draft.soloMode ?? '' : '';
  quickReady.value = resumable ? draft.quickReady ?? false : false;
  guidedPath.value = draft.guidedPath;
  reviewDraft.value = draft.reviewComposer ?? createEmptyReviewDraft();
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
    restoreNotice.value = describeRestored(restored.draft, restored.migratedFromLegacy);
    if (sourceIssueId.value && !sourceIssue.value) {
      sourceIssueId.value = '';
      clearedStaleSource = true;
    }
    // 복원된 초고가 이미 지난 호를 가져오는 중이면 펼친 채로 시작해 맥락을 잃지 않는다.
    sourceOpen.value = sourceIssueId.value !== '';
    // 복원된 초고가 표지 정보를 손봤으면(제목·이름·종류) 그 블록도 펼쳐 보이게 한다.
    coverNoteOpen.value =
      title.value.trim() !== '' || name.value !== SOLO_DEFAULT_NAME || kind.value !== 'free';
  }
  applyPresetIssue();
  applyPresetQuestion();
  if (props.presetQuestion.trim() || props.presetIssueId.trim()) {
    activeMode.value = 'free';
  } else if (hasDraftContent.value && activeMode.value === '') {
    activeMode.value = 'free';
  }
  draftReady.value = true;
  if (clearedStaleSource) persistDraft();
}

/** 지난 호 상세에서 "이 구성으로 쓰기"로 들어왔을 때 — 그 호의 질문을 목차에 깐다. */
function applyPresetIssue(): void {
  const issue = shelf.issues.value.find((item) => item.id === props.presetIssueId);
  if (!issue) return;
  sourceIssueId.value = issue.id;
  importQuestions(
    issue.rounds.map((round) => ({
      question: round.question,
      ...(round.format ? { format: round.format } : {}),
      ...(round.questionId ? { questionId: round.questionId } : {}),
      ...(round.questionRevision !== undefined ? { questionRevision: round.questionRevision } : {}),
      ...(round.pathId ? { pathId: round.pathId } : {}),
      ...(round.pathStep !== undefined ? { pathStep: round.pathStep } : {}),
      ...(round.review ? { review: round.review } : {}),
    })),
  );
}

/**
 * 재발견에서 들고 온 질문을 쓰는 칸에 앉힌다.
 * 쓰던 질문이 있으면 건드리지 않고 목차에 "답 대기"로 더한다 — 초고를 덮어쓰지 않게.
 */
function applyPresetQuestion(): void {
  const question = props.presetQuestion.trim();
  if (!question) return;
  if (rounds.value.some((round) => round.question.trim() === question)) return;

  if (currentRound.value.question.trim() === '' && !currentRound.value.formatId) {
    currentRound.value = { ...currentRound.value, question };
  } else {
    rounds.value = [...rounds.value, { asker: participants.value[0] ?? SOLO_DEFAULT_NAME, question, answers: {} }];
    importNotice.value = '재발견에서 가져온 질문을 목차에 담았어요.';
  }
}

watch(
  [kind, title, name, sourceIssueId, rounds, currentRound, activeMode, quickReady, guidedPath, reviewDraft],
  () => {
    if (draftReady.value) persistDraft();
  },
  { deep: true, flush: 'sync' },
);

onMounted(restoreDraft);

/** 세트의 질문을 그 구성 그대로 목차에 "답 대기"로 깐다. 이미 실린 질문은 건너뛴다. */
function importQuestions(picked: Array<Pick<Round, 'question'> & Partial<Omit<Round, 'question' | 'asker' | 'answers'>>>): void {
  const existing = new Set(rounds.value.map((round) => round.question.trim()));
  const asker = participants.value[0] ?? SOLO_DEFAULT_NAME;
  const additions: Round[] = [];
  for (const item of picked) {
    const question = item.question.trim();
    if (!question || existing.has(question)) continue;
    existing.add(question);
    const round: Round = { asker, question, answers: {} };
    if (item.format) round.format = item.format;
    if (item.questionId) round.questionId = item.questionId;
    if (item.questionRevision !== undefined) round.questionRevision = item.questionRevision;
    if (item.pathId) round.pathId = item.pathId;
    if (item.pathStep !== undefined) round.pathStep = item.pathStep;
    if (item.review) round.review = item.review;
    additions.push(round);
  }
  if (additions.length === 0) {
    lastImported.value = [];
    importNotice.value = '그 질문들은 이미 목차에 있어요.';
    return;
  }

  rounds.value = [...rounds.value, ...additions];
  lastImported.value = additions.map((round) => round.question);
  importNotice.value = `질문 ${additions.length}개를 목차에 담았어요.`;
  // 고르는 일은 끝났다 — 목록을 접어 쓰는 자리와 대기 안내를 화면 위로 끌어올린다.
  sourceOpen.value = false;
}

/** 방금 담은 질문 중 아직 답이 없는 줄만 뺀다 — 담은 뒤 쓴 답은 지우지 않는다. */
function undoImport(): void {
  const added = new Set(lastImported.value);
  rounds.value = rounds.value.filter((round) => !added.has(round.question) || roundIsAnswered(round));
  lastImported.value = [];
  importNotice.value = '';
}

function updateRounds(nextRounds: Round[]): void {
  rounds.value = nextRounds;
}

function updateCurrentRound(nextRound: SoloIssueCurrentRoundDraft): void {
  currentRound.value = nextRound;
}

function selectMode(mode: SoloMode): void {
  activeMode.value = mode;
  quickReady.value = false;
  guidedPath.value = undefined;
  if (mode !== 'review') reviewDraft.value = createEmptyReviewDraft();
}

function resetMode(): void {
  activeMode.value = '';
  quickReady.value = false;
  guidedPath.value = undefined;
  reviewDraft.value = createEmptyReviewDraft();
}

/**
 * 시작 방식 화면으로 돌아가되 쓰던 것은 남긴다 — 목차·쓰던 질문·리뷰 진행 모두 그대로.
 * resetMode와 달리 되돌리기가 아니라 "다른 입구로 건너가기"라서, 지우는 일은 하지 않는다.
 */
function backToModes(): void {
  activeMode.value = '';
  quickReady.value = false;
}

function continueQuick(): void {
  quickReady.value = false;
}

function chooseQuickStart(selection: QuickStartSelection): void {
  // 쓰던 질문이 있으면 덮어쓰지 않고 쓰던 답과 함께 목차로 옮긴다 — 시작 방식을 다시 고르고
  // 돌아왔을 때 앞서 쓰던 것이 조용히 사라지지 않게. 재발견에서 들고 올 때와 같은 규칙.
  const pending = currentRound.value.question.trim();
  const carried = pending !== '' && pending !== selection.question.trim();
  if (carried) {
    const answers: Round['answers'] = {};
    for (const [who, text] of Object.entries(currentRound.value.answers)) {
      if (text.trim()) answers[who] = { text: text.trim() };
    }
    rounds.value = [
      ...rounds.value,
      { asker: participants.value[0] ?? SOLO_DEFAULT_NAME, question: pending, answers },
    ];
  }
  currentRound.value = {
    // 옮긴 답까지 따라오면 새 질문 밑에 남의 답이 앉는다 — 옮겼으면 답 칸은 비우고 시작한다.
    ...(carried ? { formatId: '', answers: {} } : currentRound.value),
    question: selection.question,
    pathId: selection.pathId,
    pathStep: 0,
  };
  quickReady.value = true;
  guidedPath.value = {
    pathId: selection.pathId,
    pathRevision: selection.pathRevision,
    mode: selection.mode,
    step: 0,
  };
  // 고른 질문 바로 아래 답 칸에서 이어 쓰게 — 키보드/모바일에서 화면을 다시 찾지 않도록.
  void nextTick(() => editorEl.value?.focusAnswer());
}

function updateReviewDraft(next: ReviewDraft): void {
  reviewDraft.value = next;
}

function completeReviewLens(inputs: readonly ReviewRoundInput[]): void {
  const asker = participants.value[0] ?? SOLO_DEFAULT_NAME;
  const additions: Round[] = inputs.map((input) => ({
    asker,
    question: input.question,
    answers: { [asker]: { text: input.answer } },
    review: input.review,
  }));
  rounds.value = [...rounds.value, ...additions];
}

function openEditor(): void {
  activeMode.value = 'free';
}

async function publishReview(): Promise<void> {
  await nextTick();
  publish();
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

  // 답을 기다리던 질문은 발행에서 빠질 뿐 사라지면 안 된다 — 다음 호 초고로 넘긴다.
  const carried = rounds.value.filter((round) => !roundIsAnswered(round));
  const kept = carried.length > 0 ? soloDraft.save(carryOverDraft(carried)) : soloDraft.clear();
  if (!kept.ok) {
    publishError.value =
      carried.length > 0
        ? '책장에는 꽂았지만 답 대기 질문을 다음 호로 남기지 못했어요. 브라우저 저장 공간을 확인하고 다시 시도해주세요.'
        : '책장에는 꽂았지만 임시 저장을 비우지 못했어요. 브라우저 저장 공간을 확인하고 다시 시도해주세요.';
    return;
  }
  carriedCount.value = carried.length;
  publishedTitle.value = issue.title;
  publishedId.value = issue.id;
  // 화면 상태를 다음 호로 갈아끼우는 동안 자동 저장을 멈춘다 — 방금 쓴 초고를 덮어쓰지 않게.
  draftReady.value = false;
  rounds.value = carried;
  title.value = '';
  sourceIssueId.value = '';
  currentRound.value = { question: '', formatId: '', answers: {} };
  activeMode.value = '';
  quickReady.value = false;
  guidedPath.value = undefined;
  reviewDraft.value = createEmptyReviewDraft();

  publishing.value = true;
  window.setTimeout(finishPublish, 1450);
}

function finishPublish(): void {
  if (!publishing.value) return;
  publishing.value = false;
  // 방금 꽂은 호가 어느 표지인지 책장에서 짚어줄 수 있게 id를 들려 보낸다.
  emit('published', publishedId.value);
}
</script>

<style scoped>
.soloIntro {
  display: grid;
  gap: 4px;
  margin-bottom: 18px;
}

/* 시작 방식으로 되돌아가는 줄 — 바로 쓰기·리뷰 흐름과 같은 생김새로 둔다. */
.backChoice {
  justify-self: start;
  min-height: 44px;
  padding: 8px 0;
  background: none;
  border: 0;
  color: var(--dim);
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
}

.backChoice:hover {
  color: var(--vermilion);
}

.soloIntro .pageTitle {
  margin-bottom: 0;
}

/* 선택 정보 디스클로저(지난 호 가져오기·표지 정보): 기본은 hairline 위 슬림한 요약 줄,
   펼치면 본문이 인라인으로 열린다. 표지 정보를 접어두어 바로 질문부터 쓰게 한다. */
.disclosure {
  margin-top: 16px;
  border-top: 1px solid var(--hairline);
}

.disclosureSummary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 2px;
  cursor: pointer;
  color: var(--dim-strong);
  list-style: none;
  transition: color 0.15s ease;
}

.disclosureSummary::-webkit-details-marker {
  display: none;
}

.disclosureSummary:hover {
  color: var(--vermilion);
}

.disclosureText {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
}

.disclosureChevron {
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 700;
  color: var(--dim);
  transition: transform 0.18s ease, color 0.15s ease;
}

.disclosureSummary:hover .disclosureChevron {
  color: var(--vermilion);
}

.disclosure[open] .disclosureChevron {
  transform: rotate(45deg);
}

.disclosureBody {
  display: grid;
  gap: 12px;
  padding: 4px 2px 14px;
}

.importNotice {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 12px 0 0;
}

.undo {
  flex: 0 0 auto;
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  font-weight: 800;
  color: var(--vermilion);
  text-decoration: underline;
  cursor: pointer;
}

.publishHelp {
  margin-top: 16px;
  text-align: center;
}

/* 답을 남긴 뒤의 갈림길 — 리뷰의 LENS COMPLETE와 같은 세로 목록. */
.quickDone {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.quickDone h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 25px;
  line-height: 1.45;
}

.quickAnswer {
  display: -webkit-box;
  margin: 6px 0 2px;
  overflow: hidden;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.quickDoneActions {
  display: grid;
  gap: 9px;
  margin-top: 8px;
}

.linkAction {
  justify-self: start;
  min-height: 44px;
  padding: 8px 0;
  background: none;
  border: 0;
  color: var(--dim);
  font-family: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.linkAction:hover {
  color: var(--vermilion);
}

.resumeBanner {
  align-items: flex-start;
  margin: 0 0 18px;
}

.resumeBanner span {
  min-width: 0;
}

.flowError {
  margin-top: 14px;
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
