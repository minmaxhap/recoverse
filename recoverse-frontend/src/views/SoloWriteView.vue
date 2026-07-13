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

    <RoundEditor :participants="participants" :rounds="rounds" :kind="kind" @update:rounds="rounds = $event" />

    <p v-if="saveError" class="error" role="alert">{{ saveError }}</p>
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
import { computed, ref } from 'vue';
import { defaultTitle, KIND_LABELS, kstTodayISO, type Kind, type Round } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import KindChips from '../components/KindChips.vue';
import PublishScene from '../components/PublishScene.vue';
import RoundEditor from '../components/RoundEditor.vue';
import { useShelf } from '../composables/useShelf';
import { issueFromDraft } from '../lib/issueBuilder';

const emit = defineEmits<{ back: []; published: [] }>();

const shelf = useShelf();
const kind = ref<Kind>('free');
const title = ref('');
const name = ref('나');
const rounds = ref<Round[]>([]);
const saveError = ref('');
const publishing = ref(false);

const date = computed(() => kstTodayISO());
const defaultIssueTitle = computed(() => defaultTitle(kind.value, date.value));
const issueTitle = computed(() => title.value.trim() || defaultIssueTitle.value);
const participants = computed(() => [name.value.trim() || '나']);
const canPublish = computed(() => rounds.value.length > 0);
const kindLabelText = computed(() => KIND_LABELS[kind.value]);
const publishHelp = computed(() =>
  canPublish.value ? '지금 발행하면 이 호가 내 책장에 저장돼요.' : '질문 하나와 답 하나를 목차에 실으면 발행할 수 있어요.',
);

function publish(): void {
  if (!canPublish.value || publishing.value) return;
  saveError.value = '';

  const issue = issueFromDraft(
    { kind: kind.value, date: date.value, title: issueTitle.value, participants: participants.value, rounds: rounds.value },
    'solo',
  );
  if (!shelf.add(issue)) {
    saveError.value = '브라우저 저장 공간에 저장하지 못했어요. 용량을 비우고 다시 시도해주세요.';
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

.issueSetup,
.publishPreview {
  display: grid;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--ink);
  background: var(--paper-card);
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

.fieldPair {
  display: grid;
  gap: 12px;
}

.publishPreview {
  margin-top: 16px;
}

.previewList {
  display: grid;
  gap: 0;
  margin: 0;
  border-top: 1px solid var(--hairline);
}

.previewList div {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--hairline);
}

.previewList dt {
  font-size: 12px;
  font-weight: 800;
  color: var(--dim);
}

.previewList dd {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  min-width: 0;
  overflow-wrap: anywhere;
}

.publishHelp {
  margin-top: 16px;
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

@media (min-width: 720px) {
  .fieldPair {
    grid-template-columns: 1.2fr 0.8fr;
  }
}
</style>
