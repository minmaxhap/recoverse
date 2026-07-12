<template>
  <AppShell variant="read">
    <header class="masthead">
      <div class="rule thick" />
      <h1 class="brand">RECOVERSE</h1>
      <div class="deck">
        <span>질문과 답으로 만드는 연말호</span>
        <span>EST. 2016</span>
      </div>
      <div class="rule" />
    </header>

    <div class="coverSplit">
      <p class="coverline">
        한 해에 한 번,<br />
        우리는 서로에게<br />
        <em>질문</em>이 된다.
      </p>

      <div class="entryWrap">
        <span class="eyebrow contentsLabel">CONTENTS</span>
        <div class="entry">
          <button
            v-for="(item, i) in ENTRIES"
            :key="item.target"
            class="entryBtn"
            :class="{ primary: item.primary }"
            @click="$emit('navigate', item.target)"
          >
            <span class="entryMain">
              <span class="eyebrow" :class="{ red: !item.primary }">{{ item.eyebrow }}</span>
              <span class="entryTitle">{{ item.title }}</span>
              <span class="entrySub">{{ item.sub }}</span>
            </span>
            <span class="pageNo">{{ String(i + 1).padStart(2, '0') }}</span>
          </button>
        </div>
      </div>
    </div>

    <section class="backissues">
      <div class="sectionHead">
        <h2>지난 호</h2>
        <span class="count">{{ issues.length }}권</span>
      </div>
      <!-- 빈 책장 = 초대장: 유령 책등 세 권이 첫 호를 기다린다 -->
      <button v-if="issues.length === 0" class="emptyInvite" @click="$emit('navigate', 'create')">
        <span class="ghostShelf" aria-hidden="true">
          <i /><i class="tall" /><i />
        </span>
        <span class="inviteTitle">책장이 비어 있어요</span>
        <span class="inviteSub">첫 호의 발행인이 되어보세요 — 코드 하나면 친구들과 시작할 수 있어요</span>
        <span class="inviteCta">첫 호 발행하러 가기 →</span>
      </button>

      <!-- 모바일: 리스트 / 데스크톱: 책등 나열 -->
      <div class="spines">
        <button
          v-for="issue in issues"
          :key="issue.id"
          class="spine"
          @click="$emit('open', issue.id)"
        >
          <span class="spineKind" :style="{ background: kindColor(issue.kind) }" aria-hidden="true" />
          <span class="spineYear">{{ issue.date.slice(0, 4) }}</span>
          <span class="spineTitle">{{ issue.title }}</span>
        </button>
      </div>

      <div class="issueList">
        <button
          v-for="issue in issues"
          :key="issue.id"
          class="issueRow"
          @click="$emit('open', issue.id)"
        >
          <span class="issueYear">{{ issue.date.slice(0, 4) }}</span>
          <span class="issueInfo">
            <span class="issueTitleLine">
              <b>{{ issue.title }}</b>
              <span class="kindTag" :style="{ color: kindColor(issue.kind), borderColor: kindColor(issue.kind) }">
                {{ KIND_LABELS[issue.kind] }}
              </span>
            </span>
            <small>{{ (issue.participants || []).join(' · ') }} — 질문 {{ (issue.rounds || []).length }}개</small>
          </span>
          <span class="arrow">→</span>
        </button>
      </div>

      <div class="importRow">
        <button
          type="button"
          class="importLink"
          aria-describedby="importStatus"
          @click="openImport"
        >
          이전 Recoverse 백업 가져오기
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          class="srOnly"
          tabindex="-1"
          aria-hidden="true"
          @change="onImport"
        />
        <div id="importStatus" aria-live="polite">
          <p v-if="importMsg" class="fineprint">{{ importMsg }}</p>
          <p v-if="importErr" class="error" role="alert">{{ importErr }}</p>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { KIND_LABELS, type Issue } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import { useShelf } from '../composables/useShelf';
