<template>
  <div class="settingsRoot">
    <button
      ref="trigger"
      type="button"
      class="settingsButton"
      aria-label="편집실 설정 열기"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="show"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7h14" />
        <path d="M5 17h14" />
        <path d="M9 4v6" />
        <path d="M15 14v6" />
      </svg>
      <span>편집실</span>
    </button>

    <div v-if="open" class="settingsOverlay" role="presentation" @click.self="close">
      <section ref="dialog" class="settingsDialog" role="dialog" aria-modal="true" aria-labelledby="settingsTitle" tabindex="-1" @keydown="trapFocus">
        <div class="settingsHead">
          <span class="eyebrow red">EDITOR'S DESK</span>
          <button type="button" class="closeBtn" aria-label="닫기" @click="close">×</button>
        </div>

        <div class="settingsIntro">
          <h2 id="settingsTitle">편집실</h2>
          <p>읽는 빛과 책장 보관 방식을 정리해요.</p>
        </div>

        <section class="settingsSection" aria-labelledby="themeTitle">
          <div class="sectionHead">
            <span id="themeTitle" class="sectionTitle">읽는 빛</span>
            <span class="sectionMeta">{{ appliedThemeLabel }} 적용 중</span>
          </div>
          <div class="themeOptions" role="radiogroup" aria-labelledby="themeTitle">
            <button
              v-for="option in THEME_OPTIONS"
              :key="option.value"
              type="button"
              class="themeOption"
              :class="{ selected: themePreference === option.value }"
              role="radio"
              :aria-checked="themePreference === option.value"
              @click="setThemePreference(option.value)"
            >
              <span class="optionTitle">{{ option.label }}</span>
              <span class="optionCopy">{{ option.description }}</span>
            </button>
          </div>
        </section>

        <section class="settingsSection" aria-labelledby="archiveTitle">
          <div class="sectionHead">
            <span id="archiveTitle" class="sectionTitle">개인 책장</span>
            <span class="sectionMeta">{{ issues.length }}권 보관 중</span>
          </div>
          <p class="backupStatus" :class="{ stale: backupIsStale }">{{ backupStatusText }}</p>
          <ShelfArchiveActions :issues="issues" />
        </section>

        <section class="settingsSection noteSection" aria-labelledby="letterTitle">
          <span id="letterTitle" class="sectionTitle">편집부에 남기기</span>
          <p class="fineprint">Recoverse를 쓰며 걸린 장면을 편집부 앞으로 남겨주세요.</p>
          <VocPanel />
        </section>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { Issue } from '@recoverse/shared';
import { useThemePreference, type ThemePreference } from '../composables/useThemePreference';
import { backupAgeLabel, useBackupStatus } from '../composables/useBackupStatus';
import ShelfArchiveActions from './ShelfArchiveActions.vue';
import VocPanel from './VocPanel.vue';

const props = defineProps<{ readonly issues: readonly Issue[] }>();

const { lastBackupAt } = useBackupStatus();
const backupStatusText = computed(() => {
  if (props.issues.length === 0) return '';
  if (!lastBackupAt.value) return '아직 백업하지 않았어요 — JSON 백업으로 안전하게 보관하세요.';
  return `마지막 백업 · ${backupAgeLabel(lastBackupAt.value)}`;
});
const backupIsStale = computed(() => props.issues.length > 0 && !lastBackupAt.value);

const THEME_OPTIONS = [
  {
    value: 'light',
    label: '종이빛',
    description: '밝은 종이 위에서 선명하게 읽어요.',
  },
  {
    value: 'dark',
    label: '먹빛',
    description: '늦은 밤의 편집실처럼 차분하게 읽어요.',
  },
  {
    value: 'system',
    label: '기기 설정',
    description: '휴대폰이나 브라우저의 밝기 설정을 따라가요.',
  },
] as const satisfies readonly {
  readonly value: ThemePreference;
  readonly label: string;
  readonly description: string;
}[];

const open = ref(false);
const trigger = ref<HTMLButtonElement | null>(null);
const dialog = ref<HTMLElement | null>(null);
const { themePreference, appliedTheme, setThemePreference } = useThemePreference();

const appliedThemeLabel = computed(() => (appliedTheme.value === 'dark' ? '먹빛' : '종이빛'));

function show(): void {
  open.value = true;
}

function close(): void {
  open.value = false;
}

function trapFocus(event: KeyboardEvent): void {
  if (event.key === 'Escape') { close(); return; }
  if (event.key !== 'Tab' || !dialog.value) return;
  const targets = [...dialog.value.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href]')];
  const first = targets[0];
  const last = targets[targets.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

watch(open, async (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
    await nextTick();
    dialog.value?.focus();
    return;
  }
  document.body.style.overflow = '';
  trigger.value?.focus();
});

onBeforeUnmount(() => { document.body.style.overflow = ''; });
</script>

<style scoped>
.settingsButton {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 8px;
  background: var(--paper);
  border: 1px solid var(--ink);
  color: var(--ink);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.settingsButton:hover {
  background: var(--ink);
  color: var(--paper);
}

.settingsButton:active {
  transform: translate(1px, 1px);
}

.settingsButton svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: square;
}

.settingsOverlay {
  position: fixed;
  inset: 0;
  z-index: 28;
  display: grid;
  align-items: start;
  justify-items: center;
  padding: 74px 18px 24px;
  background: color-mix(in srgb, var(--paper) 86%, transparent);
}

.settingsDialog {
  width: min(calc(100vw - 36px), 500px);
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  display: grid;
  gap: 16px;
  padding: 18px;
  background: var(--paper-card);
  border: 1px solid var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
  animation: rise 0.22s ease both;
}

.settingsHead,
.sectionHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.closeBtn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  background: none;
  border: 1px solid var(--hairline);
  color: var(--ink);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.closeBtn:hover {
  border-color: var(--vermilion);
  color: var(--vermilion);
}

.settingsIntro {
  display: grid;
  gap: 5px;
}

.settingsIntro h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1.35;
}

.settingsIntro p {
  margin: 0;
  color: var(--dim);
  font-size: 13px;
  line-height: 1.6;
}

.settingsSection {
  display: grid;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--hairline);
}

.sectionTitle {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink);
}

.sectionMeta {
  font-size: 12px;
  font-weight: 700;
  color: var(--dim);
}

.backupStatus {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dim);
}

.backupStatus:empty {
  display: none;
}

.backupStatus.stale {
  color: var(--vermilion);
  font-weight: 700;
}

.themeOptions {
  display: grid;
  gap: 8px;
}

.themeOption {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 12px;
  background: var(--paper);
  border: 1px solid var(--hairline);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
}

.themeOption:hover,
.themeOption.selected {
  border-color: var(--ink);
}

.themeOption.selected {
  box-shadow: 3px 3px 0 var(--vermilion);
  transform: translate(-1px, -1px);
}

.optionTitle {
  font-size: 14px;
  font-weight: 800;
}

.optionCopy {
  font-size: 12px;
  line-height: 1.55;
  color: var(--dim);
}

@media (min-width: 560px) {
  .themeOptions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
