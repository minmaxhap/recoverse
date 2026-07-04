<template>
  <HomeView>
    <section class="homeBookPage bookCapsulePage">
      <main class="homeBookShell" aria-label="Recoverse 홈">
        <section class="heroSection">
          <div class="heroCopy">
            <span class="screenEyebrow">{{ brandLabel }}</span>
            <h1 class="serifTitle">미래의 나에게<br />배달되는<br />30초 회고.</h1>
            <p>
              질문 하나에 답하면 오늘의 생각이 봉투처럼 보관되고,
              시간이 지난 뒤 다시 도착합니다.
            </p>
            <div class="heroActions">
              <button class="primaryButton" type="button" @click="$emit('start-quick')">
                첫 회고 배달하기
              </button>
              <button class="paperButton" type="button" @click="$emit('start-writing')">
                연말/여행 회고 고르기
              </button>
            </div>
          </div>

          <figure class="photoHeroCard editorialPhotoFrame">
            <img :src="heroPhoto.src" :alt="heroPhoto.alt" />
            <figcaption>
              <span>{{ title }}</span>
              <strong>이야기책 × 타임캡슐</strong>
            </figcaption>
          </figure>
        </section>

        <DeliveryLoopPanel
          :arrival-preview="todayDeliveryCard?.preview ?? ''"
          :arrival-reflection-id="todayDeliveryCard?.reflection.id"
          :arrival-window-label="todayDeliveryCard?.windowLabel"
          :has-reflections="reflections.length > 0"
          @open-arrival="openCompletedMemory"
          @start-quick="$emit('start-quick')"
        />

        <section class="albumSection" aria-labelledby="album-title">
          <div class="sectionHeader row">
            <div>
              <span class="screenEyebrow">책장</span>
              <h2 id="album-title">나의 책장</h2>
            </div>
            <button
              v-if="reflections.length > memoryCards.length"
              class="albumBadge viewAllLink"
              type="button"
              @click="$emit('view-all')"
            >
              전체 {{ reflections.length }}편 모두 보기 →
            </button>
            <span v-else-if="memoryCards.length" class="albumBadge">전체 {{ reflections.length }}편</span>
          </div>

          <div v-if="memoryCards.length" class="memoryGrid">
            <button
              v-for="(card, idx) in memoryCards"
              :key="card.reflection.id"
              class="memoryCard paperPanel"
              :class="[
                { draft: !card.reflection.isCompleted },
                `tone-${cardTones[idx % cardTones.length]}`,
              ]"
              type="button"
              @click="openMemory(card.reflection.id, card.reflection.isCompleted)"
            >
              <span class="ribbonBookmark" aria-hidden="true"></span>
              <span class="periodLabel">{{ card.reflection.period.label }}</span>
              <strong>{{ card.reflection.title }}</strong>
              <p>{{ card.preview }}</p>
              <em>{{ card.reflection.isCompleted ? '다시 열기 →' : '이어쓰기 →' }}</em>
            </button>
          </div>

          <div v-else class="emptyAlbum paperPanel">
            <figure class="emptyAlbumPhoto editorialPhotoFrame">
              <img src="/design/album-flower-landscape.jpg" alt="말린 꽃과 여행 사진이 놓인 열린 앨범" />
            </figure>
            <div>
              <span class="screenEyebrow">첫 페이지</span>
              <h3>아직 책장이 비어 있어요.</h3>
              <p>지금 떠오른 장면 하나만 남기면 첫 회고 카드가 생깁니다.</p>
              <button class="primaryButton" type="button" @click="$emit('start-quick')">
                첫 회고 배달하기
              </button>
            </div>
          </div>
        </section>
      </main>
    </section>
  </HomeView>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DeliveryLoopPanel from "../components/DeliveryLoopPanel.vue";
import HomeView from "./HomeView.vue";
import type { Reflection } from "../types/reflection";
import { getPreviewSentence } from "../lib/reflectionPreview";
import { describeWindow, pickRediscovery } from "../lib/rediscovery";

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
  "view-all": [];
}>();

const heroPhoto = {
  src: "/design/blank-journal.jpg",
  alt: "햇빛 아래 펼쳐진 빈 저널과 안개꽃",
};

const cardTones = ["paper", "sage", "blush", "blue", "parch"] as const;

const sortedReflections = computed(() =>
  [...props.reflections].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
);

const memoryCards = computed(() =>
  sortedReflections.value.slice(0, 6).map((reflection) => ({
    reflection,
    preview: getPreviewSentence(reflection),
  }))
);

const rediscoveryPick = computed(() => pickRediscovery(props.reflections));

const todayDeliveryCard = computed(() => {
  const pick = rediscoveryPick.value;
  if (!pick) return null;
  return {
    reflection: pick.reflection,
    preview: getPreviewSentence(pick.reflection),
    windowLabel: describeWindow(pick.window),
  };
});

function openMemory(reflectionId: string, isCompleted: boolean) {
  if (isCompleted) {
    emit("open-reflection", reflectionId);
    return;
  }
  emit("continue-reflection", reflectionId);
}

function openCompletedMemory(reflectionId: string) {
  emit("open-reflection", reflectionId);
}
</script>

<style scoped>
.homeBookPage { padding: 18px var(--space-page-x) calc(104px + env(safe-area-inset-bottom)); }
.homeBookShell { width: min(980px, 100%); margin: 0 auto; display: grid; gap: var(--space-section); }