import { kindColor } from '../lib/palette';
import { parseReflectionBackup, BackupImportError } from '../lib/backupImport';

defineProps<{ issues: Issue[] }>();
const ENTRIES = [
  { target: 'create', eyebrow: 'NEW ISSUE', title: '새 호 발행하기', sub: '코드를 만들어 친구들을 초대해요', primary: true },
  { target: 'join', eyebrow: 'JOIN', title: '코드로 참여하기', sub: '각자 자기 폰으로 합류해요', primary: false },
  { target: 'solo', eyebrow: 'SOLO', title: '혼자 쓰기', sub: '여행이든 한 달이든, 지금 나에게 질문을 던져요', primary: false },
  { target: 'paper', eyebrow: 'BACK ISSUE', title: '종이 회고 옮기기', sub: '예전 기록을 지난 호로 복간해요', primary: false },
  { target: 'rediscover', eyebrow: 'REDISCOVER', title: '다시 발견', sub: '같은 질문에 답한, 다른 해의 나를 만나요', primary: false },
] as const;
type CoverTarget = (typeof ENTRIES)[number]['target'];
defineEmits<{ navigate: [CoverTarget]; open: [string] }>();

const shelf = useShelf();
const importMsg = ref('');
const importErr = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

/** 표지 목차 — 잡지 Contents처럼 번호를 매긴 입구 5개 */

function openImport() {
  fileInput.value?.click();
}

function isFileInput(target: EventTarget | null): target is HTMLInputElement {
  return target instanceof HTMLInputElement && target.type === 'file';
}

async function onImport(event: Event) {
  importMsg.value = '';
  importErr.value = '';
  if (!isFileInput(event.target)) return;
  const input = event.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const imported = parseReflectionBackup(await file.text());
    for (const issue of imported) shelf.add(issue);
    importMsg.value = `${imported.length}권을 책장에 가져왔어요.`;
  } catch (err) {
    importErr.value = err instanceof BackupImportError ? err.message : '가져오기에 실패했어요.';
  }
}
</script>

<style scoped>
.masthead .brand {
  font-family: var(--font-display);
  font-size: clamp(30px, 9vw, 40px);
  letter-spacing: 0.02em;
  margin: 10px 0 6px;
  font-weight: 700;
}
.masthead .deck {
  display: grid;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding-bottom: 10px;
  line-height: 1.5;
}
.coverline {
  font-family: var(--font-display);
  font-size: 30px;
  line-height: 1.5;
  margin: 34px 0 36px;
}
.coverline em {
  font-style: normal;
  color: var(--vermilion);
  /* 로드 시 밑줄이 그어지는 연출 */
  background: linear-gradient(var(--vermilion), var(--vermilion)) left bottom / 0% 3px no-repeat;
  animation: drawUnderline 0.7s ease 0.5s both;
  padding-bottom: 2px;
}
@keyframes drawUnderline {
  to {
    background-size: 100% 3px;
  }
}

.entryWrap {
  margin-bottom: 44px;
}
.contentsLabel {
  display: block;
  margin-bottom: 6px;
  color: var(--dim);
}
.entry {
  display: grid;
  gap: 0;
  border-top: 1px solid var(--ink);
}
.entryBtn {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 18px 2px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--ink);
  cursor: pointer;
  color: inherit;
  transition: background 0.15s ease;
}
.entryBtn:not(.primary):hover {
  background: var(--paper-card);
}
.entryMain {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 3px;
}
.pageNo {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--hairline);
  transition: color 0.15s ease, transform 0.15s ease;
}
.entryBtn:hover .pageNo {
  color: var(--vermilion);
  transform: translateX(-3px);
}
.entryBtn.primary {
  background: var(--ink);
  color: var(--paper);
  padding: 20px 16px;
}
.entryBtn.primary:hover {
  background: var(--ink-hover);
}
.entryBtn.primary .eyebrow {
  color: var(--gold);
}
.entryBtn.primary .pageNo {
  color: var(--dim);
}
.entryBtn.primary:hover .pageNo {
  color: var(--gold);
}
.entryTitle {
  font-size: 19px;
  font-weight: 800;
}
.entrySub {
  font-size: 13px;
  line-height: 1.55;
  color: var(--dim);
}
.entryBtn.primary .entrySub {
  color: var(--on-ink-dim);
}

