<template>
  <div class="tools">
    <section id="settings-theme" class="settingsSection paperPanel" :class="{ active: activeSection === 'theme' }" aria-labelledby="app-settings-title">
      <header class="sectionHead">
        <h3 id="app-settings-title">{{ themeLabel }}</h3>
      </header>
      <div class="themeGrid">
        <button
          v-for="item in themeOptions"
          :key="item.id"
          class="themeTile"
          type="button"
          :class="{ selected: item.id === theme }"
          :aria-pressed="item.id === theme"
          @click="$emit('update:theme', item.id)"
        >
          <span class="swatch" :class="`swatch-${item.id}`" aria-hidden="true"></span>
          <strong>{{ item.label }}</strong>
        </button>
      </div>
      <p class="themeHint">{{ selectedThemeDescription }}</p>
    </section>

    <section id="settings-backup" class="settingsSection paperPanel" :class="{ active: activeSection === 'backup' || activeSection === 'import' }" aria-labelledby="data-settings-title">
      <header class="sectionHead">
        <h3 id="data-settings-title">{{ reflectionGroupLabel }}</h3>
      </header>
      <div class="dataRows">
        <button
          class="listRow"
          type="button"
          :disabled="reflectionExportDisabled"
          @click="$emit('reflection-export')"
        >
          <span class="rowLabel">{{ reflectionExportLabel }}</span>
          <span class="rowValue">{{ reflectionCount }}개</span>
        </button>
        <label class="listRow fileRow">
          <span class="rowLabel">{{ reflectionImportLabel }}</span>
          <span class="rowValue">JSON</span>
          <input type="file" accept="application/json" @change="$emit('reflection-import-file', $event)" />
        </label>
      </div>
      <p class="hint">{{ reflectionBackupHint }}</p>
    </section>

    <section id="settings-danger" class="settingsSection paperPanel dangerSection" aria-labelledby="danger-settings-title">
      <header class="sectionHead">
        <h3 id="danger-settings-title">{{ dangerGroupLabel }}</h3>
      </header>
      <button class="dangerRow" type="button" :disabled="clearDisabled" @click="$emit('clear-all')">
        {{ clearLabel }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export type RecoverseTheme = "book" | "letter" | "journey";
export type SettingsSection = "settings" | "theme" | "import" | "backup";

const props = defineProps<{
  theme: RecoverseTheme;
  activeSection: SettingsSection;
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
  "update:theme": [theme: RecoverseTheme];
  "reflection-export": [];
  "reflection-import-file": [event: Event];
  "clear-all": [];
}>();

const selectedThemeDescription = computed(
  () => props.themeOptions.find((option) => option.id === props.theme)?.description ?? ""
);
</script>

<style scoped>
.tools { display: grid; gap: 14px; width: min(560px, 100%); margin-inline: auto; }

.settingsSection { display: grid; gap: 12px; padding: 18px 20px; transition: box-shadow var(--motion-quick) var(--ease-soft); }
.settingsSection.active { box-shadow: var(--glow-lamp), var(--shadow-paper); }

.sectionHead h3 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; color: var(--text-primary); }

.themeGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.themeTile {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 14px 8px;
  border: 0;
  border-radius: var(--radius-card);
  background: var(--surface-ink-wash);
  transition: box-shadow var(--motion-quick) var(--ease-soft), transform var(--motion-quick) var(--ease-spring);
}
.themeTile:active { transform: scale(0.97); }
.themeTile.selected { background: var(--surface-paper); box-shadow: var(--glow-lamp); }
.themeTile strong { font-size: 13px; font-weight: var(--label-weight); color: var(--text-secondary); }
.themeTile.selected strong { color: var(--text-primary); }
.swatch { width: 24px; height: 24px; border-radius: 50%; }
.swatch-book { background: #6B5CFF; }
.swatch-letter { background: #3182F6; }
.swatch-journey { background: #00A76F; }
.themeHint { margin: 0; color: var(--text-tertiary); font-size: 12px; }

.dataRows { display: grid; margin: 0 -20px; }
.listRow {
  grid-template-columns: 1fr auto;
  padding: 14px 20px;
  font: inherit;
  cursor: pointer;
}
.listRow:disabled { opacity: 0.4; cursor: not-allowed; }
.listRow + .listRow { border-top: 1px solid var(--surface-ink-wash); }
.rowLabel { font-size: 15px; font-weight: var(--label-weight); color: var(--text-primary); text-align: left; }
.rowValue { color: var(--text-tertiary); font-size: 13px; }
.fileRow { user-select: none; }
.fileRow input { display: none; }
.hint { margin: 0; color: var(--text-tertiary); font-size: 12px; line-height: var(--leading-body); }

.dangerRow {
  margin: 0 -20px;
  padding: 14px 20px;
  border: 0;
  background: transparent;
  color: var(--color-danger);
  font-size: 15px;
  font-weight: var(--label-weight);
  text-align: left;
  transition: background-color var(--motion-quick) var(--ease-soft);
}
.dangerRow:active:not(:disabled) { background: var(--surface-blush); }
.dangerRow:disabled { opacity: 0.4; }

@media (max-width: 899px) {
  .tools { width: 100%; }
}
</style>
