<template>
  <HomeView>
    <section class="homeBookPage bookCapsulePage">
      <main class="homeBookShell" aria-label="Recoverse 홈">
        <section class="heroSection">
          <div class="heroCopy">
            <span class="screenEyebrow">{{ brandLabel }}</span>
            <h1 class="serifTitle">30초면<br />충분해요.</h1>
            <p>질문에 답하다 보면 오늘 하루도, 여행도, 연말도 하나의 추억이 됩니다.</p>
            <div class="heroActions">
              <button class="primaryButton" type="button" @click="$emit('start-quick')">
                30초 만에 시작하기
              </button>
              <button class="paperButton" type="button" @click="$emit('start-writing')">
                질문 카드 고르기
              </button>
            </div>
          </div>

          <div class="timeCapsuleCard" aria-hidden="true">
            <div class="paperBundle">
              <span class="driedFlower"></span>
              <span class="letterLine short"></span>
              <span class="letterLine"></span>
              <span class="letterLine medium"></span>
            </div>
            <div class="envelopeCard">
              <span>To. future me</span>
              <strong>R</strong>
            </div>
          </div>
        </section>

        <section class="promptSection" aria-labelledby="prompt-title">
          <div class="sectionHeader">
            <span class="screenEyebrow">Quick prompts</span>
            <h2 id="prompt-title">30초만 작성하면 이런 회고가 만들어져요</h2>
          </div>
          <div class="promptGrid">
            <article v-for="prompt in homePromptCards" :key="prompt.title" class="promptCard">
              <span>{{ prompt.category }}</span>
              <strong>{{ prompt.title }}</strong>
              <small>{{ prompt.mark }}</small>
            </article>
          </div>
        </section>

        <section class="albumSection" aria-labelledby="album-title">
          <div class="sectionHeader row">
            <div>
              <span class="screenEyebrow">Memory album</span>
              <h2 id="album-title">시간이 지난 뒤 다시 보는 회고</h2>
            </div>
            <button class="paperButton compact" type="button" @click="$emit('load-sample')">
              샘플 보기
            </button>
          </div>

          <div v-if="memoryCards.length" class="memoryGrid">
            <button
              v-for="card in memoryCards"
              :key="card.reflection.id"
              class="memoryCard"
              :class="{ draft: !card.reflection.isCompleted }"
              type="button"
              @click="openMemory(card.reflection.id, card.reflection.isCompleted)"
            >
              <span>{{ card.reflection.period.label }}</span>
              <strong>{{ card.reflection.title }}</strong>
              <p>{{ card.preview }}</p>
              <em>{{ card.reflection.isCompleted ? '다시 열기' : '이어쓰기' }}</em>
            </button>
          </div>

          <div v-else class="emptyAlbum paperPanel">
            <span class="screenEyebrow">First page</span>
            <h3>아직 책장이 비어 있어요.</h3>
            <p>짧은 답변 하나만 남기면 이곳에 첫 회고 카드가 생깁니다.</p>
            <button class="primaryButton" type="button" @click="$emit('start-writing')">
              첫 회고 시작하기
            </button>
          </div>
        </section>

        <section class="compareSection" aria-label="친구 비교 미리보기">
          <div>
            <span class="screenEyebrow">Together</span>
            <h2>친구와 같은 질문으로 서로 다른 추억을 발견해요.</h2>
          </div>
          <div class="friendStack" aria-hidden="true">
            <span v-for="friend in friendInitials" :key="friend">{{ friend }}</span>
          </div>
        </section>
      </main>
    </section>
  </HomeView>
</template>

<script setup lang="ts">
import { computed } from "vue";
import HomeView from "./HomeView.vue";
import type { Reflection } from "../types/reflection";

const props = defineProps<{
  title: string;
  brandLabel: string;
  reflections: Reflection[];
}>();

const emit = defineEmits<{
  "start-writing": [];
  "start-quick": [];
  "open-reflection": [reflectionId: string];
  "continue-reflection": [reflectionId: string];
  "load-sample": [];
}>();

