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

          <figure class="photoHeroCard editorialPhotoFrame">
            <img :src="heroPhoto.src" :alt="heroPhoto.alt" />
            <figcaption>
              <span>{{ title }}</span>
              <strong>Story Book x Time Capsule</strong>
            </figcaption>
          </figure>
        </section>

        <section class="promptSection" aria-labelledby="prompt-title">
          <div class="sectionHeader">
            <span class="screenEyebrow">Quick prompts</span>
            <h2 id="prompt-title">짧게 써도 회고 한 장이 만들어져요</h2>
          </div>
          <div class="promptGrid">
            <article v-for="prompt in homePromptCards" :key="prompt.title" class="promptCard">
              <span>{{ prompt.category }}</span>
              <strong>{{ prompt.title }}</strong>
              <p>{{ prompt.description }}</p>
              <i aria-hidden="true">{{ prompt.mark }}</i>
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
            <figure class="emptyAlbumPhoto editorialPhotoFrame">
              <img src="/design/album-flower-landscape.jpg" alt="말린 꽃과 여행 사진이 놓인 열린 앨범" />
            </figure>
            <div>
              <span class="screenEyebrow">First page</span>
              <h3>아직 책장이 비어 있어요.</h3>
              <p>지금 떠오른 장면 하나만 남기면 첫 회고 카드가 생깁니다.</p>
              <button class="primaryButton" type="button" @click="$emit('start-writing')">
                첫 회고 시작하기
              </button>
            </div>
          </div>
        </section>

        <section class="moodSection" aria-label="Recoverse 무드 보드">
          <article class="letterPanel">
            <figure class="letterPhoto editorialPhotoFrame">
              <img src="/design/sealed-envelope-stack.jpg" alt="초록색 왁스 실링이 붙은 종이 봉투 더미" />
            </figure>
            <div>
              <span class="screenEyebrow">Time capsule</span>
              <h2>나중의 나에게 닿는 작은 편지</h2>
              <p>종이, 봉투, 왁스 실링의 질감을 앱 전체의 카드와 버튼 규칙으로 이어갑니다.</p>
            </div>
          </article>
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

const heroPhoto = {
  src: "/design/blank-journal.jpg",
  alt: "햇빛 아래 펼쳐진 빈 저널과 안개꽃",
};

