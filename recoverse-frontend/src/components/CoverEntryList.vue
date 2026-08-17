<template>
  <div class="entryWrap">
    <span class="eyebrow contentsLabel">CONTENTS</span>
    <div class="entry">
      <button
        v-for="(item, i) in ENTRIES"
        :key="item.target"
        class="entryBtn"
        :class="{ featured: item.featured, together: item.target === 'create' }"
        @click="$emit('navigate', item.target)"
      >
        <span class="entryMain">
          <span class="eyebrow" :class="{ red: item.target !== 'create' }">{{ item.eyebrow }}</span>
          <span class="entryTitle">{{ item.title }}</span>
          <span class="entrySub">{{ item.sub }}</span>
        </span>
        <span class="pageNo">{{ String(i + 1).padStart(2, '0') }}</span>
      </button>
    </div>

    <button type="button" class="joinLine" @click="$emit('navigate', 'join')">
      <span>초대 코드를 받았나요?</span>
      <span class="setsMeta">코드로 참여 →</span>
    </button>

    <!-- 네 갈래 입구를 흐리지 않게 한 줄로 — 준비하는 일이지 시작하는 일이 아니라서. -->
    <button type="button" class="setsLine" @click="$emit('navigate', 'sets')">
      <span>질문 세트</span>
      <span class="setsMeta">{{ setsLabel }} →</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuestionSets } from '../composables/useQuestionSets';

type CoverTarget = 'create' | 'join' | 'solo' | 'rediscover' | 'sets';

const { sets } = useQuestionSets();
const setsLabel = computed(() => (sets.value.length > 0 ? `${sets.value.length}개` : '만들기'));

const ENTRIES = [
  { target: 'create', eyebrow: 'TOGETHER', title: '친구들과 같이 해보기', sub: '3명부터 답의 주인을 맞히는 ‘누가 썼게’가 열려요.', featured: true },
  { target: 'solo', eyebrow: 'SOLO', title: '혼자 쓰기', sub: '바로 쓰거나, 구체적인 대상을 골라 리뷰해요', featured: true },
  { target: 'rediscover', eyebrow: 'REDISCOVER', title: '다시 발견', sub: '같은 질문에 답한, 다른 해의 나를 만나요', featured: false },
] as const satisfies readonly {
  readonly target: CoverTarget;
  readonly eyebrow: string;
  readonly title: string;
  readonly sub: string;
  readonly featured: boolean;
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

.entryBtn:not(.featured):hover {
  background: var(--paper-card);
}

.entryMain {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 3px;
}

.setsLine,
.joinLine {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 2px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--hairline);
  color: var(--dim-strong);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.15s ease;
}

.setsLine:hover,
.joinLine:hover {
  color: var(--vermilion);
}

.setsMeta {
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--dim);
}

.setsLine:hover .setsMeta {
  color: var(--vermilion);
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

.entryBtn.featured {
  padding: 20px 14px;
  background: var(--paper-card);
}

.entryBtn.featured.together {
  background: var(--ink);
  color: var(--paper);
}

.entryBtn.featured.together:hover {
  background: var(--ink-hover);
}

.entryBtn.featured.together .eyebrow {
  color: var(--gold);
}

.entryBtn.featured.together .pageNo {
  color: var(--dim);
}

.entryBtn.featured.together:hover .pageNo {
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

.entryBtn.featured.together .entrySub {
  color: var(--on-ink-dim);
}

@media (min-width: 1024px) {
  .entryWrap {
    min-height: 0;
    margin-bottom: 0;
  }

  .contentsLabel {
    margin-bottom: clamp(4px, 0.9vh, 6px);
  }

  .entryBtn {
    padding: clamp(11px, 1.8vh, 18px) 2px;
  }

  .entryBtn.featured {
    padding: clamp(14px, 2vh, 20px) 16px;
  }

  .entryTitle {
    font-size: clamp(16px, 2vh, 19px);
  }

  .entrySub {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

@media (min-width: 1024px) and (max-height: 720px) {
  .entryBtn {
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .entryBtn.featured {
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .entrySub {
    -webkit-line-clamp: 1;
  }
}
</style>
