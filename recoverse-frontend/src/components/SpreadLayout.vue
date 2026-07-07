<template>
  <div class="spreadLayout">
    <div class="pageL">
      <slot name="left" />
    </div>
    <div class="pageR" :class="{ twoCol }">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 데스크톱 ≥1024px에서만 2페이지 펼침면. 답 4개 이상이면 오른쪽 2단.
withDefaults(defineProps<{ twoCol?: boolean }>(), { twoCol: false });
</script>

<style scoped>
.spreadLayout {
  display: block;
}
@media (min-width: 1024px) {
  .spreadLayout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }
  .pageL {
    padding-right: 30px;
    border-right: 1px solid var(--hairline);
  }
  .pageR {
    padding-left: 30px;
  }
  .pageR.twoCol {
    columns: 2;
    column-gap: 28px;
  }
}
</style>
