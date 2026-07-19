<template>
  <AppShell variant="read">
    <BackHeader class="noPrint" label="책장으로" @back="$emit('back')" />
    <header class="issueHead">
      <div class="issueKicker"><span class="eyebrow red">{{ issue.date.slice(0, 4) }} ISSUE</span><div class="issueToolbar noPrint">
        <button class="toolButton" type="button" :aria-label="editing ? '수정 취소' : '호 편집'" @click="editing ? cancelEdit() : startEdit()"><Pencil v-if="!editing" :size="17" /><X v-else :size="17" /><span>{{ editing ? '취소' : '편집' }}</span></button>
        <button class="toolButton" type="button" aria-label="PDF로 저장하거나 인쇄" @click="printIssue"><Printer :size="17" /><span>PDF / 인쇄</span></button>
      </div></div>
      <input v-if="editing" v-model="draftTitle" class="field pageTitleInput" type="text" aria-label="호 제목" />
      <h1 v-else class="pageTitle">{{ issue.title }}</h1>
      <div class="rule" /><p class="fineprint">{{ issue.participants.join(' · ') }}</p>
    </header>

    <p v-if="editError" class="error noPrint" role="alert">{{ editError }}</p>
    <p v-if="reshareNotice" class="statusBanner noPrint" role="status">내용을 고쳐 기존 공유 링크는 새 호와 연결되지 않아요. 다시 공유해 주세요.</p>

    <article v-for="(round, i) in displayedRounds" :key="roundKey(round, i)" class="archiveRound">
      <SpreadLayout :two-col="Object.keys(round.answers).length >= 4">
        <template #left>
          <div v-if="editing" class="roundEditHead">
            <label class="fieldGroup"><span class="fieldLabel">질문 {{ i + 1 }}</span><input v-model="draftRounds[i].question" class="field" /></label>
            <div class="roundActions noPrint">
              <button type="button" class="iconButton" :disabled="i === 0" aria-label="질문을 위로" @click="moveRound(i, -1)"><ArrowUp :size="16" /></button>
              <button type="button" class="iconButton" :disabled="i === draftRounds.length - 1" aria-label="질문을 아래로" @click="moveRound(i, 1)"><ArrowDown :size="16" /></button>
              <button type="button" class="iconButton danger" aria-label="질문 삭제" @click="removeRound(i)"><Trash2 :size="16" /></button>
            </div>
          </div>
          <Headline v-else :no="i + 1" :question="round.question" :asker="round.asker" />
        </template>
        <template #right>
          <div v-if="editing" class="editAnswers">
            <label v-for="name in issue.participants.filter((person) => draftRounds[i]?.answers[person])" :key="name" class="editAnswer"><span class="editAnswerName">{{ name }}</span><textarea v-model="draftRounds[i].answers[name].text" class="field area short" /></label>
          </div>
          <RoundAnswers v-else :participants="issue.participants" :answers="round.answers" :format="round.format" still />
        </template>
      </SpreadLayout>
    </article>
    <p v-if="displayedRounds.length === 0" class="empty">아직 실린 질문이 없어요.</p>
    <div v-if="editing" class="editFooter noPrint"><button class="ghost compactAction" type="button" @click="cancelEdit">취소</button><button class="cta compactAction" type="button" @click="saveEdit">변경 저장</button></div>

    <div class="gap big noPrint" />
    <div class="shareBox noPrint"><button class="ghost" :disabled="sharing" @click="onShare">{{ sharing ? '링크 준비 중' : shareUrl ? '공유 링크 다시 복사' : '읽기 전용 공유 링크 만들기' }}</button><p v-if="shareUrl" class="shareUrl">{{ copied ? '링크를 복사했어요.' : shareUrl }}</p><p v-if="shareError" class="error">{{ shareError }}</p></div>
    <div class="gap noPrint" /><button class="endLink noPrint" @click="onRemove">이 호를 책장에서 비우기</button>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ArrowDown, ArrowUp, Pencil, Printer, Trash2, X } from 'lucide-vue-next';
import type { Issue, Round } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue'; import BackHeader from '../components/BackHeader.vue'; import Headline from '../components/Headline.vue'; import RoundAnswers from '../components/RoundAnswers.vue'; import SpreadLayout from '../components/SpreadLayout.vue';
import { useShelf } from '../composables/useShelf'; import { api, ApiError } from '../lib/api';

const props = defineProps<{ issue: Issue }>();
const emit = defineEmits<{ back: []; removed: [] }>();
const shelf = useShelf(); const sharing = ref(false); const shareUrl = ref(''); const copied = ref(false); const shareError = ref(''); const editing = ref(false); const draftTitle = ref(''); const draftRounds = ref<Round[]>([]); const editError = ref(''); const reshareNotice = ref(false);
const displayedRounds = computed(() => editing.value ? draftRounds.value : props.issue.rounds);

