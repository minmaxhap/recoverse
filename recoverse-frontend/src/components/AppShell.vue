<template>
  <div class="page">
    <div class="col" :class="variant">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// variant: 'read' = 읽는 화면(넓게, 데스크톱 펼침면 가능) / 'write' = 쓰는 화면(560px 원고지)
withDefaults(defineProps<{ variant?: 'read' | 'write' | 'cover' }>(), { variant: 'read' });
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--paper);
}
.col {
  max-width: var(--col-mobile);
  margin: 0 auto;
  padding: 26px 22px 56px;
}

/* 데스크톱: 읽는 화면은 넓게(펼침면), 쓰는 화면은 좁은 원고지 유지 */
@media (min-width: 1024px) {
  .col.read {
    max-width: var(--col-desktop);
    padding: 40px 32px 72px;
  }
  /* 표지는 한 화면을 채우되 넘치면 흐른다. 고정 높이로 눌러 담으면 책장이 늘어난 만큼
     아래가 잘려 나가 손댈 수 없게 된다(지난 호가 사라지는 것처럼 보인다). */
  .col.cover {
    max-width: var(--col-desktop);
    min-height: 100vh;
    min-height: 100dvh;
    padding: clamp(18px, 3vh, 34px) 32px clamp(18px, 3vh, 30px);
  }
  .col.write {
    max-width: var(--col-write);
    padding: 40px 24px 72px;
  }
}

/* 낮은 화면에서는 여백부터 줄여 한 화면에 더 담아본다. 그래도 넘치면 그냥 흐른다. */
@media (min-width: 1024px) and (max-height: 720px) {
  .col.cover {
    padding-top: 16px;
    padding-bottom: 16px;
  }
}
</style>
