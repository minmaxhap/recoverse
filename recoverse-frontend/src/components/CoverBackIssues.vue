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
}

@media (min-width: 1024px) {
  .backissues {
    align-self: end;
  }
}
</style>
