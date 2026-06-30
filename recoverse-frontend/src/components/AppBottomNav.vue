<template>
  <nav class="bottomNav" aria-label="주요 화면">
    <button
      v-for="item in navigationItems"
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

const navigationItems = computed<Array<{
  id: BottomTabId;
  icon: "book" | "pen" | "album";
  label: string;
}>>(() => [
  { id: "home", icon: "book", label: props.labels.home },
  { id: "write", icon: "pen", label: props.labels.write },
  { id: "review", icon: "album", label: props.labels.review },
]);
</script>

<style scoped>
.bottomNav {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: calc(10px + env(safe-area-inset-bottom));
  z-index: 40;
  width: min(360px, calc(100% - 28px));
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
  padding: 7px;
  border: 1px solid rgba(229, 217, 200, 0.86);
  border-radius: 24px;
  background: rgba(255, 253, 248, 0.91);
  box-shadow: 0 18px 42px rgba(58, 49, 43, 0.13);
  backdrop-filter: blur(18px);
}

.navItem {
  min-width: 0;
  min-height: 54px;
  border: 1px solid transparent;
  border-radius: 18px;
  background: transparent;
  color: var(--text-secondary);
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 4px;
  padding: 7px 4px;
}

.navItem span {
  max-width: 100%;
  font-size: 11px;
  font-weight: var(--label-weight);
  letter-spacing: 0;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navItem.active {
  border-color: rgba(111, 127, 107, 0.28);
  background: var(--surface-sage);
  color: var(--text-primary);
}
</style>
