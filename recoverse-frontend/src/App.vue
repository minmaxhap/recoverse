<template>
  <!-- 페이지를 넘기는 느낌의 화면 전환 (스펙 §7). mode를 key로 써서 전환마다 재생.
       :duration 명시 = animationend 이벤트 대신 타이머로 종료 —
       prefers-reduced-motion(전역 animation:none)이나 백그라운드 탭에서도 전환이 멈추지 않는다 -->
  <Transition name="page" mode="out-in" :duration="{ enter: 300, leave: 160 }">
    <CoverView
      v-if="mode === 'cover'"
      :key="mode"
      :issues="shelf.issues.value"
      @navigate="onCoverNavigate"
      @open="openIssue"
    />

    <LiveEntryView
      v-else-if="mode === 'create' || mode === 'join'"
      :key="mode"
      :intent="mode"
      :prefill-code="mode === 'join' ? prefillCode : undefined"
      @back="toCover"
      @entered="enterSession"
    />

    <LiveSessionView
      v-else-if="mode === 'live'"
      :key="mode"
      :code="identity.identity.code"
      :me="identity.identity.name"
      :is-host="identity.identity.isHost"
      :player-token="identity.identity.playerToken"
      @exit="leaveSession"
    />

    <SoloWriteView v-else-if="mode === 'solo'" :key="mode" @back="toCover" @published="toCover" />

    <PaperImportView v-else-if="mode === 'paper'" :key="mode" @back="toCover" @published="toCover" />

    <IssueDetailView
      v-else-if="mode === 'issue-detail' && activeIssue"
      :key="`detail-${activeIssue.id}`"
      :issue="activeIssue"
      @back="toCover"
      @removed="toCover"
    />

    <RediscoverView
      v-else-if="mode === 'rediscover'"
      :key="mode"
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

    <AppShell v-else key="loading">
      <p class="waiting">불러오는 중…</p>
    </AppShell>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import CoverView from './views/CoverView.vue';
import LiveEntryView from './views/live/LiveEntryView.vue';
import LiveSessionView from './views/live/LiveSessionView.vue';
import SoloWriteView from './views/SoloWriteView.vue';
import PaperImportView from './views/PaperImportView.vue';
import IssueDetailView from './views/IssueDetailView.vue';
import RediscoverView from './views/RediscoverView.vue';
import RediscoverDetailView from './views/RediscoverDetailView.vue';
import SharedIssueView from './views/SharedIssueView.vue';
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
  | 'paper'
  | 'issue-detail'
  | 'rediscover'
  | 'rediscover-detail'
  | 'shared';

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

/** 공유 뷰에서 나갈 때 — URL의 share 파라미터를 지우고 표지로 */
function leaveShared() {
  sharedId.value = null;
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState(null, '', url.pathname + url.search);
  setMode('cover');
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

function setMode(next: Mode) {
  mode.value = next;
}
function toCover() {
  setMode('cover');
}

function onCoverNavigate(target: string) {
  setMode(target as Mode);
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
</script>
