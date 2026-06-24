<template>
  <HomeView>
    <section class="homePanel">
      <HomeHeader :brand-label="brandLabel" :title="title" />

      <main class="intro">
        <section class="heroCopy">
          <span>Recoverse</span>
          <h1>쉽게 쓰고, 나중에 다시 보는 회고 공간</h1>
          <p>
            Recoverse는 연말 회고만을 위한 도구가 아닙니다. 한 해, 여행, 상반기,
            20대처럼 지나간 시간을 질문 카드로 정리하고 나중에 다시 열어보는
            개인 회고 서비스입니다.
          </p>
        </section>

        <section class="valueGrid" aria-label="Recoverse 핵심 경험">
          <article>
            <strong>1. 쉽게 작성하기</strong>
            <p>무엇을 돌아볼지 고르면 질문 카드가 한 장씩 열립니다. 긴 글을 쓰지 않아도 됩니다.</p>
          </article>
          <article>
            <strong>2. 쉽게 다시 보기</strong>
            <p>작성한 답변은 다시보기 탭에서 질문별, 기간별로 꺼내볼 수 있습니다.</p>
          </article>
          <article>
            <strong>3. 나중에 비교하기</strong>
            <p>같은 질문에 여러 시기의 내가 어떻게 답했는지 비교하는 것이 Recoverse의 핵심입니다.</p>
          </article>
        </section>
      </main>
    </section>
  </HomeView>
</template>

<script setup lang="ts">
import HomeHeader from "../components/HomeHeader.vue";
import HomeView from "./HomeView.vue";

defineProps<{
  title: string;
  brandLabel: string;
}>();
</script>

<style scoped>
.homePanel {
  min-height: calc(100vh - 92px);
  background:
    radial-gradient(circle at 18% 0%, rgba(240, 192, 96, 0.12), transparent 32%),
    radial-gradient(circle at 88% 28%, rgba(123, 175, 212, 0.1), transparent 28%),
    var(--color-page);
  border: 1px solid var(--color-soft-border);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.intro {
  width: min(920px, 100%);
  margin: 0 auto;
  padding: 42px 24px 120px;
  display: grid;
  gap: 22px;
}

.heroCopy {
  display: grid;
  gap: 12px;
}

.heroCopy span {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.heroCopy h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(34px, 7vw, 64px);
  line-height: 1.08;
  letter-spacing: 0;
}

.heroCopy p,
.valueGrid p {
  margin: 0;
  color: var(--color-text-dim);
  line-height: 1.65;
}

.valueGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.valueGrid article {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 18px;
  display: grid;
  gap: 8px;
}

.valueGrid strong {
  color: var(--color-text);
  font-size: 17px;
}

@media (max-width: 899px) {
  .homePanel {
    min-height: 100vh;
    border-radius: 0;
  }

  .intro {
    padding: 28px 16px 118px;
  }

  .heroCopy h1 {
    font-size: 34px;
  }

  .valueGrid {
    grid-template-columns: 1fr;
  }
}
</style>
