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
  .col.cover {
    max-width: var(--col-desktop);
    height: 100vh;
    height: 100dvh;
    min-height: 640px;
    padding: clamp(18px, 3vh, 34px) 32px clamp(18px, 3vh, 30px);
    overflow: hidden;
  }
  .col.write {
    max-width: var(--col-write);
    padding: 40px 24px 72px;
  }
}

@media (min-width: 1024px) and (max-height: 720px) {
  .col.cover {
    min-height: 0;
    padding-top: 16px;
    padding-bottom: 16px;
    overflow-x: hidden;
    overflow-y: auto;
  }
}
</style>
