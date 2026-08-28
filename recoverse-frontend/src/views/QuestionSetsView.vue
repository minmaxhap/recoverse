<template>
  <AppShell variant="write">
    <BackHeader label="질문 세트" @back="$emit('back')" />

    <header class="setsIntro">
      <span class="eyebrow red">QUESTION SET</span>
      <h1 class="pageTitle">다음 호에 그대로 쓸<br />질문 묶음</h1>
      <p class="lede">한 번 짜두면 혼자 엮기에서 탭 한 번으로 그 구성이 목차에 깔려요.</p>
    </header>

    <QuestionSetManager :issues="issues" />
  </AppShell>
</template>

<script setup lang="ts">
import type { Issue } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import QuestionSetManager from '../components/QuestionSetManager.vue';

withDefaults(defineProps<{ readonly issues?: readonly Issue[] }>(), { issues: () => [] });
defineEmits<{ back: [] }>();
</script>

<style scoped>
.setsIntro {
  display: grid;
  gap: 6px;
  margin-bottom: 22px;
}

.setsIntro .pageTitle {
  margin-bottom: 0;
}

.lede {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--dim-strong);
}
</style>
