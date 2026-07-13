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