.sectionHead {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}
.sectionHead h2 {
  font-size: 15px;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.02em;
}
.count {
  font-size: 12px;
  color: var(--dim);
}
/* 빈 책장 초대장 */
.emptyInvite {
  width: 100%;
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
  padding: 28px 16px 24px;
  margin-top: 6px;
  background: none;
  border: 1px dashed var(--dim);
  cursor: pointer;
  color: inherit;
  font-family: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.emptyInvite:hover {
  border-color: var(--vermilion);
  background: var(--paper-card);
}
.ghostShelf {
  display: flex;
  align-items: flex-end;
  gap: 7px;
  margin-bottom: 10px;
}
.ghostShelf i {
  width: 20px;
  height: 58px;
  border: 1.5px dashed var(--hairline);
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.ghostShelf i.tall {
  height: 70px;
}
.emptyInvite:hover .ghostShelf i {
  border-color: var(--vermilion);
}
.emptyInvite:hover .ghostShelf i.tall {
  transform: translateY(-4px);
}
.inviteTitle {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 700;
}
.inviteSub {
  font-size: 13px;
  color: var(--dim);
  line-height: 1.6;
  max-width: 300px;
}
.inviteCta {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--vermilion);
}
.issueRow {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--hairline);
  padding: 14px 2px;
  cursor: pointer;
  color: inherit;
  transition: background 0.15s ease;
}
.issueRow:hover {
  background: var(--paper-card);
}
.issueRow:hover .arrow {
  color: var(--vermilion);
  transform: translateX(4px);
}
.issueYear {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
}
.issueInfo {
  flex: 1;
  display: grid;
  gap: 2px;
}
.issueTitleLine {
  display: flex;
  align-items: center;
  gap: 8px;
}
.issueInfo b {
  font-size: 15px;
}
.kindTag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  border: 1px solid;
  padding: 1px 6px;
  flex-shrink: 0;
}
.issueInfo small {
  font-size: 12px;
  color: var(--dim);
}
.arrow {
  color: var(--dim);
  transition: color 0.15s ease, transform 0.15s ease;
}
.importRow {
  margin-top: 14px;
  display: grid;
  gap: 6px;
}
.importLink {
  width: fit-content;
  padding: 0;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  color: var(--dim);
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.15s ease;
}
.importLink:hover {
  color: var(--vermilion);
}

/* 책등은 데스크톱에서만 */
.spines {
  display: none;
}

@media (min-width: 1024px) {
  .masthead .deck {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .coverSplit {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    align-items: start;
  }
  .coverSplit .coverline {
    padding-right: 40px;
    border-right: 1px solid var(--hairline);
    font-size: 34px;
  }
  .coverSplit .entryWrap {
    padding-left: 40px;
  }
  .issueList {
    display: none;
  }
  .spines {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    flex-wrap: wrap;
    margin-top: 10px;
  }
  .spine {
    position: relative;
    writing-mode: vertical-rl;
    background: var(--paper-card);
    border: 1px solid var(--ink);
    padding: 16px 8px 12px;
    height: 150px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: inherit;
    transition: transform 0.16s ease, border-color 0.16s ease;
  }
  /* 책등 상단의 종류 색 밴드 */
  .spineKind {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    writing-mode: horizontal-tb;
  }
  .spine:hover {
    transform: translateY(-8px);
    border-color: var(--vermilion);
  }
  .spineYear {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 15px;
  }
  .spineTitle {
    font-size: 12px;
    font-weight: 700;
  }
}
</style>
