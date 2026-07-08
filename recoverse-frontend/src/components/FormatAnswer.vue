<template>
  <figure class="quote" :class="{ still }" :style="delayStyle">
    <div v-if="kind === 'keyword'" class="keyword">{{ text.trim() }}</div>

    <ol v-else-if="kind === 'scenes'" class="scenes">
      <li v-for="(scene, i) in scenes" :key="i">
        <span class="sceneNo">{{ i + 1 }}</span>
        <span class="sceneText">{{ scene }}</span>
      </li>
    </ol>

    <blockquote v-else-if="kind === 'letter'" class="letter">{{ text }}</blockquote>

    <blockquote v-else>{{ text }}</blockquote>

    <figcaption>
      <ParticipantDot :color="color" small /> {{ name }}<span v-if="captionSuffix"> · {{ captionSuffix }}</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ParticipantDot from './ParticipantDot.vue';
import { splitScenes, type FormatKind } from '../data/formats';

const props = withDefaults(
  defineProps<{
    text: string;
    name: string;
    color: string;
    kind: FormatKind;
    still?: boolean;
    index?: number;
    captionSuffix?: string;
  }>(),
  { still: false, index: 0 },
);

const scenes = computed(() => splitScenes(props.text));
const delayStyle = computed(() =>
  props.still ? {} : { animationDelay: `${0.15 + props.index * 0.22}s` },
);
</script>

<style scoped>
.quote {
  margin: 0;
  padding: 16px 2px;
  border-bottom: 1px solid var(--hairline);
  animation: rise 0.55s ease both;
}
.quote.still {
  animation: none;
}
figcaption {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--dim);
  margin-top: 10px;
}

/* 올해의 키워드 — 크게 */
.keyword {
  font-family: var(--font-display);
  font-size: 40px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--vermilion);
}

/* 세 장면 — 번호 매김 */
.scenes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
.scenes li {
  display: flex;
  gap: 12px;
  align-items: baseline;
}
.sceneNo {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--vermilion);
  flex-shrink: 0;
}
.sceneText {
  font-family: var(--font-display);
  font-size: 17px;
  line-height: 1.6;
}

/* 미래의 나에게 편지 — 편지 톤 */
.letter {
  margin: 0;
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.9;
  white-space: pre-line;
  padding-left: 14px;
  border-left: 2px solid var(--hairline);
}

/* 기본 인용 */
blockquote {
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  line-height: 1.75;
}
</style>