function cloneRounds(rounds: readonly Round[]): Round[] { return rounds.map((round) => ({ ...round, answers: Object.fromEntries(Object.entries(round.answers).map(([name, answer]) => [name, { ...answer }])) })); }
function roundKey(round: Round, index: number): string { return `${round.question}-${round.asker}-${index}`; }
function startEdit(): void { draftTitle.value = props.issue.title; draftRounds.value = cloneRounds(props.issue.rounds); editError.value = ''; editing.value = true; }
function cancelEdit(): void { editing.value = false; editError.value = ''; }
function moveRound(index: number, direction: -1 | 1): void { const next = index + direction; if (next < 0 || next >= draftRounds.value.length) return; const rounds = [...draftRounds.value]; const current = rounds[index]; const target = rounds[next]; if (!current || !target) return; rounds[index] = target; rounds[next] = current; draftRounds.value = rounds; }
function removeRound(index: number): void { draftRounds.value = draftRounds.value.filter((_, itemIndex) => itemIndex !== index); }
function saveEdit(): void { const title = draftTitle.value.trim(); if (!title) { editError.value = '호 제목을 적어 주세요.'; return; } const changed = title !== props.issue.title || JSON.stringify(draftRounds.value) !== JSON.stringify(props.issue.rounds); const patch: Partial<Issue> = { title, rounds: cloneRounds(draftRounds.value) }; if (changed && props.issue.shareId) patch.shareId = undefined; if (!shelf.update(props.issue.id, patch)) { editError.value = '변경을 저장하지 못했어요. 책장은 그대로 두었어요.'; return; } reshareNotice.value = Boolean(changed && props.issue.shareId); shareUrl.value = ''; editing.value = false; }
function shareLink(id: string): string { return `${window.location.origin}${window.location.pathname}?share=${id}`; }
function printIssue(): void { window.print(); }
async function onShare(): Promise<void> { if (sharing.value) return; shareError.value = ''; try { let id = props.issue.shareId; if (!id) { sharing.value = true; const response = await api.createShare(props.issue); id = response.shareId; if (!shelf.update(props.issue.id, { shareId: id })) throw new Error('share-save-failed'); } shareUrl.value = shareLink(id); try { await navigator.clipboard.writeText(shareUrl.value); copied.value = true; } catch { copied.value = false; } } catch (error) { shareError.value = error instanceof ApiError ? error.message : '공유 링크를 만들지 못했어요.'; } finally { sharing.value = false; } }
function onRemove(): void { if (!window.confirm('이 호를 책장에서 비울까요? 되돌릴 수 없어요.')) return; if (shelf.remove(props.issue.id)) emit('removed'); }
</script>

<style scoped>
.issueHead{display:grid;gap:8px;margin:8px 0 26px}.issueKicker{display:flex;align-items:center;justify-content:space-between;gap:12px}.issueToolbar,.roundActions,.editFooter{display:flex;gap:7px;align-items:center}.toolButton,.iconButton{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:8px 10px;background:var(--paper-card);border:1px solid var(--ink);color:var(--ink);font:700 12px var(--font-ui);cursor:pointer}.toolButton:hover,.iconButton:hover:not(:disabled){color:var(--vermilion);border-color:var(--vermilion)}.iconButton{width:36px;padding:0}.iconButton.danger:hover{background:var(--vermilion);color:var(--vermilion-ink)}.archiveRound{margin-bottom:34px}.roundEditHead{display:grid;gap:10px}.roundActions{justify-content:flex-end}.editAnswers{display:grid;gap:14px}.editAnswer{display:grid;gap:6px}.editAnswerName{font-size:12px;font-weight:800;letter-spacing:.04em;color:var(--dim)}.pageTitleInput{font-family:var(--font-display);font-size:28px;font-weight:700}.editFooter{justify-content:flex-end;margin:0 0 26px}.compactAction{width:auto;min-width:100px;min-height:44px;padding:10px 14px;font-size:13px}.empty{font-size:14px;color:var(--dim)}.shareBox{display:grid;gap:8px}.shareUrl{margin:0;padding:12px;border:1px solid var(--hairline);background:var(--paper-card);font-size:13px;line-height:1.5;word-break:break-all}@media(max-width:480px){.issueToolbar{width:100%;justify-content:flex-end}.toolButton span{display:none}.toolButton{width:40px;padding:0}.issueKicker{align-items:flex-start}.editFooter{display:grid;grid-template-columns:1fr 1fr}.compactAction{width:100%}}
</style>
