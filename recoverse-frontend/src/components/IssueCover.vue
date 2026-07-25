<template>
  <button type="button" class="issueCover" :aria-label="coverLabel" :title="coverLabel" @click="$emit('open', issue.id)">
    <canvas ref="canvasEl" class="coverArt" aria-hidden="true" />
    <span class="coverScrim" aria-hidden="true" />
    <span class="coverText" aria-hidden="true">
      <span class="coverNo">No.{{ no }}</span>
      <span class="coverTitle">{{ issue.title }}</span>
      <span class="coverMeta">{{ KIND_LABELS[issue.kind] }} · {{ issue.date.slice(0, 4) }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { KIND_LABELS, type Issue } from '@recoverse/shared';
import { kindColor } from '../lib/palette';
import { drawRisoCover } from '../lib/coverArt';

const props = defineProps<{ readonly issue: Issue; readonly no: number }>();
defineEmits<{ open: [string] }>();

// 표지엔 제목·종류·연도만 보이지만, 참여자·질문 수까지 접근 가능한 이름/툴팁으로 되살린다.
const coverLabel = computed(() => {
  const people = props.issue.participants.filter((name) => name.trim().length > 0);
  const parts = [
    props.issue.title,
    `${KIND_LABELS[props.issue.kind]} · ${props.issue.date.slice(0, 4)}`,
  ];
  if (people.length > 0) parts.push(people.join(', '));
  parts.push(`질문 ${props.issue.rounds.length}개`);
  return parts.join(' · ');
});

const canvasEl = ref<HTMLCanvasElement | null>(null);
let observer: ResizeObserver | null = null;

function render(): void {
  const canvas = canvasEl.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(80, rect.width);
  const h = Math.max(80, rect.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  // id를 씨앗으로 — 같은 호는 늘 같은 표지.
  drawRisoCover(ctx, w, h, props.issue.id || props.issue.title, kindColor(props.issue.kind));
}

onMounted(() => {
  // 마운트 직후 실제 크기로 즉시 그린다(getBoundingClientRect가 레이아웃을 강제).
  render();
  // 이후 크기 변화(반응형·컨테이너 리사이즈) 때 다시 선명하게 그린다.
  observer = new ResizeObserver(() => render());
  if (canvasEl.value) observer.observe(canvasEl.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<style scoped>
.issueCover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--ink);
  background: var(--paper-card);
  cursor: pointer;
  color: var(--cover-fg, #f4efe4);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.issueCover:hover {
  transform: translateY(-5px);
  box-shadow: 3px 3px 0 var(--ink);
}

.coverArt {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.coverScrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 42%, rgba(18, 12, 7, 0.14) 60%, rgba(18, 12, 7, 0.74) 100%);
}

.coverText {
  position: absolute;
  inset: auto 0 0 0;
  display: grid;
  gap: 2px;
  padding: 9px 10px 9px;
  text-align: left;
}

.coverNo {
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  font-variant-numeric: tabular-nums;
}

.coverTitle {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.14;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: anywhere;
}

.coverMeta {
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}
</style>
