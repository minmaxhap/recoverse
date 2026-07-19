<template>
  <div class="shelfBlock">
    <div class="sectionHead">
      <h2>지난 호</h2>
      <span class="count">{{ issues.length }}권</span>
    </div>

    <button v-if="issues.length === 0" class="emptyInvite" @click="$emit('navigate', 'create')">
      <span class="ghostShelf" aria-hidden="true">
        <i /><i class="tall" /><i />
      </span>
      <span class="inviteTitle">책장이 비어 있어요</span>
      <span class="inviteSub">첫 호의 발행인이 되어보세요. 코드 하나면 친구들과 시작할 수 있어요.</span>
      <span class="inviteCta">첫 호 발행하러 가기</span>
    </button>

    <div class="spines">
      <button
        v-for="issue in issues"
        :key="issue.id"
        class="spine"
        @click="$emit('open', issue.id)"
      >
        <span class="spineKind" :style="{ background: kindColor(issue.kind) }" aria-hidden="true" />
        <span class="spineLabel">{{ spineLabel(issue) }}</span>
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
          <small>{{ (issue.participants || []).join(' · ') }} - 질문 {{ (issue.rounds || []).length }}개</small>
        </span>
        <span class="arrow">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KIND_LABELS, type Issue } from '@recoverse/shared';
import { kindColor } from '../lib/palette';

defineProps<{ readonly issues: readonly Issue[] }>();
defineEmits<{ navigate: ['create']; open: [string] }>();

function spineLabel(issue: Issue): string {
  const title = issue.title.trim();
  const year = issue.date.slice(0, 4);
  const label = KIND_LABELS[issue.kind];
  if (title && !title.includes(year) && title !== label) return title;
  return title.replace(new RegExp(`^${year}\\s*`), '') || label;
}
</script>

<style scoped>
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

.spines {
  display: none;
}

@media (min-width: 1024px) {
  .shelfBlock {
    min-height: 0;
    overflow: hidden;
  }

  .sectionHead {
    margin-bottom: clamp(4px, 1vh, 8px);
  }

  .issueList {
    display: none;
  }

  .spines {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    flex-wrap: nowrap;
    max-width: 100%;
    max-height: 158px;
    overflow-x: auto;
    overflow-y: visible;
    padding: 9px 2px 10px;
    margin-top: 10px;
  }

  .spine {
    position: relative;
    writing-mode: vertical-rl;
    background: var(--paper-card);
    border: 1px solid var(--ink);
    padding: clamp(11px, 1.8vh, 16px) 8px clamp(9px, 1.4vh, 12px);
    height: clamp(104px, 16vh, 142px);
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: inherit;
    transition: transform 0.16s ease, border-color 0.16s ease;
  }

  .spineKind {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 6px;
    writing-mode: horizontal-tb;
  }

  .spine:hover {
    transform: translateY(-4px);
    border-color: var(--vermilion);
  }

  .spineLabel {
    font-family: var(--font-display);
    font-size: clamp(12px, 1.5vh, 15px);
    font-weight: 700;
    max-height: 112px;
    overflow: hidden;
  }

  .emptyInvite {
    grid-template-columns: auto minmax(0, 1fr) auto;
    justify-items: start;
    align-items: center;
    gap: 12px;
    text-align: left;
    padding: 12px 14px;
  }

  .ghostShelf {
    margin-bottom: 0;
  }

  .ghostShelf i {
    width: 14px;
    height: 44px;
  }

  .ghostShelf i.tall {
    height: 54px;
  }

  .inviteSub {
    display: none;
  }

  .inviteCta {
    margin-top: 0;
    white-space: nowrap;
  }
}
</style>
