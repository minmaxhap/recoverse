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

      <div class="entry">
        <button class="entryBtn primary" @click="$emit('navigate', 'create')">
          <span class="eyebrow">NEW ISSUE</span>
          <span class="entryTitle">새 호 발행하기</span>
          <span class="entrySub">코드를 만들어 친구들을 초대해요</span>
        </button>
        <button class="entryBtn" @click="$emit('navigate', 'join')">
          <span class="eyebrow red">JOIN</span>
          <span class="entryTitle">코드로 참여하기</span>
          <span class="entrySub">각자 자기 폰으로 합류해요</span>
        </button>
        <button class="entryBtn" @click="$emit('navigate', 'solo')">
          <span class="eyebrow red">SOLO</span>
          <span class="entryTitle">혼자 쓰기</span>
          <span class="entrySub">여행이든 한 달이든, 지금 나에게 질문을 던져요</span>
        </button>
        <button class="entryBtn" @click="$emit('navigate', 'paper')">
          <span class="eyebrow red">BACK ISSUE</span>
          <span class="entryTitle">종이 회고 옮기기</span>
          <span class="entrySub">예전 기록을 지난 호로 복간해요</span>
        </button>
        <button class="entryBtn" @click="$emit('navigate', 'rediscover')">
          <span class="eyebrow red">REDISCOVER</span>
          <span class="entryTitle">다시 발견</span>
          <span class="entrySub">같은 질문에 답한, 다른 해의 나를 만나요</span>
        </button>
      </div>
    </div>

    <section class="backissues">
      <div class="sectionHead">
        <h2>지난 호</h2>
        <span class="count">{{ issues.length }}권</span>
      </div>
      <p v-if="issues.length === 0" class="empty">아직 발행된 호가 없어요. 첫 호를 만들어보세요.</p>

      <!-- 모바일: 리스트 / 데스크톱: 책등 나열 -->
      <div class="spines">
        <button
          v-for="issue in issues"
          :key="issue.id"
          class="spine"
          @click="$emit('open', issue.id)"
        >
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
            <b>{{ issue.title }}</b>
            <small>{{ (issue.participants || []).join(' · ') }} — 질문 {{ (issue.rounds || []).length }}개</small>
          </span>
          <span class="arrow">→</span>
        </button>
      </div>

      <div class="importRow">
        <label class="importLink">
          이전 Recoverse 백업 가져오기
          <input type="file" accept=".json,application/json" hidden @change="onImport" />
        </label>
        <p v-if="importMsg" class="fineprint">{{ importMsg }}</p>
        <p v-if="importErr" class="error">{{ importErr }}</p>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Issue } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import { useShelf } from '../composables/useShelf';
import { parseReflectionBackup, BackupImportError } from '../lib/backupImport';

defineProps<{ issues: Issue[] }>();
defineEmits<{ navigate: [string]; open: [string] }>();

const shelf = useShelf();
const importMsg = ref('');
const importErr = ref('');

async function onImport(event: Event) {
  importMsg.value = '';
  importErr.value = '';
  const input = event.target as HTMLInputElement;
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
  font-size: 40px;
  letter-spacing: 0.04em;
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
  border-bottom: 3px solid var(--vermilion);
}

.entry {
  display: grid;
  gap: 0;
  border-top: 1px solid var(--ink);
  margin-bottom: 44px;
}
.entryBtn {
  display: grid;
  gap: 3px;
  text-align: left;
  padding: 18px 2px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--ink);
  cursor: pointer;
  color: inherit;
}
.entryBtn.primary {
  background: var(--ink);
  color: var(--paper);
  padding: 20px 16px;
}
.entryBtn.primary .eyebrow {
  color: var(--gold);
}
.entryTitle {
  font-size: 19px;
  font-weight: 800;
}
.entrySub {
  font-size: 13px;
  color: var(--dim);
}
.entryBtn.primary .entrySub {
  color: #b9b2a6;
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
.empty {
  font-size: 14px;
  color: var(--dim);
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
.issueInfo b {
  font-size: 15px;
}
.issueInfo small {
  font-size: 12px;
  color: var(--dim);
}
.arrow {
  color: var(--dim);
}
.importRow {
  margin-top: 14px;
  display: grid;
  gap: 6px;
}
.importLink {
  font-size: 13px;
  font-weight: 700;
  color: var(--dim);
  text-decoration: underline;
  cursor: pointer;
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
  .coverSplit .entry {
    padding-left: 40px;
    border-top: 1px solid var(--ink);
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
    writing-mode: vertical-rl;
    background: var(--paper-card);
    border: 1px solid var(--ink);
    padding: 12px 8px;
    height: 150px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: inherit;
    transition: transform 0.16s ease, border-color 0.16s ease;
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
