<template>
  <section class="placeholderView">
    <span class="eyebrow">Observation Mode</span>
    <h2>관측 모드 placeholder</h2>
    <p>
      이 화면은 공유된 행성 또는 은하를 읽기 전용으로 보여주는 자리다. 편집, 댓글, 좋아요 같은
      액션은 두지 않는다.
    </p>

    <div class="blocks">
      <article class="block">
        <h3>읽기 전용 헤더</h3>
        <p>관측 모드 배지, 공유 대상 제목, 초대장 정보.</p>
      </article>
      <article class="block">
        <h3>기억 스냅샷</h3>
        <p>공유 시점의 탐사 기록과 탐사 로그만 보여준다.</p>
      </article>
      <article class="block">
        <h3>권한 안내</h3>
        <p>편집 불가, 재발행 필요, 원본과 분리된 스냅샷이라는 설명.</p>
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
