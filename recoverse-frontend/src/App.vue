<template>
  <div class="app" :data-theme="appTheme">
    <AppTopNav
      @go-home="navigateBottomTab('home')"
      @menu-action="onTopMenuAction"
    />
    <main class="main">
      <HomeUniverseView
        v-if="mode === 'home-universe'"
        brand-label="Recoverse"
        title="내 회고 홈"
        :reflections="reflections"
        @start-writing="openNewReflection"
        @open-reflection="openReflectionDetail"
        @continue-reflection="continueReflection"
        @load-sample="loadSampleReflection"
      />

      <NewReflectionPage
        v-else-if="mode === 'reflection-new'"
        @back-home="setMode('home-universe')"
        @create="startReflectionDraft"
      />

      <WriteReflectionPage
        v-else-if="mode === 'reflection-write'"
        :reflection="activeReflection"
        @save-answer="saveActiveReflectionAnswer"
        @save-later="setMode('home-universe')"
        @back-new="setMode('reflection-new')"
        @finish="setMode('reflection-detail')"
      />

      <ReflectionDetailPage
        v-else-if="mode === 'reflection-detail'"
        :reflection="activeReflection"
        @back-home="setMode('home-universe')"
        @edit="setMode('reflection-write')"
        @review-again="openReviewAgain"
        @share="shareActiveReflection"
      />

      <ReviewAgainPage
        v-else-if="mode === 'review-again'"
        :reflections="reflections"
        @back-home="setMode('home-universe')"
        @open-reflection="openReflectionDetail"
      />

      <SharedReflectionPage
        v-else-if="mode === 'shared-reflections'"
        :reflection="activeReflection"
        :snapshot="sharedReflectionSnapshot"
        @back-home="setMode('home-universe')"
        @answer-same="openNewReflection"
      />

      <section v-else-if="mode === 'archive-settings'" class="settingsScreen">
        <header class="settingsHead">
          <span class="eyebrow">Settings</span>
          <h2>설정</h2>
          <p>언어, 테마, 회고 백업과 데이터 초기화를 관리합니다.</p>
        </header>
        <section class="settingsPanel">
          <ArchiveSettingsTools
            :language="language"
            :theme="appTheme"
            :active-section="activeSettingsSection"
            language-label="언어"
            theme-label="테마"
            :theme-options="themeOptions"
            reflection-group-label="회고 데이터"
            reflection-export-label="회고 백업하기"
            reflection-import-label="회고 가져오기"
            reflection-backup-hint="가져오기는 기존 회고를 지우지 않고 최신 항목만 병합합니다."
            :reflection-export-disabled="reflections.length === 0"
            danger-group-label="데이터 초기화"
            clear-label="전체 회고 삭제"
            :clear-disabled="reflections.length === 0"
            @update:language="language = $event"
            @update:theme="setAppTheme"
            @change-language="saveLanguage"
            @reflection-export="onExportReflections"
            @reflection-import-file="onImportReflectionFile"
            @clear-all="clearAll"
          />
        </section>
      </section>
    </main>
    <AppBottomNav
      v-if="showBottomNav"
      :active-tab="activeBottomTab"
      :labels="bottomNavLabels"
      @navigate="navigateBottomTab"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, nextTick } from "vue";
import AppBottomNav from "./components/AppBottomNav.vue";
import AppTopNav from "./components/AppTopNav.vue";
import type { TopMenuAction } from "./components/AppTopNav.vue";
import ArchiveSettingsTools from "./components/ArchiveSettingsTools.vue";
import type { RecoverseTheme, SettingsSection } from "./components/ArchiveSettingsTools.vue";
import HomeUniverseView from "./views/HomeUniverseView.vue";
import NewReflectionPage from "./views/NewReflectionPage.vue";
import ReflectionDetailPage from "./views/ReflectionDetailPage.vue";
import ReviewAgainPage from "./views/ReviewAgainPage.vue";
import SharedReflectionPage from "./views/SharedReflectionPage.vue";
import WriteReflectionPage from "./views/WriteReflectionPage.vue";
import { downloadBlob } from "./lib/downloadBlob";
import {
  type AppMode,
  type BottomTabId,
  bottomNavLabels,
  shouldShowBottomNav,
  getActiveBottomTab,
  isTabActive,
} from "./lib/appNavigation";
import type { AppLanguage } from "./types/recoverse";
import {
  createReflectionDraft,
  loadReflections,
  saveReflection,
  saveReflectionAnswer,
  saveReflections,
} from "./lib/reflectionStore";
import {
  exportReflectionBackup,
  mergeReflectionBackup,
  REFLECTION_BACKUP_SCHEMA,
} from "./lib/reflectionBackup";
import {
  buildReflectionSyncPayload,
  getAccountSaveUnavailableMessage,
  getLocalOnlyStorageWarning,
  type AccountStorageProvider,
} from "./lib/reflectionSync";
import {
  buildShareHash,
  buildSharedReflectionSnapshot,
  REFLECTION_SHARE_HASH_PREFIX,
  readShareHash,
  type SharedReflectionSnapshot,
} from "./lib/reflectionShare";
import { createSampleReflection, SAMPLE_REFLECTION_ID } from "./lib/sampleReflection";
import type { Reflection, ReflectionPeriod, ReflectionQuestionSetMode } from "./types/reflection";

