<template>
  <div class="app" :data-theme="appTheme">
    <AppTopNav
      @go-home="navigateBottomTab('home')"
      @menu-action="onTopMenuAction"
    />
    <main class="main">
      <HomeBookView
        v-if="mode === 'home-book'"
        brand-label="Recoverse"
        title="나의 회고 책"
        :reflections="reflections"
        @start-writing="openNewReflection"
        @start-quick="startQuickReflection"
        @open-reflection="openReflectionDetail"
        @continue-reflection="continueReflection"
        @load-sample="loadSampleReflection"
        @view-all="openReviewAgain"
      />

      <NewReflectionPage
        v-else-if="mode === 'reflection-new'"
        :reflections="reflections"
        @back-home="setMode('home-book')"
        @create="startReflectionDraft"
        @create-custom="startCustomReflectionDraft"
        @open-existing="continueReflection"
      />

      <WriteReflectionPage
        v-else-if="mode === 'reflection-write'"
        :reflection="activeReflection"
        @save-answer="saveActiveReflectionAnswer"
        @save-later="setMode('home-book')"
        @back-new="setMode('reflection-new')"
        @finish="setMode('reflection-detail')"
      />

      <ReflectionDetailPage
        v-else-if="mode === 'reflection-detail'"
        :reflection="activeReflection"
        @back-home="setMode('home-book')"
        @edit="setMode('reflection-write')"
        @review-again="openReviewAgain"
        @share="shareActiveReflection"
        @delete="deleteActiveReflection"
      />

      <ReviewAgainPage
        v-else-if="mode === 'review-again'"
        :reflections="reflections"
        @back-home="setMode('home-book')"
        @open-reflection="openReflectionDetail"
      />

      <SharedReflectionPage
        v-else-if="mode === 'shared-reflections'"
        :reflection="activeReflection"
        :snapshot="sharedReflectionSnapshot"
        @back-home="setMode('home-book')"
        @answer-same="startSharedQuestionReflection"
        @start-new="openNewReflection"
      />

      <ArchiveSettingsView
        v-else-if="mode === 'archive-settings'"
        :theme="appTheme"
        :active-section="activeSettingsSection"
        :theme-options="themeOptions"
        :reflection-count="reflections.length"
        :telemetry="telemetry"
        :telemetry-summary="telemetrySummary"
        @update:theme="setAppTheme"
        @reflection-export="onExportReflections"
        @reflection-import-file="onImportReflectionFile"
        @clear-all="clearAll"
        @load-sample="loadSampleReflection"
      />
    </main>
    <AppBottomNav
      v-if="showBottomNav"
      :active-tab="activeBottomTab"
      :labels="bottomNavLabels"
      @navigate="navigateBottomTab"
    />
    <AppDialog />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import AppBottomNav from "./components/AppBottomNav.vue";
import AppDialog from "./components/AppDialog.vue";
import AppTopNav from "./components/AppTopNav.vue";
import type { TopMenuAction } from "./components/AppTopNav.vue";
import type { RecoverseTheme, SettingsSection } from "./components/ArchiveSettingsTools.vue";
import ArchiveSettingsView from "./views/ArchiveSettingsView.vue";
import HomeBookView from "./views/HomeBookView.vue";
import NewReflectionPage from "./views/NewReflectionPage.vue";
import ReflectionDetailPage from "./views/ReflectionDetailPage.vue";
import ReviewAgainPage from "./views/ReviewAgainPage.vue";
import SharedReflectionPage from "./views/SharedReflectionPage.vue";
import WriteReflectionPage from "./views/WriteReflectionPage.vue";
import { downloadBlob } from "./lib/downloadBlob";
import {
  loadPreferredTheme,
  savePreferredTheme,
} from "./lib/localPreferenceStore";
import {
  type AppMode,
  type BottomTabId,
  bottomNavLabels,
  getActiveBottomTab,
  isTabActive,
  shouldShowBottomNav,
} from "./lib/appNavigation";
import {
  createCustomReflectionDraft,
  createReflectionDraft,
  deleteReflection,
  loadReflections,
  saveReflection,
  saveReflectionAnswer,
  saveReflections,
} from "./lib/reflectionStore";
import {
  REFLECTION_BACKUP_SCHEMA,
  exportReflectionBackup,
  mergeReflectionBackup,
} from "./lib/reflectionBackup";
import {
  buildShareHash,
  buildSharedReflectionSnapshot,
  readShareHash,
  type SharedReflectionSnapshot,
} from "./lib/reflectionShare";
import {
  createHistoryState,
  popFallbackMode,
  shouldRecordHistory,
  urlHasShareHash,
  urlWithoutHash,
} from "./lib/appHistory";
import { createQuickReflection } from "./lib/quickReflection";
import { createSampleReflection } from "./lib/sampleReflection";
import {
  describeTelemetry,
  loadTelemetry,
  recordAnswer,
  recordSession,
  resetTelemetry,
  type TelemetryState,
} from "./lib/localTelemetry";
import { alertDialog, confirmDialog, promptDialog } from "./composables/useAppDialog";
import type { Reflection, ReflectionPeriod, ReflectionQuestionSetMode } from "./types/reflection";

