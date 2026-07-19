<template>
  <!-- 페이지를 넘기는 느낌의 화면 전환 (스펙 §7). mode를 key로 써서 전환마다 재생.
       :duration 명시 = animationend 이벤트 대신 타이머로 종료 —
       prefers-reduced-motion(전역 animation:none)이나 백그라운드 탭에서도 전환이 멈추지 않는다 -->
  <Transition name="page" mode="out-in" :duration="{ enter: 300, leave: 160 }">
    <CoverView
      v-if="mode === 'cover'"
      key="view-cover"
      :issues="shelf.issues.value"
      :moment="moment"
      @navigate="onCoverNavigate"
      @open="openIssue"
      @open-group="openGroup"
    />

    <LiveEntryView
      v-else-if="mode === 'create' || mode === 'join'"
      :key="`view-entry-${mode}`"
      :intent="mode"
      :prefill-code="mode === 'join' ? prefillCode : undefined"
      @back="toCover"
      @entered="enterSession"
    />

    <LiveSessionView
      v-else-if="mode === 'live'"
      key="view-live"
      :code="identity.identity.code"
      :me="identity.identity.name"
      :is-host="identity.identity.isHost"
      :player-token="identity.identity.playerToken"
      @exit="leaveSession"
    />

    <SoloWriteView v-else-if="mode === 'solo'" key="view-solo" @back="toCover" @published="toCover" />


    <IssueDetailView
      v-else-if="mode === 'issue-detail' && activeIssue"
      :key="`detail-${activeIssue.id}`"
      :issue="activeIssue"
      @back="toCover"
      @removed="toCover"
    />

    <RediscoverView
      v-else-if="mode === 'rediscover'"
      key="view-rediscover"
      :groups="groups"
      :has-samples="hasSamples"
      :moment="moment"
      @back="toCover"
      @open="openGroup"
      @add-samples="addSamples"
      @remove-samples="removeSamples"
    />

    <RediscoverDetailView
      v-else-if="mode === 'rediscover-detail' && activeGroup"
      :key="`redis-${activeGroup.key}`"
      :group="activeGroup"
      @back="() => setMode('rediscover')"
    />

    <SharedIssueView
      v-else-if="mode === 'shared' && sharedId"
      :key="`shared-${sharedId}`"
      :share-id="sharedId"
      @start="leaveShared"
    />

    <VocAdminView v-else-if="mode === 'voc-admin'" key="view-voc-admin" @back="toCover" />

    <AppShell v-else key="view-loading">
      <p class="waiting">불러오는 중…</p>
    </AppShell>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import CoverView from './views/CoverView.vue';
import LiveEntryView from './views/live/LiveEntryView.vue';
import LiveSessionView from './views/live/LiveSessionView.vue';
import SoloWriteView from './views/SoloWriteView.vue';
import IssueDetailView from './views/IssueDetailView.vue';
import RediscoverView from './views/RediscoverView.vue';
import RediscoverDetailView from './views/RediscoverDetailView.vue';
import SharedIssueView from './views/SharedIssueView.vue';
import VocAdminView from './views/VocAdminView.vue';
import AppShell from './components/AppShell.vue';
import { useShelf } from './composables/useShelf';
import { useIdentity } from './composables/useIdentity';
import { groupByQuestion, pickRediscoveryMoment } from './lib/rediscover';
import { sampleIssues, isSample } from './lib/samples';

type Mode =
  | 'cover'
  | 'create'
  | 'join'
  | 'live'
  | 'solo'
  | 'issue-detail'
  | 'rediscover'
  | 'rediscover-detail'
  | 'shared'
  | 'voc-admin';

type CoverTarget = 'create' | 'join' | 'solo' | 'rediscover';

type AppHistoryState = {
  readonly recoverse: true;
  readonly mode: Mode;
  readonly activeIssueId: string | null;
  readonly activeGroupKey: string | null;
  readonly sharedId: string | null;
};

const MODES = [
  'cover',
  'create',
  'join',
  'live',
  'solo',
  'issue-detail',
  'rediscover',
  'rediscover-detail',
  'shared',
  'voc-admin',
] as const satisfies readonly Mode[];
const MODE_SET: ReadonlySet<string> = new Set(MODES);

const shelf = useShelf();
const identity = useIdentity();

const mode = ref<Mode>('cover');
const activeIssueId = ref<string | null>(null);
const activeGroupKey = ref<string | null>(null);
const sharedId = ref<string | null>(null);
const prefillCode = ref<string | undefined>(undefined);

