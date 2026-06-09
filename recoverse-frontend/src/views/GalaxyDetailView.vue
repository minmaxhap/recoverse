<template>
  <section class="placeholderView">
    <span class="eyebrow">Galaxy Detail</span>
    <h2>그룹 은하 상세 placeholder</h2>
    <p>
      이 화면은 그룹 회고가 실제로 도입될 때 멤버 행성, 공통 탐사 기록, 멤버별 탐사 로그를 담는
      자리다.
    </p>

    <div class="blocks">
      <article class="block">
        <h3>은하 헤더</h3>
        <p>그룹 이름, 설명, 주제, 관측 초대장 진입점.</p>
      </article>
      <article class="block">
        <h3>멤버 행성</h3>
        <p>참여자를 위성 행성처럼 보여주는 영역.</p>
      </article>
      <article class="block">
        <h3>공통 탐사 기록</h3>
        <p>그룹 전체가 함께 답하는 질문과 로그 매트릭스.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.placeholderView {
  padding: 20px;
  display: grid;
  gap: 12px;
}

.eyebrow {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

h2,
h3,
p {
  margin: 0;
}

h2 {
  color: var(--color-ink);
  font-size: 20px;
  font-weight: 900;
}

h3 {
  color: var(--color-ink);
  font-size: 15px;
  font-weight: 800;
}

p {
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}

.blocks {
  display: grid;
  gap: 10px;
}

.block {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  padding: 14px;
  background: var(--color-surface);
  display: grid;
  gap: 4px;
}
</style>
