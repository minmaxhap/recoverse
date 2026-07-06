<template>
  <header class="topNav">
    <button class="brandLockup" type="button" @click="$emit('go-home')">
      <span class="brandIcon" aria-hidden="true">R</span>
      <span>Recoverse</span>
    </button>
    <button class="settingsButton" type="button" aria-label="설정 열기" @click="$emit('menu-action', 'settings')">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 5.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10a1.65 1.65 0 0 0 1-1.51V4a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10a1.65 1.65 0 0 0 1.51 1H20a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
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
  border-bottom: 0;
  background: rgba(247, 248, 250, 0.85);
  backdrop-filter: blur(12px);
}

.brandLockup {
  border: 0;
  background: transparent;
  color: var(--text-primary);
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.brandIcon {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--accent-espresso);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.settingsButton {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  display: grid;
  place-items: center;
  padding: 8px;
  transition: background-color var(--motion-quick) var(--ease-soft);
}

.settingsButton:hover {
  background: var(--surface-parchment);
}

.settingsButton svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>