const appTheme = ref<RecoverseTheme>(loadPreferredTheme());
const activeSettingsSection = ref<SettingsSection>("settings");
const themeOptions: Array<{
  id: RecoverseTheme;
  label: string;
  description: string;
}> = [
  { id: "book", label: "바이올렛", description: "기본 테마 · 보랏빛 포인트" },
  { id: "letter", label: "블루", description: "차분한 파란색 포인트" },
  { id: "journey", label: "그린", description: "산뜻한 초록색 포인트" },
];

const reflections = ref<Reflection[]>(loadReflections());
const activeReflectionId = ref<string | null>(reflections.value[0]?.id ?? null);
const sharedReflectionSnapshot = ref<SharedReflectionSnapshot | null>(null);
const telemetry = ref<TelemetryState>(loadTelemetry());

const mode = ref<AppMode>("home-book");
const modeBackStack = ref<AppMode[]>([]);
const isHandlingBrowserBack = ref(false);

const showBottomNav = computed(() => shouldShowBottomNav(mode.value));
const activeBottomTab = computed<BottomTabId | null>(() => getActiveBottomTab(mode.value));
const telemetrySummary = computed(() => describeTelemetry(telemetry.value));
const previewSample = ref<Reflection | null>(null);
const activeReflection = computed(() => {
  if (!activeReflectionId.value) return null;
  if (previewSample.value?.id === activeReflectionId.value) return previewSample.value;
  return reflections.value.find((reflection) => reflection.id === activeReflectionId.value) ?? null;
});

function setAppTheme(theme: RecoverseTheme) {
  appTheme.value = theme;
  savePreferredTheme(theme);
}