const homePromptCards = [
  { category: "올해의 성취", title: "어쨌든 버텼다.", mark: "leaf" },
  { category: "올해의 발견", title: "나는 주식을 못한다.", mark: "line" },
  { category: "가장 밝았던 날", title: "몽골의 넓은 초원 속에 있는 나.", mark: "photo" },
];

const friendInitials = ["J", "M", "S", "H", "+12"];

const sortedReflections = computed(() =>
  [...props.reflections].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
);

const memoryCards = computed(() =>
  sortedReflections.value.slice(0, 6).map((reflection) => ({
    reflection,
    preview:
      reflection.representativeSentence?.trim() ||
      reflection.answers.find((answer) => answer.value.trim())?.value.trim() ||
      "아직 첫 문장이 비어 있어요.",
  }))
);

function openMemory(reflectionId: string, isCompleted: boolean) {
  if (isCompleted) {
    emit("open-reflection", reflectionId);
    return;
  }
  emit("continue-reflection", reflectionId);
}
</script>

<style scoped>
.homeBookPage {
  padding: 18px var(--space-page-x) calc(104px + env(safe-area-inset-bottom));
}

.homeBookShell {
  width: min(980px, 100%);
  margin: 0 auto;
  display: grid;
  gap: var(--space-section);
}

.heroSection {
  min-height: min(560px, calc(100dvh - 170px));
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.86fr);
  align-items: center;
  gap: clamp(24px, 6vw, 58px);
}

.heroCopy {
  display: grid;
  gap: 18px;
  align-content: center;
}

.heroCopy h1 {
  margin: 0;
  font-size: clamp(48px, 8vw, 76px);
  color: var(--text-primary);
}

.heroCopy h1::after {
  content: "";
  width: 64px;
  height: 12px;
  display: block;
  margin-top: 10px;
  background: linear-gradient(90deg, var(--accent-wax) 0 22%, transparent 22% 32%, var(--accent-wax) 32% 54%, transparent 54% 64%, var(--accent-wax) 64% 100%);
  mask: radial-gradient(12px 7px at 8px 5px, #000 58%, transparent 62%) repeat-x;
  mask-size: 22px 12px;
  opacity: 0.9;
}

.heroCopy p {
  max-width: 390px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: var(--leading-body);
  word-break: keep-all;
}

.heroActions {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 180px);
  gap: 10px;
  align-items: center;
}

.timeCapsuleCard {
  position: relative;
  min-height: 420px;
  border-radius: 26px;
  background:
    radial-gradient(circle at 34% 20%, rgba(255,255,255,0.85), transparent 28%),
    linear-gradient(145deg, #F6EFE3, #E5D6C3);
  box-shadow: var(--shadow-lifted);
  overflow: hidden;
}

.paperBundle,
.envelopeCard {
  position: absolute;
  border: 1px solid rgba(202, 188, 168, 0.78);
  background: rgba(255, 253, 248, 0.72);
  box-shadow: 0 16px 36px rgba(58, 49, 43, 0.12);
}

.paperBundle {
  right: 48px;
  top: 44px;
  width: 210px;
  height: 250px;
  transform: rotate(7deg);
  display: grid;
  align-content: end;
  gap: 11px;
  padding: 26px;
}

.letterLine {
  height: 1px;
  background: rgba(117, 105, 95, 0.34);
}

.letterLine.short { width: 56%; }
.letterLine.medium { width: 76%; }

.driedFlower {
  position: absolute;
  left: 92px;
  top: 38px;
  width: 74px;
  height: 138px;
  border-left: 1px solid rgba(111, 127, 107, 0.62);
  transform: rotate(-18deg);
}

.driedFlower::before,
.driedFlower::after {
  content: "";
  position: absolute;
  width: 48px;
  height: 48px;
  border: 1px solid rgba(111, 127, 107, 0.36);
  border-radius: 50%;
}

.driedFlower::before { left: -34px; top: 18px; }
.driedFlower::after { left: 4px; top: 48px; }

.envelopeCard {
  left: 34px;
  bottom: 58px;
  width: 250px;
  height: 150px;
  transform: rotate(-8deg);
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-style: italic;
}

.envelopeCard strong {
  position: absolute;
  right: 38px;
  bottom: 28px;
  width: 58px;
  height: 58px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--accent-sage);
  color: var(--surface-paper);
  font-style: normal;
  box-shadow: inset 0 0 0 5px rgba(255,255,255,0.12), 0 10px 18px rgba(58,49,43,0.18);
}

