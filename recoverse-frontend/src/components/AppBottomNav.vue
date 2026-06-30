<template>
  <nav class="bottomNav" aria-label="주요 화면">
    <button
      v-for="item in items"
      :key="item.id"
      class="navItem"
      :class="{ active: activeTab === item.id }"
      type="button"
      @click="$emit('navigate', item.id)"
    >
      <NavIcon :name="item.icon" />
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import NavIcon from "./NavIcon.vue";

export type BottomTabId = "write" | "home" | "review";

const props = defineProps<{
  activeTab: BottomTabId | null;
  labels: Record<BottomTabId, string>;
}>();

defineEmits<{
  navigate: [tabId: BottomTabId];
}>();

const items = computed<Array<{
  id: BottomTabId;
  icon: "home" | "write" | "review";
  label: string;
}>>(() => [
  { id: "write", icon: "write", label: props.labels.write },
  { id: "home", icon: "home", label: props.labels.home },
  { id: "review", icon: "review", label: props.labels.review },
]);
</script>

<style scoped>
.bottomNav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding: 10px max(10px, env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
  border-top: 1px solid var(--color-soft-border);
  background: rgba(11, 15, 30, 0.96);
  backdrop-filter: blur(16px);
}

.navItem {
  min-width: 0;
  min-height: 52px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: transparent;
  color: rgba(232, 224, 208, 0.72);
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 4px;
  padding: 6px 4px;
  cursor: pointer;
}

.navItem span {
  max-width: 100%;
  font-size: 11px;
  font-weight: var(--label-weight);
  letter-spacing: 0.02em;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navItem.active {
  border-color: var(--color-border-gold);
  background: rgba(240, 192, 96, 0.12);
  color: var(--color-text);
}
</style>