const LANGUAGE_KEY = "recoverse_language";
const THEME_KEY = "recoverse_theme";

const language = ref<AppLanguage>(
  localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "ko"
);
const savedTheme = localStorage.getItem(THEME_KEY);
const appTheme = ref<RecoverseTheme>(
  savedTheme === "letter" || savedTheme === "journey" ? savedTheme : "universe"
);
const activeSettingsSection = ref<SettingsSection>("settings");
const themeOptions: Array<{
  id: RecoverseTheme;
  label: string;
  description: string;
}> = [
  { id: "universe", label: "우주", description: "기본 기억 공간" },
  { id: "letter", label: "편지방", description: "낡은 편지와 잉크" },
  { id: "journey", label: "지도", description: "여행 지도와 항해 일지" },
];

const reflections = ref<Reflection[]>(loadReflections());
const activeReflectionId = ref<string | null>(reflections.value[0]?.id ?? null);
const sharedReflectionSnapshot = ref<SharedReflectionSnapshot | null>(null);

const mode = ref<AppMode>("home-universe");
const modeBackStack = ref<AppMode[]>([]);
const isHandlingBrowserBack = ref(false);

const showBottomNav = computed(() => shouldShowBottomNav(mode.value));

const activeBottomTab = computed<BottomTabId>(() => getActiveBottomTab(mode.value));

const activeReflection = computed(() => {
  if (!activeReflectionId.value) return null;
  return reflections.value.find((reflection) => reflection.id === activeReflectionId.value) ?? null;
});

function saveLanguage() {
  localStorage.setItem(LANGUAGE_KEY, language.value);
}

function setAppTheme(theme: RecoverseTheme) {
  appTheme.value = theme;
  localStorage.setItem(THEME_KEY, theme);
}

