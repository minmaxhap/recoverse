<template>
  <section class="quickDone" aria-labelledby="quickDoneTitle">
    <span class="eyebrow red">ANSWER SAVED</span>
    <h2 id="quickDoneTitle">답을 목차에 실었어요</h2>
    <blockquote
      v-if="latestAnswer"
      class="quickAnswer"
      :aria-label="latestAnswer"
    >{{ latestAnswer }}</blockquote>
    <p class="helper">{{ publishHelp }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="quickDoneActions">
      <button class="cta" :disabled="!canPublish || publishing" @click="$emit('publish')">이대로 책장에 꽂기</button>
      <button type="button" class="ghost" @click="$emit('continue')">질문 하나 더</button>
      <button type="button" class="linkAction" @click="$emit('edit')">목차에서 질문과 답 고치기</button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  readonly latestAnswer: string;
  readonly publishHelp: string;
  readonly error: string;
  readonly canPublish: boolean;
  readonly publishing: boolean;
}>();

defineEmits<{
  publish: [];
  continue: [];
  edit: [];
}>();
</script>

<style scoped>
.quickDone {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.quickDone h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 25px;
  line-height: 1.45;
}

.quickAnswer {
  display: -webkit-box;
  margin: 6px 0 2px;
  overflow: hidden;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.quickDoneActions {
  display: grid;
  gap: 9px;
  margin-top: 8px;
}

.linkAction {
  justify-self: start;
  min-height: 44px;
  padding: 8px 0;
  background: none;
  border: 0;
  color: var(--dim);
  font-family: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.linkAction:hover {
  color: var(--vermilion);
}
</style>
