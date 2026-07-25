<template>
  <section class="backissues">
    <CoverShelf :issues="issues" @navigate="$emit('navigate', $event)" @open="$emit('open', $event)" />
  </section>
</template>

<script setup lang="ts">
import type { Issue } from '@recoverse/shared';
import CoverShelf from './CoverShelf.vue';

defineProps<{ readonly issues: readonly Issue[] }>();
defineEmits<{ navigate: ['create']; open: [string] }>();
</script>

<style scoped>
.backissues {
  min-height: 0;
  /* 그리드 아이템이 내용(표지 줄) 너비로 부풀지 않게 — 이래야 표지 가로 스크롤이 열린다. */
  min-width: 0;
}

@media (min-width: 1024px) {
  .backissues {
    /* coverDesk가 플렉스 컬럼이므로 가로로 꽉 차게 — 지난 호 그리드가 좁아지지 않도록 */
    align-self: stretch;
  }
}
</style>