function openSettingsSection(section: SettingsSection) {
  activeSettingsSection.value = section;
  if (!confirmLeavingWriteMode()) return;
  setMode("archive-settings");

  nextTick(() => {
    const targetId =
      section === "language"
        ? "settings-language"
        : section === "theme"
          ? "settings-theme"
          : section === "import" || section === "backup"
            ? "settings-backup"
            : "";
    if (!targetId) return;
    document.getElementById(targetId)?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

function onTopMenuAction(action: TopMenuAction) {
  if (action === "backup") {
    if (!confirmLeavingWriteMode()) return;
    if (reflections.value.length > 0) {
      onExportReflections();
      return;
    }
    alert("백업할 회고가 아직 없어요.");
    openSettingsSection("backup");
    return;
  }

  openSettingsSection(action);
}

function requestAccountSave(provider: AccountStorageProvider) {
  const payload = buildReflectionSyncPayload(reflections.value, provider);
  const message = [
    getAccountSaveUnavailableMessage(provider),
    getLocalOnlyStorageWarning(payload.reflections.length),
    "지금 백업 파일을 내려받을까요?",
  ].join("\n\n");

  if (confirm(message)) {
    onExportReflections();
  }
}

// Currently surfaced only through the future account flow.
// Keeping the reference makes the helper discoverable when wiring it up.
void requestAccountSave;

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
    setMode("home-universe");
  }
}

function confirmLeavingWriteMode() {
  if (mode.value !== "reflection-write") return true;
  return confirm(
    "작성 중인 회고를 벗어나려 합니다. 저장하고 다음을 누르지 않은 현재 답변은 저장되지 않을 수 있어요. 이동할까요?"
  );
}

function clearShareHash() {
  if (!window.location.hash.startsWith(REFLECTION_SHARE_HASH_PREFIX)) return;
  window.history.replaceState(
    { recoverseMode: mode.value },
    "",
    `${window.location.pathname}${window.location.search}`
  );
}

function setMode(m: AppMode, options: { recordHistory?: boolean } = {}) {
  const previousMode = mode.value;
  const shouldRecordHistory = options.recordHistory !== false;

  if (m !== "shared-reflections") {
    sharedReflectionSnapshot.value = null;
    clearShareHash();
  }

  if (previousMode !== m && shouldRecordHistory && !isHandlingBrowserBack.value) {
    modeBackStack.value.push(previousMode);
    window.history.pushState({ recoverseMode: m }, "", window.location.href);
  }

  mode.value = m;
}

function navigateBottomTab(tabId: BottomTabId) {
  if (isTabActive(mode.value, tabId)) return;
  if (!confirmLeavingWriteMode()) return;

  if (tabId === "home") {
    setMode("home-universe");
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

function onBrowserBack() {
  if (!confirmLeavingWriteMode()) {
    window.history.pushState({ recoverseMode: mode.value }, "", window.location.href);
    return;
  }

  const previousMode = modeBackStack.value.pop() ?? "home-universe";
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
  window.history.pushState({ recoverseMode: "shared-reflections" }, "", shareUrl);
  setMode("shared-reflections");

  try {
    await navigator.clipboard?.writeText(shareUrl);
    alert("읽기 전용 공유 링크를 복사했어요.");
  } catch {
    window.prompt("읽기 전용 공유 링크를 복사해 주세요.", shareUrl);
  }
}

function startReflectionDraft(payload: {
  templateId: string;
  period: ReflectionPeriod;
  questionSetMode: ReflectionQuestionSetMode;
  title?: string;
}) {
  const duplicate = reflections.value.find(
    (reflection) =>
      reflection.templateId === payload.templateId &&
      reflection.period.label.trim() === payload.period.label.trim()
  );

  if (duplicate) {
    activeReflectionId.value = duplicate.id;
    alert("같은 기간의 회고가 이미 있어요. 새로 만들지 않고 기존 회고를 이어서 열게요.");
    setMode(duplicate.isCompleted ? "reflection-detail" : "reflection-write");
    return;
  }

  const reflection = createReflectionDraft(payload);
  reflections.value = saveReflection(reflection);
  activeReflectionId.value = reflection.id;
  setMode("reflection-write");
}

function loadSampleReflection() {
  const sample =
    reflections.value.find((reflection) => reflection.id === SAMPLE_REFLECTION_ID) ??
    createSampleReflection();
  reflections.value = saveReflection(sample);
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
    alert(
      `회고 가져오기 완료: 추가 ${result.added}개, 업데이트 ${result.updated}개, 유지 ${result.skipped}개`
    );
  } catch (err: any) {
    const reason =
      err?.message === "RECOVERSE_REFLECTION_IMPORT_INVALID_JSON"
        ? "JSON 파일을 읽을 수 없어요."
        : err?.message === "RECOVERSE_REFLECTION_IMPORT_UNSUPPORTED_VERSION"
          ? `${REFLECTION_BACKUP_SCHEMA} 백업 파일이 아니에요.`
          : err?.message ?? "알 수 없는 오류";
    alert(`회고 가져오기 실패: ${reason}`);
  } finally {
    input.value = "";
  }
}

function clearAll() {
  if (!confirm("진짜로 전체 회고를 삭제할까요? (되돌리기 없음)")) return;
  reflections.value = [];
  saveReflections([]);
  activeReflectionId.value = null;
}

onMounted(() => {
  window.history.replaceState({ recoverseMode: mode.value }, "", window.location.href);
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
  background: var(--color-page);
  color: var(--color-ink);
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

.app[data-theme="letter"] {
  --color-page: #17120f;
  --color-bg: #17120f;
  --color-surface: #251d18;
  --color-surface-2: #30241e;
  --color-text: #f1dfc4;
  --color-ink: #f1dfc4;
  --color-gold: #d7a35f;
  --color-primary: #d7a35f;
  --color-border-gold: rgba(215, 163, 95, 0.28);
}

.app[data-theme="journey"] {
  --color-page: #111915;
  --color-bg: #111915;
  --color-surface: #1a2720;
  --color-surface-2: #22342b;
  --color-text: #e8dfca;
  --color-ink: #e8dfca;
  --color-gold: #c7a96a;
  --color-primary: #c7a96a;
  --color-border-gold: rgba(199, 169, 106, 0.28);
}

.main {
  padding: 54px 0 0;
}

.settingsScreen {
  display: grid;
  gap: 16px;
  padding: 24px 18px 32px;
  color: var(--color-text);
}

.settingsHead {
  display: grid;
  gap: 6px;
}

.settingsHead .eyebrow {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

.settingsHead h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
}

.settingsHead p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}

.settingsPanel {
  display: grid;
}
</style>
