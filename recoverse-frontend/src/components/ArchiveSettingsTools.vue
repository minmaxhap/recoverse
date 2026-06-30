<template>
  <div class="tools">
    <section class="settingsSection" aria-labelledby="app-settings-title">
      <header class="sectionHead">
        <span class="sectionKicker">앱 설정</span>
        <h3 id="app-settings-title">화면과 언어</h3>
      </header>

      <div class="settingStack">
        <section id="settings-language" class="toolGroup" :class="{ active: activeSection === 'language' }">
          <span class="groupLabel">{{ languageLabel }}</span>
          <LanguageSelector
            :model-value="language"
            :label="languageLabel"
            @update:model-value="$emit('update:language', $event)"
            @change="$emit('change-language')"
          />
        </section>

        <section id="settings-theme" class="toolGroup" :class="{ active: activeSection === 'theme' }">
          <span class="groupLabel">{{ themeLabel }}</span>
          <div class="themeGrid">
            <button
              v-for="item in themeOptions"
              :key="item.id"
              class="themeButton"
              type="button"
              :class="{ selected: item.id === theme }"
              @click="$emit('update:theme', item.id)"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.description }}</span>
            </button>
          </div>
        </section>
      </div>
    </section>

    <section id="settings-backup" class="settingsSection" :class="{ active: activeSection === 'backup' || activeSection === 'import' }" aria-labelledby="data-settings-title">
      <header class="sectionHead">
        <span class="sectionKicker">내 기억 데이터</span>
        <h3 id="data-settings-title">{{ reflectionGroupLabel }}</h3>
        <p>저장된 기억 {{ reflectionCount }}개</p>
      </header>

      <div class="buttonRow">
        <button
          class="dataButton"
          type="button"
          :disabled="reflectionExportDisabled"
          @click="$emit('reflection-export')"
        >
          {{ reflectionExportLabel }}
        </button>
        <label class="file">
          {{ reflectionImportLabel }}
          <input type="file" accept="application/json" @change="$emit('reflection-import-file', $event)" />
        </label>
      </div>
      <p class="hint">{{ reflectionBackupHint }}</p>
    </section>

    <section id="settings-danger" class="settingsSection dangerSection" aria-labelledby="danger-settings-title">
      <header class="sectionHead">
        <span class="sectionKicker">위험한 작업</span>
        <h3 id="danger-settings-title">{{ dangerGroupLabel }}</h3>
      </header>
      <button class="danger" type="button" :disabled="clearDisabled" @click="$emit('clear-all')">
        {{ clearLabel }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AppLanguage } from "../types/recoverse";
import LanguageSelector from "./LanguageSelector.vue";

export type RecoverseTheme = "universe" | "letter" | "journey";
export type SettingsSection = "settings" | "language" | "theme" | "import" | "backup";

defineProps<{
  language: AppLanguage;
  theme: RecoverseTheme;
  activeSection: SettingsSection;
  languageLabel: string;
  themeLabel: string;
  themeOptions: Array<{
    id: RecoverseTheme;
    label: string;
    description: string;
  }>;
  reflectionGroupLabel: string;
  reflectionExportLabel: string;
  reflectionImportLabel: string;
  reflectionBackupHint: string;
  reflectionCount: number;
  reflectionExportDisabled: boolean;
  dangerGroupLabel: string;
  clearLabel: string;
  clearDisabled: boolean;
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
.tools {
  display: grid;
  gap: 12px;
  justify-items: stretch;
  width: min(760px, 100%);
}

.settingsSection,
.toolGroup {
  border: 1px solid rgba(184, 166, 232, 0.14);
  background:
    linear-gradient(145deg, rgba(26, 33, 51, 0.9), rgba(17, 19, 34, 0.96)),
    var(--color-surface);
  border-radius: 18px;
}

.settingsSection {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.settingsSection.active,
.toolGroup.active {
  border-color: rgba(244, 197, 106, 0.6);
  box-shadow: 0 0 0 1px rgba(244, 197, 106, 0.12);
}

.sectionHead {
  display: grid;
  gap: 4px;
}

.sectionKicker,
.groupLabel {
  color: var(--color-star);
  font-size: 11px;
  font-weight: var(--eyebrow-weight);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}

.sectionHead h3 {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 18px;
  line-height: var(--leading-tight);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
}

.sectionHead p,
.hint,
.themeButton span {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 12px;
  line-height: var(--leading-body);
}

.settingStack {
  display: grid;
  gap: 10px;
}

.toolGroup {
  display: grid;
  gap: 9px;
  padding: 12px;
}

.themeGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

button,
.file {
  font: inherit;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  border-radius: 12px;
  padding: 10px 12px;
}

.themeButton {
  display: grid;
  gap: 4px;
  text-align: left;
}

.themeButton.selected {
  border-color: var(--color-gold);
  background: rgba(244, 197, 106, 0.14);
}

.buttonRow {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.dataButton,
.file {
  border-color: rgba(184, 166, 232, 0.24);
}

button {
  cursor: pointer;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.file {
  cursor: pointer;
  user-select: none;
}

.file input {
  display: none;
}

.dangerSection {
  border-color: rgba(239, 68, 68, 0.28);
}

.danger {
  width: fit-content;
  border-color: rgba(224, 85, 85, 0.55);
  background: rgba(224, 85, 85, 0.08);
  color: #ff8f8f;
}

@media (max-width: 899px) {
  .tools {
    width: 100%;
  }

  .themeGrid {
    grid-template-columns: 1fr;
  }
}
</style>
