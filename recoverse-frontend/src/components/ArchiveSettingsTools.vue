<template>
  <div class="tools">
    <section class="settingsSection" aria-labelledby="app-settings-title">
      <header class="sectionHead">
        <span class="sectionKicker">앱 설정</span>
        <h3 id="app-settings-title">화면</h3>
      </header>

      <div class="settingStack">
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
        <span class="sectionKicker">내 회고 데이터</span>
        <h3 id="data-settings-title">{{ reflectionGroupLabel }}</h3>
        <p>저장된 회고 {{ reflectionCount }}개</p>
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
export type RecoverseTheme = "book" | "letter" | "journey";
export type SettingsSection = "settings" | "theme" | "import" | "backup";

defineProps<{
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
</script>

<style scoped>
.tools { display: grid; gap: 12px; justify-items: stretch; width: min(760px, 100%); margin-inline: auto; }
.settingsSection,
.toolGroup { border: 1px solid var(--border-subtle); background: rgba(255, 253, 248, 0.86); border-radius: var(--radius-card); box-shadow: 0 12px 28px rgba(58, 49, 43, 0.07); }
.settingsSection { display: grid; gap: 14px; padding: 16px; }
.settingsSection.active, .toolGroup.active { border-color: rgba(111, 127, 107, 0.52); box-shadow: 0 0 0 3px rgba(111, 127, 107, 0.10); }
.sectionHead { display: grid; gap: 4px; }
.sectionKicker, .groupLabel { color: var(--accent-sage); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
.sectionHead h3 { margin: 0; color: var(--text-primary); font-family: var(--font-display); font-size: 20px; line-height: var(--leading-tight); font-weight: var(--display-weight); letter-spacing: 0; }
.sectionHead p, .hint, .themeButton span { margin: 0; color: var(--text-secondary); font-size: 12px; line-height: var(--leading-body); }
.settingStack { display: grid; gap: 10px; }
.toolGroup { display: grid; gap: 9px; padding: 12px; background: rgba(251, 244, 236, 0.44); }
.themeGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
button, .file { font: inherit; border: 1px solid var(--border-subtle); background: rgba(255, 253, 248, 0.72); color: var(--text-primary); border-radius: var(--radius-card); padding: 10px 12px; }
.themeButton { display: grid; gap: 4px; text-align: left; }
.themeButton.selected { border-color: var(--accent-sage); background: var(--surface-sage); }
.buttonRow { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.dataButton, .file { border-color: var(--border-strong); }
button { cursor: pointer; }
button:disabled { opacity: 0.55; cursor: not-allowed; }
.file { cursor: pointer; user-select: none; }
.file input { display: none; }
.dangerSection { border-color: rgba(163, 78, 62, 0.26); }
.danger { width: fit-content; border-color: rgba(163, 78, 62, 0.55); background: rgba(234, 215, 207, 0.44); color: var(--color-danger); }
@media (max-width: 899px) { .tools { width: 100%; } .themeGrid { grid-template-columns: 1fr; } }
</style>