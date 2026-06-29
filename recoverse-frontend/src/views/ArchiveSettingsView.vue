<template>
  <section class="settingsScreen">
    <header class="settingsHead">
      <span class="eyebrow">Settings</span>
      <h2>설정</h2>
      <p>앱 표시 방식, 임시저장 상태, 내 기억 데이터를 관리합니다. 오래 보관하려면 회고 백업을 내려받아 주세요.</p>
    </header>
    <section class="settingsPanel">
      <ArchiveSettingsTools
        :language="language"
        :theme="theme"
        :active-section="activeSection"
        language-label="언어"
        theme-label="테마"
        :theme-options="themeOptions"
        reflection-group-label="회고 데이터"
        reflection-export-label="회고 백업하기"
        reflection-import-label="회고 가져오기"
        reflection-backup-hint="가져오기는 기존 회고를 지우지 않고 최신 항목만 병합합니다."
        :reflection-count="reflectionCount"
        :reflection-export-disabled="reflectionCount === 0"
        danger-group-label="데이터 초기화"
        clear-label="전체 회고 삭제"
        :clear-disabled="reflectionCount === 0"
        @update:language="$emit('update:language', $event)"
        @update:theme="$emit('update:theme', $event)"
        @change-language="$emit('change-language')"
        @reflection-export="$emit('reflection-export')"
        @reflection-import-file="$emit('reflection-import-file', $event)"
        @clear-all="$emit('clear-all')"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import ArchiveSettingsTools from "../components/ArchiveSettingsTools.vue";
import type {
  RecoverseTheme,
  SettingsSection,
} from "../components/ArchiveSettingsTools.vue";
import type { AppLanguage } from "../types/recoverse";

defineProps<{
  language: AppLanguage;
  theme: RecoverseTheme;
  activeSection: SettingsSection;
  themeOptions: Array<{ id: RecoverseTheme; label: string; description: string }>;
  reflectionCount: number;
}>();

defineEmits<{
  "update:language": [language: AppLanguage];
  "update:theme": [theme: RecoverseTheme];
  "change-language": [];
  "reflection-export": [];
  "reflection-import-file": [event: Event];
  "clear-all": [];
}>();
</script>

<style scoped>
.settingsScreen {
  display: grid;
  gap: 16px;
  padding: 24px 18px 32px;
  color: var(--color-text);
}

.settingsHead {
  display: grid;
  gap: 6px;
}

.settingsHead .eyebrow {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

.settingsHead h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
}

.settingsHead p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}

.settingsPanel {
  display: grid;
}
</style>