// 공유 링크(?share=<id>)로 열면 읽기 전용 공유 뷰가 최우선
const shareParam = new URLSearchParams(window.location.search).get('share');
// 합류 링크(?join=<code>)로 열면 참여 화면으로 바로 진입, 코드는 미리 채워둠
const joinParam = new URLSearchParams(window.location.search).get('join');
if (shareParam) {
  sharedId.value = shareParam;
  mode.value = 'shared';
} else if (joinParam) {
  prefillCode.value = joinParam.toUpperCase();
  mode.value = 'join';
} else if (identity.identity.code && identity.identity.name) {
  // 새로고침해도 세션 신원이 남아 있으면 라이브로 복귀
  mode.value = 'live';
}

const adminParam = new URLSearchParams(window.location.search).get('admin');
if (adminParam === 'voc') {
  mode.value = 'voc-admin';
}

/** 공유 뷰에서 나갈 때 — URL의 share 파라미터를 지우고 표지로 */
function leaveShared() {
  sharedId.value = null;
  mode.value = 'cover';
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState(currentHistoryState(), '', url.pathname + url.search);
}

const activeIssue = computed(() =>
  activeIssueId.value ? shelf.get(activeIssueId.value) : undefined,
);
const groups = computed(() => groupByQuestion(shelf.issues.value));
const moment = computed(() => pickRediscoveryMoment(shelf.issues.value));
const activeGroup = computed(() =>
  activeGroupKey.value ? groups.value.find((g) => g.key === activeGroupKey.value) : undefined,
);
const hasSamples = computed(() => shelf.issues.value.some(isSample));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && MODE_SET.has(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isAppHistoryState(value: unknown): value is AppHistoryState {
  return (
    isRecord(value) &&
    value.recoverse === true &&
    isMode(value.mode) &&
    isNullableString(value.activeIssueId) &&
    isNullableString(value.activeGroupKey) &&
    isNullableString(value.sharedId)
  );
}

function canRestoreHistoryState(next: AppHistoryState): boolean {
  if (next.mode === 'issue-detail') return next.activeIssueId !== null && shelf.get(next.activeIssueId) !== undefined;
  if (next.mode === 'rediscover-detail') return next.activeGroupKey !== null && groups.value.some((group) => group.key === next.activeGroupKey);
  if (next.mode === 'shared') return next.sharedId !== null;
  if (next.mode === 'live') return Boolean(identity.identity.code && identity.identity.name);
  return true;
}

function currentHistoryState(): AppHistoryState {
  return {
    recoverse: true,
    mode: mode.value,
    activeIssueId: activeIssueId.value,
    activeGroupKey: activeGroupKey.value,
    sharedId: sharedId.value,
  };
}

function commitHistory(replace: boolean) {
  const next = currentHistoryState();
  if (replace) {
    window.history.replaceState(next, '');
  } else {
    window.history.pushState(next, '');
  }
}

function restoreHistoryState(next: AppHistoryState) {
  mode.value = next.mode;
  activeIssueId.value = next.activeIssueId;
  activeGroupKey.value = next.activeGroupKey;
  sharedId.value = next.sharedId;
}

function restoreInitialHistoryState(): void {
  if (shareParam || joinParam || adminParam === 'voc') return;
  const next = window.history.state;
  if (!isAppHistoryState(next) || !canRestoreHistoryState(next)) return;
  restoreHistoryState(next);
}

restoreInitialHistoryState();

function onPopState(event: PopStateEvent) {
  if (isAppHistoryState(event.state)) {
    restoreHistoryState(event.state);
    return;
  }
  mode.value = 'cover';
  activeIssueId.value = null;
  activeGroupKey.value = null;
  sharedId.value = null;
}

function setMode(next: Mode, options: { readonly replace?: boolean } = {}) {
  mode.value = next;
  commitHistory(options.replace === true);
}
function toCover() {
  activeIssueId.value = null;
  activeGroupKey.value = null;
  setMode('cover');
  const url = new URL(window.location.href);
  if (url.searchParams.has('admin')) {
    url.searchParams.delete('admin');
    window.history.replaceState(currentHistoryState(), '', url.pathname + url.search);
  }
}

function onCoverNavigate(target: CoverTarget) {
  setMode(target);
}

function openIssue(id: string) {
  activeIssueId.value = id;
  setMode('issue-detail');
}

function enterSession() {
  setMode('live');
}
function leaveSession() {
  identity.clear();
  shelf.reload();
  toCover();
}

function openGroup(key: string) {
  activeGroupKey.value = key;
  setMode('rediscover-detail');
}

function addSamples() {
  for (const issue of sampleIssues()) shelf.add(issue);
}
function removeSamples() {
  for (const issue of shelf.issues.value.filter(isSample)) shelf.remove(issue.id);
}

onMounted(() => {
  window.addEventListener('popstate', onPopState);
  commitHistory(true);
});
onUnmounted(() => {
  window.removeEventListener('popstate', onPopState);
});
</script>
