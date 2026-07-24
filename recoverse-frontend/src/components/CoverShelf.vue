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

    <div v-else class="covers">
      <IssueCover
        v-for="(issue, index) in issues"
        :key="issue.id"
        :issue="issue"
        :no="issues.length - index"
        @open="$emit('open', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Issue } from '@recoverse/shared';
import IssueCover from './IssueCover.vue';

defineProps<{ readonly issues: readonly Issue[] }>();
defineEmits<{ navigate: ['create']; open: [string] }>();
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

/* 호마다 생성된 표지를 가로로 넘겨보는 서가 */
.covers {
  display: flex;
  gap: 12px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 10px 2px 12px;
  margin-top: 8px;
  scrollbar-width: thin;
  overscroll-behavior-x: contain;
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

@media (min-width: 1024px) {
  .shelfBlock {
    min-height: 0;
    min-width: 0;
  }

  .sectionHead {
    margin-bottom: clamp(4px, 1vh, 8px);
  }

  .covers {
    margin-top: 10px;
    max-width: 100%;
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