const homePromptCards = [
  { category: "올해의 성취", title: "어쨌든 버텼다.", description: "가장 짧은 문장으로도 한 해의 표지가 됩니다.", mark: "01" },
  { category: "올해의 발견", title: "나는 느린 시간을 좋아한다.", description: "나중에 다시 읽을 수 있는 취향의 단서를 남겨요.", mark: "02" },
  { category: "가장 빛났던 날", title: "몸이 먼저 기억하는 장면.", description: "사진 없이도 선명한 장면을 한 문장으로 보관합니다.", mark: "03" },
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
.homeBookPage { padding: 18px var(--space-page-x) calc(104px + env(safe-area-inset-bottom)); }
.homeBookShell { width: min(980px, 100%); margin: 0 auto; display: grid; gap: var(--space-section); }
.heroSection { min-height: min(560px, calc(100dvh - 170px)); display: grid; grid-template-columns: minmax(0, 0.92fr) minmax(280px, 0.88fr); align-items: center; gap: clamp(24px, 6vw, 58px); }
.heroCopy { display: grid; gap: 18px; align-content: center; }
.heroCopy h1 { margin: 0; font-size: clamp(48px, 8vw, 76px); color: var(--text-primary); }
.heroCopy h1::after { content: ""; width: 64px; height: 12px; display: block; margin-top: 10px; background: linear-gradient(90deg, var(--accent-wax) 0 22%, transparent 22% 32%, var(--accent-wax) 32% 54%, transparent 54% 64%, var(--accent-wax) 64% 100%); mask: radial-gradient(12px 7px at 8px 5px, #000 58%, transparent 62%) repeat-x; mask-size: 22px 12px; opacity: 0.9; }
.heroCopy p { max-width: 390px; margin: 0; color: var(--text-secondary); font-size: 16px; line-height: var(--leading-body); word-break: keep-all; }
.heroActions { display: grid; grid-template-columns: minmax(0, 220px) minmax(0, 180px); gap: 10px; align-items: center; }
.photoHeroCard { position: relative; margin: 0; min-height: 420px; border-radius: 26px; overflow: hidden; }
.photoHeroCard img { min-height: 420px; padding: 12px; }
.photoHeroCard figcaption { position: absolute; left: 18px; right: 18px; bottom: 18px; z-index: 1; width: fit-content; max-width: calc(100% - 36px); border: 1px solid rgba(229, 217, 200, 0.76); border-radius: 8px; background: rgba(255, 253, 248, 0.88); padding: 10px 12px; color: var(--text-primary); box-shadow: 0 12px 28px rgba(58, 49, 43, 0.12); backdrop-filter: blur(12px); }
.photoHeroCard figcaption span { font-size: 12px; font-weight: var(--label-weight); }
.photoHeroCard figcaption strong { font-family: var(--font-display); font-size: 24px; font-weight: var(--display-weight); }
.sectionHeader { display: grid; gap: 7px; }
.sectionHeader.row { grid-template-columns: 1fr auto; align-items: end; gap: 14px; }
.sectionHeader h2, .compareSection h2, .emptyAlbum h3, .letterPanel h2 { margin: 0; font-family: var(--font-display); font-weight: var(--display-weight); line-height: var(--leading-tight); letter-spacing: 0; color: var(--text-primary); }
.sectionHeader h2 { font-size: clamp(22px, 4vw, 30px); }
.promptSection, .albumSection, .moodSection { display: grid; gap: 14px; }
.promptGrid, .memoryGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.promptCard, .memoryCard, .emptyAlbum, .compareSection, .letterPanel { border: 1px solid var(--border-subtle); border-radius: var(--radius-card); background: rgba(255, 253, 248, 0.86); box-shadow: 0 14px 32px rgba(58, 49, 43, 0.08); }
.promptCard { position: relative; min-height: 210px; display: grid; gap: 10px; align-content: start; padding: 18px; overflow: hidden; }
.promptCard::after { content: ""; position: absolute; right: 14px; bottom: 14px; width: 46px; height: 52px; border: 1px solid rgba(169, 154, 139, 0.52); border-radius: 4px; background: linear-gradient(135deg, rgba(255,253,248,0.72), rgba(239,230,214,0.52)); transform: rotate(-3deg); }
.promptCard span, .memoryCard span { color: var(--text-tertiary); font-size: 12px; font-weight: var(--label-weight); }
.promptCard strong { position: relative; z-index: 1; font-family: var(--font-display); font-size: clamp(21px, 3vw, 28px); line-height: var(--leading-tight); font-weight: var(--display-weight); word-break: keep-all; }
.promptCard p { position: relative; z-index: 1; margin: 0; color: var(--text-secondary); font-size: 13px; line-height: var(--leading-body); word-break: keep-all; }
.promptCard i { position: absolute; right: 24px; bottom: 27px; z-index: 1; color: var(--text-tertiary); font-family: var(--font-display); font-size: 15px; font-style: normal; }
.memoryGrid { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
.memoryCard { width: 100%; min-height: 190px; color: var(--text-primary); padding: 18px; text-align: left; display: grid; gap: 8px; align-content: start; transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease; }
.memoryCard:hover { transform: translateY(-2px); border-color: var(--border-strong); box-shadow: var(--shadow-paper); }
.memoryCard.draft { background: linear-gradient(145deg, rgba(221, 229, 216, 0.78), rgba(255, 253, 248, 0.9)); }
.memoryCard strong { font-family: var(--font-display); font-size: 22px; line-height: var(--leading-tight); font-weight: var(--display-weight); }
.memoryCard p, .emptyAlbum p, .letterPanel p { margin: 0; color: var(--text-secondary); line-height: var(--leading-body); overflow-wrap: anywhere; }
.memoryCard em { align-self: end; width: fit-content; color: var(--accent-sage); font-size: 12px; font-style: normal; font-weight: var(--label-weight); }
.emptyAlbum { display: grid; grid-template-columns: 210px 1fr; gap: 18px; align-items: center; padding: 16px; }
.emptyAlbumPhoto { width: 100%; height: 180px; margin: 0; border-radius: 8px; overflow: hidden; }
.emptyAlbumPhoto img { padding: 8px; }
.emptyAlbum div { display: grid; gap: 12px; justify-items: start; }
.compact { min-height: 40px; padding: 10px 14px; font-size: 13px; }
.moodSection { display: grid; }
.letterPanel { display: grid; grid-template-columns: minmax(210px, 0.46fr) 1fr; gap: 18px; align-items: center; padding: 14px; background: linear-gradient(135deg, rgba(255, 253, 248, 0.94), rgba(239, 230, 214, 0.66)); }
.letterPhoto { width: 100%; height: 210px; margin: 0; border-radius: 8px; overflow: hidden; }
.letterPhoto img { padding: 8px; }
.letterPanel div { display: grid; gap: 8px; }
.letterPanel h2 { font-size: clamp(22px, 4vw, 32px); }
.compareSection { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 18px; padding: 22px; background: linear-gradient(120deg, rgba(255,253,248,0.9), rgba(239,230,214,0.76)), var(--surface-paper); }
.compareSection h2 { max-width: 540px; margin-top: 6px; font-size: clamp(20px, 3.8vw, 28px); }
.friendStack { display: flex; align-items: center; }
.friendStack span { width: 38px; height: 38px; margin-left: -8px; border: 2px solid var(--surface-paper); border-radius: 999px; display: grid; place-items: center; background: var(--surface-sage); color: var(--text-primary); font-size: 12px; font-weight: var(--heading-weight); }
.friendStack span:first-child { margin-left: 0; }
@media (max-width: 760px) {
  .homeBookPage { padding-top: 14px; }
  .heroSection, .letterPanel, .emptyAlbum { grid-template-columns: 1fr; }
  .heroSection { min-height: auto; gap: 18px; }
  .heroCopy h1 { font-size: clamp(44px, 13vw, 58px); }
  .heroActions, .sectionHeader.row, .compareSection { grid-template-columns: 1fr; }
  .photoHeroCard, .photoHeroCard img { height: 180px; min-height: 180px; }
  .photoHeroCard figcaption { display: none; }
  .promptGrid { grid-template-columns: 1fr; }
  .promptCard { min-height: 176px; }
  .friendStack { justify-self: start; }
}
</style>
