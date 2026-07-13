<template>
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
</template>

<script setup lang="ts">
type CoverTarget = 'create' | 'join' | 'solo' | 'paper' | 'rediscover';

const ENTRIES = [
  { target: 'create', eyebrow: 'NEW ISSUE', title: '새 호 발행하기', sub: '코드를 만들어 친구들을 초대해요', primary: true },
  { target: 'join', eyebrow: 'JOIN', title: '코드로 참여하기', sub: '각자 자기 폰으로 합류해요', primary: false },
  { target: 'solo', eyebrow: 'SOLO', title: '혼자 엮기', sub: '여행이든 한 달이든, 지금 나에게 질문을 던져요', primary: false },
  { target: 'paper', eyebrow: 'BACK ISSUE', title: '종이 회고 옮기기', sub: '예전 기록을 지난 호로 복간해요', primary: false },
  { target: 'rediscover', eyebrow: 'REDISCOVER', title: '다시 발견', sub: '같은 질문에 답한, 다른 해의 나를 만나요', primary: false },
] as const satisfies readonly {
  readonly target: CoverTarget;
  readonly eyebrow: string;
  readonly title: string;
  readonly sub: string;
  readonly primary: boolean;
}[];

defineEmits<{ navigate: [CoverTarget] }>();
</script>

<style scoped>
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

@media (min-width: 1024px) {
  .entryWrap {
    padding-left: 40px;
  }
}
</style>