.sectionHeader {
  display: grid;
  gap: 7px;
}

.sectionHeader.row {
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 14px;
}

.sectionHeader h2,
.compareSection h2,
.emptyAlbum h3 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: var(--display-weight);
  line-height: var(--leading-tight);
  letter-spacing: 0;
  color: var(--text-primary);
}

.sectionHeader h2 { font-size: clamp(22px, 4vw, 30px); }

.promptSection,
.albumSection {
  display: grid;
  gap: 14px;
}

.promptGrid,
.memoryGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.promptCard,
.memoryCard,
.emptyAlbum,
.compareSection {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: rgba(255, 253, 248, 0.82);
  box-shadow: 0 14px 32px rgba(58, 49, 43, 0.08);
}

.promptCard {
  min-height: 176px;
  display: grid;
  align-content: space-between;
  gap: 16px;
  padding: 18px;
}

.promptCard span,
.memoryCard span {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: var(--label-weight);
}

.promptCard strong {
  font-family: var(--font-display);
  font-size: clamp(22px, 3vw, 30px);
  line-height: var(--leading-tight);
  font-weight: var(--display-weight);
  word-break: keep-all;
}

.promptCard small {
  justify-self: end;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-strong);
  display: grid;
  place-items: center;
  color: transparent;
  position: relative;
}

.promptCard small::after {
  content: "";
  width: 14px;
  height: 14px;
  border: 1px solid var(--accent-sage);
  transform: rotate(-12deg);
}

.memoryGrid {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.memoryCard {
  width: 100%;
  min-height: 190px;
  color: var(--text-primary);
  padding: 18px;
  text-align: left;
  display: grid;
  gap: 8px;
  align-content: start;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.memoryCard:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-paper);
}

.memoryCard.draft {
  background: linear-gradient(145deg, rgba(221, 229, 216, 0.78), rgba(255, 253, 248, 0.9));
}

.memoryCard strong {
  font-family: var(--font-display);
  font-size: 22px;
  line-height: var(--leading-tight);
  font-weight: var(--display-weight);
}

.memoryCard p,
.emptyAlbum p {
  margin: 0;
  color: var(--text-secondary);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;
}

.memoryCard em {
  align-self: end;
  width: fit-content;
  color: var(--accent-sage);
  font-size: 12px;
  font-style: normal;
  font-weight: var(--label-weight);
}

.emptyAlbum {
  display: grid;
  gap: 12px;
  justify-items: start;
  padding: 24px;
}

.compact {
  min-height: 40px;
  padding: 10px 14px;
  font-size: 13px;
}

.compareSection {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 22px;
  background:
    linear-gradient(120deg, rgba(255,253,248,0.9), rgba(239,230,214,0.76)),
    var(--surface-paper);
}

.compareSection h2 {
  max-width: 540px;
  margin-top: 6px;
  font-size: clamp(20px, 3.8vw, 28px);
}

.friendStack {
  display: flex;
  align-items: center;
}

.friendStack span {
  width: 38px;
  height: 38px;
  margin-left: -8px;
  border: 2px solid var(--surface-paper);
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--surface-sage);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: var(--heading-weight);
}

.friendStack span:first-child {
  margin-left: 0;
}

@media (max-width: 760px) {
  .homeBookPage {
    padding-top: 14px;
  }

  .heroSection {
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .heroCopy h1 {
    font-size: clamp(44px, 13vw, 58px);
  }

  .heroActions,
  .sectionHeader.row,
  .compareSection {
    grid-template-columns: 1fr;
  }

  .timeCapsuleCard {
    min-height: 300px;
  }

  .paperBundle {
    right: 24px;
    top: 26px;
    width: 170px;
    height: 205px;
  }

  .envelopeCard {
    left: 20px;
    bottom: 38px;
    width: 210px;
    height: 122px;
  }

  .promptGrid {
    grid-template-columns: 1fr;
  }

  .promptCard {
    min-height: 148px;
  }

  .friendStack {
    justify-self: start;
  }
}
</style>