async function openSettingsSection(section: SettingsSection) {
  activeSettingsSection.value = section;
  if (!(await confirmLeavingWriteMode())) return;
  setMode("archive-settings");

  nextTick(() => {
    const targetId =
      section === "theme"
        ? "settings-theme"
        : section === "import" || section === "backup"
          ? "settings-backup"
          : "";
    if (!targetId) return;
    document.getElementById(targetId)?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

function onTopMenuAction(action: TopMenuAction) {
  openSettingsSection(action);
}

function openSharedSnapshotFromHash() {
  const snapshot = readShareHash(window.location.hash);
  if (!snapshot) return false;

  sharedReflectionSnapshot.value = snapshot;
  activeReflectionId.value = null;
  setMode("shared-reflections", { recordHistory: false });
  return true;
}

function onHashChange() {
  if (openSharedSnapshotFromHash()) return;
  if (sharedReflectionSnapshot.value) {
    sharedReflectionSnapshot.value = null;
    setMode("home-book");
  }
}

function confirmLeavingWriteMode() {
  if (mode.value !== "reflection-write") return Promise.resolve(true);
  return confirmDialog("작성 중인 답변은 이 기기에 임시 저장돼요. 다른 화면으로 이동할까요?", {
    title: "화면을 나가시겠어요?",
    confirmLabel: "이동하기",
    cancelLabel: "계속 쓰기",
  });
}

function clearShareHash() {
  if (!urlHasShareHash(window.location.hash)) return;
  window.history.replaceState(
    createHistoryState(mode.value),
    "",
    urlWithoutHash(window.location.pathname, window.location.search)
  );
}

function setMode(nextMode: AppMode, options: { recordHistory?: boolean } = {}) {
  const previousMode = mode.value;

  if (nextMode !== "shared-reflections") {
    sharedReflectionSnapshot.value = null;
    clearShareHash();
  }

  if (previousMode !== nextMode && shouldRecordHistory(options) && !isHandlingBrowserBack.value) {
    modeBackStack.value.push(previousMode);
    window.history.pushState(createHistoryState(nextMode), "", window.location.href);
  }

  mode.value = nextMode;
}

async function navigateBottomTab(tabId: BottomTabId) {
  if (isTabActive(mode.value, tabId)) return;
  if (!(await confirmLeavingWriteMode())) return;

  if (tabId === "home") {
    setMode("home-book");
    return;
  }
  if (tabId === "write") {
    openNewReflection();
    return;
  }
  if (tabId === "review") {
    openReviewAgain();
    return;
  }
}

async function onBrowserBack() {
  if (!(await confirmLeavingWriteMode())) {
    window.history.pushState(createHistoryState(mode.value), "", window.location.href);
    return;
  }

  const previousMode = popFallbackMode(modeBackStack.value, "home-book");
  isHandlingBrowserBack.value = true;
  setMode(previousMode, { recordHistory: false });
  isHandlingBrowserBack.value = false;
}

function openNewReflection() {
  sharedReflectionSnapshot.value = null;
  setMode("reflection-new");
}

function openReflectionDetail(reflectionId: string) {
  sharedReflectionSnapshot.value = null;
  activeReflectionId.value = reflectionId;
  setMode("reflection-detail");
}

function continueReflection(reflectionId: string) {
  sharedReflectionSnapshot.value = null;
  activeReflectionId.value = reflectionId;
  const reflection = activeReflection.value;
  setMode(reflection?.isCompleted ? "reflection-detail" : "reflection-write");
}

function openReviewAgain() {
  sharedReflectionSnapshot.value = null;
  setMode("review-again");
}

function deleteActiveReflection() {
  const reflection = activeReflection.value;
  if (!reflection) return;

  if (previewSample.value?.id === reflection.id) {
    previewSample.value = null;
  } else {
    reflections.value = deleteReflection(reflection.id);
  }
  activeReflectionId.value = reflections.value[0]?.id ?? null;
  setMode("home-book");
}

async function shareActiveReflection(questionIds: string[]) {
  const reflection = activeReflection.value;
  const selectedQuestionIds = questionIds.filter(Boolean);
  if (!reflection || selectedQuestionIds.length === 0) return;

  const allQuestionIds = reflection.questionGroups.flatMap((group) =>
    group.questions.map((question) => question.id)
  );
  const next = {
    ...reflection,
    visibility: "shared" as const,
    shareSettings: {
      shareId: reflection.shareSettings?.shareId ?? `share_${Date.now().toString(36)}`,
      selectedQuestionIds,
      hiddenQuestionIds: allQuestionIds.filter((questionId) => !selectedQuestionIds.includes(questionId)),
      createdAt: reflection.shareSettings?.createdAt ?? new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  reflections.value = saveReflection(next);
  activeReflectionId.value = next.id;
  const snapshot = buildSharedReflectionSnapshot(next, selectedQuestionIds);
  const hash = buildShareHash(snapshot);
  const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${hash}`;
  sharedReflectionSnapshot.value = snapshot;
  modeBackStack.value.push(mode.value);
  window.history.pushState(createHistoryState("shared-reflections"), "", shareUrl);
  setMode("shared-reflections", { recordHistory: false });

  try {
    await navigator.clipboard?.writeText(shareUrl);
    await alertDialog("읽기 전용 공유 링크를 복사했어요.");
  } catch {
    await promptDialog("읽기 전용 공유 링크를 복사해 주세요.", {
      title: "공유 링크",
      defaultValue: shareUrl,
      readonly: true,
      confirmLabel: "닫기",
    });
  }
}

function startReflectionDraft(payload: {
  templateId: string;
  period: ReflectionPeriod;
  questionSetMode: ReflectionQuestionSetMode;
  title?: string;
}) {
  const reflection = createReflectionDraft(payload);
  reflections.value = saveReflection(reflection);
  activeReflectionId.value = reflection.id;
  setMode("reflection-write");
}

function startCustomReflectionDraft(payload: {
  period: ReflectionPeriod;
  title?: string;
  questions: string[];
}) {
  const reflection = createCustomReflectionDraft(payload);
  reflections.value = saveReflection(reflection);
  activeReflectionId.value = reflection.id;
  setMode("reflection-write");
}

function startSharedQuestionReflection(payload: { questions: string[] }) {
  const reflection = createCustomReflectionDraft({
    period: { label: "오늘" },
    questions: payload.questions,
  });
  reflections.value = saveReflection(reflection);
  activeReflectionId.value = reflection.id;
  sharedReflectionSnapshot.value = null;
  setMode("reflection-write");
}

function startQuickReflection() {
  const reflection = createQuickReflection();
  reflections.value = saveReflection(reflection);
  activeReflectionId.value = reflection.id;
  setMode("reflection-write");
}

function loadSampleReflection() {
  const sample = createSampleReflection();
  previewSample.value = sample;
  activeReflectionId.value = sample.id;
  setMode("reflection-detail");
}

function saveActiveReflectionAnswer(payload: {
  questionId: string;
  value: string;
  skipped: boolean;
}) {
  const reflection = activeReflection.value;
  if (!reflection) return;

  const next = saveReflectionAnswer(
    reflection,
    payload.questionId,
    payload.value,
    payload.skipped
  );
  reflections.value = saveReflection(next);
  activeReflectionId.value = next.id;

  if (!payload.skipped && payload.value.trim().length > 0) {
    telemetry.value = recordAnswer();
  }
}

function onExportReflections() {
  const yyyyMMdd = new Date().toISOString().slice(0, 10);
  const blob = exportReflectionBackup(reflections.value);
  downloadBlob(blob, `recoverse_reflections_${yyyyMMdd}.json`);
}

async function onImportReflectionFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const result = mergeReflectionBackup(reflections.value, text);
    reflections.value = saveReflections(result.reflections);
    activeReflectionId.value = reflections.value[0]?.id ?? null;
    await alertDialog(`추가 ${result.added}개, 업데이트 ${result.updated}개, 유지 ${result.skipped}개`, {
      title: "회고 가져오기 완료",
    });
  } catch (err: unknown) {
    const importErrorMessage = err instanceof Error ? err.message : "";
    const reason =
      importErrorMessage === "RECOVERSE_REFLECTION_IMPORT_INVALID_JSON"
        ? "JSON 파일을 읽을 수 없어요."
        : importErrorMessage === "RECOVERSE_REFLECTION_IMPORT_UNSUPPORTED_VERSION"
          ? `${REFLECTION_BACKUP_SCHEMA} 백업 파일이 아니에요.`
          : importErrorMessage || "알 수 없는 오류";
    await alertDialog(reason, { title: "회고 가져오기 실패" });
  } finally {
    input.value = "";
  }
}

async function clearAll() {
  const confirmed = await confirmDialog("전체 회고를 정말 삭제할까요? 이 작업은 되돌릴 수 없어요.", {
    title: "전체 회고 삭제",
    confirmLabel: "삭제하기",
    cancelLabel: "취소",
    danger: true,
  });
  if (!confirmed) return;
  reflections.value = [];
  saveReflections([]);
  activeReflectionId.value = null;
  resetTelemetry();
  telemetry.value = loadTelemetry();
}

onMounted(() => {
  telemetry.value = recordSession();
  window.history.replaceState(createHistoryState(mode.value), "", window.location.href);
  openSharedSnapshotFromHash();
  window.addEventListener("popstate", onBrowserBack);
  window.addEventListener("hashchange", onHashChange);
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", onBrowserBack);
  window.removeEventListener("hashchange", onHashChange);
});
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: var(--surface-base);
  color: var(--text-primary);
  font-family: var(--font-body);
}

.app[data-theme="letter"] {
  /* 블루 포인트 */
  --accent-espresso: #3182F6;
  --accent-sage: #1B64DA;
  --surface-letter: #EAF2FE;
  --surface-letter-deep: #D8E7FD;
  --text-on-letter: #1B64DA;
  --text-on-letter-soft: #4E8AE8;
  --glow-lamp: 0 0 0 3px rgba(49, 130, 246, 0.16);
  --shadow-letter: 0 4px 16px rgba(49, 130, 246, 0.12);
  --color-chip: rgba(49, 130, 246, 0.08);
  --color-border-gold: rgba(49, 130, 246, 0.35);
}

.app[data-theme="journey"] {
  /* 그린 포인트 */
  --accent-espresso: #00A76F;
  --accent-sage: #00875A;
  --surface-letter: #E9F8F0;
  --surface-letter-deep: #D3F1E2;
  --text-on-letter: #00875A;
  --text-on-letter-soft: #34A87E;
  --glow-lamp: 0 0 0 3px rgba(0, 167, 111, 0.16);
  --shadow-letter: 0 4px 16px rgba(0, 167, 111, 0.12);
  --color-chip: rgba(0, 167, 111, 0.08);
  --color-border-gold: rgba(0, 167, 111, 0.35);
}

.main { padding: 54px 0 0; }
</style>