<!-- // allow: SIZE_OK — one horizontal shelf scroller; measurement, pager, observer, and rail share coversEl -->
<template>
  <div class="shelfBlock">
    <div class="sectionHead">
      <h2>지난 호</h2>
      <span class="count">{{ issues.length }}권</span>
      <div v-if="paged" class="pager noPrint">
        <button type="button" class="pageBtn" :disabled="!canPrev" aria-label="이전 표지 보기" @click="page(-1)">
          ‹
        </button>
        <button type="button" class="pageBtn" :disabled="!canNext" aria-label="다음 표지 보기" @click="page(1)">
          ›
        </button>
      </div>
    </div>

    <button v-if="issues.length === 0" class="emptyInvite" @click="$emit('navigate', 'create')">
      <span class="ghostShelf" aria-hidden="true">
        <i /><i class="tall" /><i />
      </span>
      <span class="inviteTitle">책장이 비어 있어요</span>
      <span class="inviteCta">첫 호 발행하러 가기</span>
    </button>

    <!-- 서가 한 칸: 표지를 가로로 꽂아두고 넘겨본다. 넘길 게 있을 때만 화살표와 잉크 레일이 나온다. -->
    <div v-else class="shelfViewport" :class="{ hasPrev: canPrev, hasNext: canNext }">
      <div ref="coversEl" class="covers" @scroll.passive="measure">
        <FreshIssueCover
          v-for="(issue, index) in issues"
          :key="issue.id"
          :issue="issue"
          :no="issues.length - index"
          :fresh="issue.id === freshIssueId"
          @open="$emit('open', $event)"
        />
      </div>
      <!-- 기본 스크롤바 대신 잉크 레일 — 어디쯤 보고 있는지만 얇게 알린다. -->
      <div v-if="paged" class="rail" aria-hidden="true">
        <span class="railInk" :style="railStyle" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Issue } from '@recoverse/shared';
import FreshIssueCover from './FreshIssueCover.vue';

const props = withDefaults(
  // freshIssueId: 방금 발행하고 돌아온 호 — 어느 표지가 새로 꽂혔는지 잠깐 짚어준다.
  defineProps<{ readonly issues: readonly Issue[]; readonly freshIssueId?: string }>(),
  { freshIssueId: '' },
);
defineEmits<{ navigate: ['create']; open: [string] }>();

const coversEl = ref<HTMLElement | null>(null);
const scrolled = ref(0);
const viewWidth = ref(0);
const shelfWidth = ref(0);
let observer: ResizeObserver | null = null;

// 표지가 한 칸을 넘칠 때만 넘기기 장치를 붙인다 — 몇 권 없으면 그냥 다 보인다.
const paged = computed(() => shelfWidth.value - viewWidth.value > 4);
const canPrev = computed(() => paged.value && scrolled.value > 4);
const canNext = computed(() => paged.value && scrolled.value + viewWidth.value < shelfWidth.value - 4);

// 레일 잉크의 폭·위치는 트랙 너비 기준 퍼센트 — 퍼센트 margin이 트랙 폭을 기준으로 잡힌다.
const railStyle = computed(() => {
  const total = shelfWidth.value || 1;
  return {
    width: `${Math.min(100, (viewWidth.value / total) * 100)}%`,
    marginLeft: `${(scrolled.value / total) * 100}%`,
  };
});

function measure(): void {
  const el = coversEl.value;
  if (!el) return;
  scrolled.value = el.scrollLeft;
  viewWidth.value = el.clientWidth;
  shelfWidth.value = el.scrollWidth;
}

// behavior를 넘기지 않고 CSS scroll-behavior에 맡긴다 — prefers-reduced-motion에서 바로 튀게 하려고.
function page(direction: number): void {
  const el = coversEl.value;
  if (!el) return;
  el.scrollBy({ left: direction * Math.max(140, el.clientWidth * 0.8) });
  measure();
}

watch(
  () => props.issues.length,
  () => void nextTick(measure),
);

onMounted(() => {
  void nextTick(measure);
  if (typeof ResizeObserver === 'undefined') return;
  observer = new ResizeObserver(() => measure());
  if (coversEl.value) observer.observe(coversEl.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<style scoped>
.sectionHead {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.sectionHead h2 {
  font-size: 15px;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.02em;
}

.count {
  margin-right: auto;
  font-size: 12px;
  color: var(--dim);
}

.pager {
  display: flex;
  gap: 6px;
}

.pageBtn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.pageBtn:hover:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.pageBtn:disabled {
  border-color: var(--hairline);
  color: var(--hairline);
  cursor: default;
}

/* 손가락으로 넘기는 기기에선 화살표도 손가락 크기로 */
@media (hover: none) {
  .pageBtn {
    width: 40px;
    height: 40px;
  }
}

.shelfViewport {
  position: relative;
  min-width: 0;
  margin-top: 8px;
}

.covers {
  display: flex;
  gap: 12px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  /* 표지가 떠오르고(hover) 옵셋 그림자가 앉을 자리 */
  padding: 8px 2px 10px;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scroll-behavior: smooth;
  /* 기본 스크롤바는 숨기고 아래 잉크 레일로 대신한다 */
  scrollbar-width: none;
}

.covers::-webkit-scrollbar {
  display: none;
}

.covers > * {
  flex: 0 0 92px;
  scroll-snap-align: start;
}

/* 양끝 페이드 — 이쪽으로 더 있다는 힌트 */
.shelfViewport::before,
.shelfViewport::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 10px;
  width: 24px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.shelfViewport::before {
  left: 0;
  background: linear-gradient(90deg, var(--paper), transparent);
}

.shelfViewport::after {
  right: 0;
  background: linear-gradient(270deg, var(--paper), transparent);
}

.shelfViewport.hasPrev::before,
.shelfViewport.hasNext::after {
  opacity: 1;
}

.rail {
  position: relative;
  height: 2px;
  background: var(--hairline);
  overflow: hidden;
}

.railInk {
  display: block;
  height: 100%;
  background: var(--ink);
}

@media (prefers-reduced-motion: reduce) {
  .covers {
    scroll-behavior: auto;
  }

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

  .shelfViewport {
    margin-top: 10px;
    max-width: 100%;
  }

  .covers > * {
    flex: 0 0 88px;
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

  .inviteCta {
    margin-top: 0;
    white-space: nowrap;
  }
}
</style>
