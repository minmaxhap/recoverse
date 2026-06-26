<template>
  <HomeView>
    <section class="homeSpace">
      <main class="homeInner">
        <section class="introPanel">
          <span class="eyebrow">내 기억 공간</span>
          <h1>짧은 질문에 답하고, 나중에 다시 열어보는 회고 공간</h1>
          <p>
            Recoverse는 거창한 연말 회고 도구가 아니라 지나간 여행, 상반기, 한 해,
            스물아홉 같은 시간을 질문 카드로 남기고 다시 발견하는 곳입니다.
          </p>
          <button class="primaryCta" type="button" @click="$emit('start-writing')">
            첫 기억 작성하기
          </button>
        </section>

        <section v-if="reflections.length === 0" class="emptyPanel">
          <h2>아직 열어볼 기억이 없어요.</h2>
          <p>
            처음에는 여행 회고부터 시작해보세요. 한 질문에 한 문장만 남겨도 나중에
            다시 볼 수 있는 기억 조각이 됩니다.
          </p>
        </section>

        <section v-else class="memoryPanel" aria-label="내가 만든 기억">
          <div class="sectionHead">
            <div>
              <span class="eyebrow">최근 기억</span>
              <h2>다시 열어볼 수 있는 기억</h2>
            </div>
            <button class="textButton" type="button" @click="$emit('start-writing')">
              새 기억 작성
            </button>
          </div>

          <div class="memoryList">
            <article v-for="reflection in recentReflections" :key="reflection.id" class="memoryCard">
              <button class="memoryButton" type="button" @click="$emit('open-reflection', reflection.id)">
                <span>{{ reflection.period.label }}</span>
                <h3>{{ reflection.title }}</h3>
                <p>{{ previewReflection(reflection) }}</p>
              </button>
              <button
                v-if="!reflection.isCompleted"
                class="continueButton"
                type="button"
                @click="$emit('continue-reflection', reflection.id)"
              >
                이어쓰기
              </button>
            </article>
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

defineEmits<{
  "start-writing": [];
  "open-reflection": [reflectionId: string];
  "continue-reflection": [reflectionId: string];
}>();

const recentReflections = computed(() => props.reflections.slice(0, 6));

function previewReflection(reflection: Reflection) {
  const firstAnswer = reflection.answers.find((answer) => answer.value.trim())?.value.trim();
  if (firstAnswer) return `"${firstAnswer}"`;
  return reflection.isCompleted
    ? "답변이 비어 있는 회고입니다."
    : `${reflection.completionRate}% 작성됨`;
}
</script>

<style scoped>
.homeSpace {
  min-height: calc(100vh - 54px);
  background:
    radial-gradient(circle at 18% 8%, rgba(244, 197, 106, 0.14), transparent 28%),
    radial-gradient(circle at 92% 18%, rgba(164, 123, 196, 0.12), transparent 30%),
    var(--color-page);
}

.homeInner {
  width: min(980px, 100%);
  margin: 0 auto;
  padding: 36px 18px 118px;
  display: grid;
  gap: 16px;
}

.introPanel,
.emptyPanel,
.memoryPanel {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 22px;
}

.introPanel {
  min-height: 320px;
  display: grid;
  align-content: center;
  gap: 14px;
}

.eyebrow {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
}

h1,
h2,
h3,
p {
  margin: 0;
  letter-spacing: 0;
}

h1 {
  max-width: 720px;
  font-size: clamp(32px, 6vw, 58px);
  line-height: 1.08;
}

h2 {
  font-size: 24px;
}

.introPanel p,
.emptyPanel p,
.memoryCard p {
  max-width: 680px;
  color: var(--color-text-dim);
  line-height: 1.65;
}

.primaryCta,
.textButton,
.continueButton {
  border-radius: 999px;
  font-weight: 900;
}

.primaryCta {
  width: fit-content;
  border: 0;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
  padding: 13px 18px;
}

.textButton,
.continueButton {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  padding: 10px 13px;
}

.sectionHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.memoryList {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.memoryCard {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.memoryButton {
  border: 0;
  background: transparent;
  color: var(--color-text);
  padding: 0;
  text-align: left;
  display: grid;
  gap: 7px;
}

.memoryButton span {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
}

.memoryButton h3 {
  font-size: 19px;
}

.continueButton {
  justify-self: start;
}

@media (max-width: 720px) {
  .homeInner {
    padding: 18px 14px 112px;
  }

  .introPanel {
    min-height: 420px;
  }

  .sectionHead {
    align-items: stretch;
    flex-direction: column;
  }

  .memoryList {
    grid-template-columns: 1fr;
  }
}
</style>
