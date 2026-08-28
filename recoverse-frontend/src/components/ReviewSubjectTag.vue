<template>
  <p v-if="label" class="reviewSubject">
    <span class="source">{{ label.source }}</span>
    <b class="subject">{{ label.subject }}</b>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ReviewContext } from '@recoverse/shared';
import { reviewSubjectLabel } from '../lib/reviewLabel';

/**
 * 답이 무엇에 대한 답인지 알려주는 꼬리표. 질문 옆이 아니라 답 위에 놓는다 —
 * 질문은 해마다 같은 한 줄이고, 매번 달라지는 것은 이 장면 이름이기 때문이다.
 */
const props = defineProps<{ readonly review?: ReviewContext }>();
const label = computed(() => reviewSubjectLabel(props.review));
</script>

<style scoped>
.reviewSubject {
  display: grid;
  gap: 3px;
  margin: 0 0 10px;
  padding-left: 9px;
  border-left: 2px solid var(--vermilion);
}

.source {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--dim);
}

.subject {
  font-family: var(--font-display);
  font-size: 15px;
  line-height: 1.5;
  color: var(--ink);
}
</style>
