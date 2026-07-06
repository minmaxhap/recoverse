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
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  width: 100%;
  transform: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  border: 0;
  border-top: 1px solid var(--border-subtle);
  border-radius: 0;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: none;
  backdrop-filter: blur(12px);
}

.navItem {
  min-width: 0;
  min-height: 52px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text-tertiary);
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 3px;
  padding: 6px 4px;
  transition: color var(--motion-quick) var(--ease-soft);
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
  color: var(--accent-espresso);
}

@media (min-width: 900px) {
  .bottomNav {
    top: 8px;
    bottom: auto;
    left: 50%;
    right: auto;
    z-index: 46;
    width: min(340px, calc(100% - 220px));
    transform: translateX(-50%);
    padding: 4px;
    border: 0;
    border-radius: 18px;
    background: var(--surface-paper);
    box-shadow: var(--shadow-paper);
  }

  .navItem {
    min-height: 38px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 8px;
  }

  .navItem span {
    font-size: 12px;
  }
}
</style>