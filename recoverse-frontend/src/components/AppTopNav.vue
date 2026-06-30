<template>
  <header class="topNav">
    <button class="brandLockup" type="button" @click="$emit('go-home')">
      <span class="brandIcon" aria-hidden="true">R</span>
      <span>Recoverse</span>
    </button>
    <button class="settingsButton" type="button" aria-label="?? ??" @click="$emit('menu-action', 'settings')">
      <span></span>
      <span></span>
    </button>
  </header>
</template>

<script setup lang="ts">
export type TopMenuAction = "settings";

defineEmits<{
  "go-home": [];
  "menu-action": [action: TopMenuAction];
}>();
</script>

<style scoped>
.topNav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 45;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 max(18px, env(safe-area-inset-right)) 0 max(18px, env(safe-area-inset-left));
  border-bottom: 1px solid rgba(229, 217, 200, 0.78);
  background: rgba(251, 244, 236, 0.88);
  backdrop-filter: blur(18px);
}

.brandLockup {
  border: 0;
  background: transparent;
  color: var(--text-primary);
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0;
}

.brandIcon {
  width: 26px;
  height: 26px;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  display: grid;
  place-items: center;
  background: var(--surface-paper);
  color: var(--accent-sage);
  font-size: 13px;
  box-shadow: 0 6px 16px rgba(58, 49, 43, 0.08);
}

.settingsButton {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: rgba(255, 253, 248, 0.84);
  color: var(--text-primary);
  display: grid;
  place-items: center;
  gap: 4px;
  padding: 9px;
  box-shadow: 0 8px 20px rgba(58, 49, 43, 0.08);
}

.settingsButton span {
  width: 14px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}
</style>
