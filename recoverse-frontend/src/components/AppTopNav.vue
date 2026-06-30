<template>
  <header class="topNav">
    <button class="brand" type="button" @click="$emit('go-home')">Recoverse</button>
    <details ref="menuRef" class="profileMenu">
      <summary aria-label="프로필 메뉴">
        <span>나</span>
      </summary>
      <div class="menuPanel">
        <button type="button" @click="choose('settings')">설정</button>
        <button type="button" @click="choose('language')">언어 변경</button>
        <button type="button" @click="choose('theme')">테마 변경</button>
        <button type="button" @click="choose('import')">가져오기</button>
        <button type="button" @click="choose('backup')">백업</button>
      </div>
    </details>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";

export type TopMenuAction = "settings" | "language" | "theme" | "import" | "backup";

const emit = defineEmits<{
  "go-home": [];
  "menu-action": [action: TopMenuAction];
}>();

const menuRef = ref<HTMLDetailsElement | null>(null);

function choose(action: TopMenuAction) {
  if (menuRef.value) menuRef.value.open = false;
  emit("menu-action", action);
}
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
  border-bottom: 1px solid var(--color-soft-border);
  background: rgba(11, 15, 30, 0.96);
  backdrop-filter: blur(16px);
}

.brand {
  border: 0;
  background: transparent;
  color: var(--color-gold);
  padding: 0;
  font-size: 13px;
  font-weight: var(--eyebrow-weight);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.profileMenu {
  position: relative;
}

.profileMenu summary {
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-soft-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text);
  display: grid;
  place-items: center;
  list-style: none;
  cursor: pointer;
}

.profileMenu summary::-webkit-details-marker {
  display: none;
}

.profileMenu summary span {
  font-size: 12px;
  font-weight: var(--heading-weight);
  letter-spacing: 0.02em;
}

.menuPanel {
  position: absolute;
  right: 0;
  top: 42px;
  width: 184px;
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  background: rgba(20, 28, 46, 0.98);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
  padding: 8px;
  display: grid;
  gap: 4px;
}

.menuPanel button {
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text);
  padding: 10px 12px;
  text-align: left;
  font-size: 13px;
  font-weight: var(--heading-weight);
  letter-spacing: 0.005em;
}

.menuPanel button:hover {
  background: rgba(255, 255, 255, 0.06);
}
</style>