.heroSection { min-height: min(520px, calc(100dvh - 170px)); display: grid; grid-template-columns: minmax(0, 0.96fr) minmax(280px, 0.84fr); align-items: center; gap: clamp(24px, 6vw, 58px); }
.heroCopy { display: grid; gap: 18px; align-content: center; }
.heroCopy h1 { margin: 0; font-size: clamp(46px, 8vw, 72px); color: var(--text-primary); word-break: keep-all; }
.heroCopy h1::after {
  content: "";
  width: 62px;
  height: 14px;
  display: block;
  margin-top: 10px;
  background:
    radial-gradient(circle at 7px 7px, var(--accent-wax) 0 6px, transparent 6px),
    radial-gradient(circle at 31px 7px, var(--accent-wax) 0 6px, transparent 6px),
    radial-gradient(circle at 55px 7px, var(--accent-wax) 0 6px, transparent 6px);
  opacity: 0.9;
}
.heroCopy p { max-width: 400px; margin: 0; color: var(--text-secondary); font-size: 16px; line-height: var(--leading-body); word-break: keep-all; }
.heroActions { display: grid; grid-template-columns: minmax(0, 220px) minmax(0, 180px); gap: 10px; align-items: center; }

.photoHeroCard { position: relative; margin: 0; min-height: 420px; border-radius: 20px; overflow: hidden; }
.photoHeroCard img { min-height: 420px; padding: 12px; }
.photoHeroCard figcaption { position: absolute; left: 18px; right: 18px; bottom: 18px; z-index: 1; width: fit-content; max-width: calc(100% - 36px); border: 1px solid rgba(229, 217, 200, 0.76); border-radius: 8px; background: rgba(255, 253, 248, 0.9); padding: 10px 12px; color: var(--text-primary); box-shadow: 0 12px 28px rgba(58, 49, 43, 0.12); backdrop-filter: blur(12px); }
.photoHeroCard figcaption span { font-size: 12px; font-weight: var(--label-weight); color: var(--text-secondary); }
.photoHeroCard figcaption strong { font-family: var(--font-display); font-size: 20px; font-weight: var(--display-weight); color: var(--accent-espresso); }

.sectionHeader { display: grid; gap: 7px; }
.sectionHeader.row { grid-template-columns: 1fr auto; align-items: end; gap: 14px; }
.sectionHeader h2, .emptyAlbum h3 { margin: 0; font-family: var(--font-display); font-weight: var(--display-weight); line-height: var(--leading-tight); letter-spacing: 0; color: var(--text-primary); word-break: keep-all; }
.sectionHeader h2 { font-size: clamp(22px, 4vw, 30px); }
.albumBadge { color: var(--accent-sage); font-size: 13px; font-weight: var(--label-weight); }
.viewAllLink { border: 0; background: transparent; padding: 0; text-decoration: underline; text-underline-offset: 3px; }
.viewAllLink:hover, .viewAllLink:focus-visible { color: var(--accent-espresso); }

.albumSection { display: grid; gap: 14px; }
.memoryGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }

.memoryCard {
  position: relative;
  width: 100%;
  min-height: 200px;
  color: var(--text-primary);
  padding: 22px 22px 20px;
  text-align: left;
  display: grid;
  gap: 8px;
  align-content: start;
  border-radius: 12px;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  overflow: visible;
}
.memoryCard:hover { transform: translateY(-2px); border-color: var(--border-strong); box-shadow: var(--shadow-paper); }
.memoryCard.tone-paper { background: var(--surface-paper); }
.memoryCard.tone-sage { background: var(--surface-sage); }
.memoryCard.tone-blush { background: var(--surface-blush); }
.memoryCard.tone-blue { background: var(--surface-blue); }
.memoryCard.tone-parch { background: var(--surface-parchment); }
.memoryCard.draft { background: linear-gradient(145deg, var(--surface-sage), rgba(255, 253, 248, 0.9)); }

.memoryCard .periodLabel { color: var(--text-tertiary); font-size: 11px; font-weight: var(--label-weight); letter-spacing: 0.06em; }
.memoryCard strong { font-family: var(--font-display); font-size: 22px; line-height: var(--leading-tight); font-weight: var(--display-weight); word-break: keep-all; }
.memoryCard p { margin: 0; color: var(--text-secondary); line-height: var(--leading-body); font-size: 14px; overflow-wrap: anywhere; word-break: keep-all; }
.memoryCard em { align-self: end; width: fit-content; margin-top: 4px; color: var(--accent-sage); font-size: 13px; font-style: normal; font-weight: var(--label-weight); }
.memoryCard.tone-blush em, .memoryCard.tone-parch em { color: var(--accent-espresso); }

.emptyAlbum { display: grid; grid-template-columns: 210px 1fr; gap: 18px; align-items: center; padding: 16px; border-radius: 12px; }
.emptyAlbumPhoto { width: 100%; height: 180px; margin: 0; border-radius: 8px; overflow: hidden; }
.emptyAlbumPhoto img { padding: 8px; }
.emptyAlbum div { display: grid; gap: 12px; justify-items: start; }

.emptyAlbum p { margin: 0; }

@media (max-width: 760px) {
  .homeBookPage { padding-top: 14px; }
  .heroSection, .emptyAlbum { grid-template-columns: 1fr; }
  .heroSection { min-height: auto; gap: 20px; }
  .heroCopy { order: 0; }
  .photoHeroCard { order: 1; min-height: 200px; }
  .photoHeroCard, .photoHeroCard img { height: 200px; min-height: 200px; }
  .photoHeroCard figcaption { display: none; }
  .heroCopy h1 { font-size: clamp(44px, 12vw, 52px); }
  .heroActions { grid-template-columns: 1fr; }
  .memoryGrid { grid-template-columns: 1fr; }
  .memoryCard { min-height: 176px; padding: 20px; }
  .memoryCard strong { font-size: 21px; }
  .sectionHeader.row { grid-template-columns: 1fr; }
}
</style>
