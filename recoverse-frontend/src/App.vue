<template>
  <CoverView
    v-if="mode === 'cover'"
    :issues="shelf.issues.value"
    @navigate="onCoverNavigate"
    @open="openIssue"
  />

  <LiveEntryView
    v-else-if="mode === 'create' || mode === 'join'"
    :intent="mode"
    @back="toCover"
    @entered="enterSession"
  />

  <LiveSessionView
    v-else-if="mode === 'live'"
    :code="identity.identity.code"
    :me="identity.identity.name"
    :is-host="identity.identity.isHost"
    :player-token="identity.identity.playerToken"
    @exit="leaveSession"
  />

  <SoloWriteView v-else-if="mode === 'solo'" @back="toCover" @published="toCover" />

  <PaperImportView v-else-if="mode === 'paper'" @back="toCover" @published="toCover" />

  <IssueDetailView
    v-else-if="mode === 'issue-detail' && activeIssue"
    :issue="activeIssue"
    @back="toCover"
    @removed="toCover"
  />

  <RediscoverView
    v-else-if="mode === 'rediscover'"
    :groups="groups"
    :has-samples="hasSamples"
    @back="toCover"
    @open="openGroup"
    @add-samples="addSamples"
    @remove-samples="removeSamples"
  />

  <RediscoverDetailView
    v-else-if="mode === 'rediscover-detail' && activeGroup"
    :group="activeGroup"
    @back="() => setMode('rediscover')"
  />

  <AppShell v-else>
    <p class="waiting">불러오는 중…</p>
  </AppShell>
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
import AppShell from './components/AppShell.vue';
import { useShelf } from './composables/useShelf';
import { useIdentity } from './composables/useIdentity';
import { groupByQuestion } from './lib/rediscover';
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
  | 'rediscover-detail';

const shelf = useShelf();
const identity = useIdentity();

const mode = ref<Mode>('cover');
const activeIssueId = ref<string | null>(null);
const activeGroupKey = ref<string | null>(null);

// 새로고침해도 세션 신원이 남아 있으면 라이브로 복귀
if (identity.identity.code && identity.identity.name) {
  mode.value = 'live';
}

const activeIssue = computed(() =>
  activeIssueId.value ? shelf.get(activeIssueId.value) : undefined,
);
const groups = computed(() => groupByQuestion(shelf.issues.value));
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
