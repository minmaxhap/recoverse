<template>
  <section class="settingsScreen">
    <header class="settingsHead">
      <span class="eyebrow">Settings</span>
      <h2>설정</h2>
      <p>앱 표시 방식, 임시저장 상태, 내 기억 데이터를 관리합니다.</p>
    </header>

    <section class="privacyPanel" aria-label="개인정보 안내">
      <span class="privacyEyebrow">개인정보</span>
      <h3>모든 기억은 이 기기에만 저장돼요</h3>
      <ul>
        <li>회고 데이터는 브라우저 localStorage에만 저장됩니다. 서버, 계정, 외부 분석은 없습니다.</li>
        <li>공유 링크는 URL 해시에 직접 인코딩되며, 원본 회고는 공유되지 않습니다.</li>
        <li>브라우저 데이터 삭제, 시크릿 모드 종료, 다른 기기 접속 시 회고가 사라질 수 있어요. 회고 백업하기로 JSON을 내려받아 두세요.</li>
      </ul>
    </section>

    <section v-if="telemetry" class="usagePanel" aria-label="내 사용 기록">
      <header>
        <span class="usageEyebrow">내 기록</span>
        <h3>이 기기에서만 보이는 사용 요약입니다</h3>
      </header>
      <dl class="usageGrid">
        <div>
          <dt>접속한 날</dt>
          <dd>{{ telemetry.totalSessions }}일</dd>
        </div>
        <div>
          <dt>남긴 답변</dt>
          <dd>{{ telemetry.totalAnswers }}개</dd>
        </div>
        <div>
          <dt>현재 연속</dt>
          <dd>{{ telemetry.currentStreak }}일</dd>
        </div>
        <div>
          <dt>최장 연속</dt>
          <dd>{{ telemetry.longestStreak }}일</dd>
        </div>
      </dl>
      <p v-if="telemetrySummary" class="usageHint">
        처음 연 지 {{ telemetrySummary.daysSinceFirst }}일 ·
        마지막 방문 {{ telemetrySummary.daysSinceLast === 0 ? "오늘" : `${telemetrySummary.daysSinceLast}일 전` }}
      </p>
    </section>

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
import type { TelemetryState } from "../lib/localTelemetry";

defineProps<{
  language: AppLanguage;
  theme: RecoverseTheme;
  activeSection: SettingsSection;
  themeOptions: Array<{ id: RecoverseTheme; label: string; description: string }>;
  reflectionCount: number;
  telemetry?: TelemetryState | null;
  telemetrySummary?: { daysSinceFirst: number; daysSinceLast: number } | null;
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

.usagePanel {
  display: grid;
  gap: 12px;
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 18px 20px;
}

.usagePanel header {
  display: grid;
  gap: 4px;
}

.usageEyebrow {
  color: var(--color-gold);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.usagePanel h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0;
}

.usageGrid {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.usageGrid div {
  border: 1px solid var(--color-soft-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  padding: 11px 14px;
  display: grid;
  gap: 4px;
}

.usageGrid dt {
  color: var(--color-text-dim);
  font-size: 12px;
  font-weight: 800;
}

.usageGrid dd {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
}

.usageHint {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 12px;
  line-height: 1.4;
}

.privacyPanel {
  display: grid;
  gap: 10px;
  border: 1px solid rgba(184, 166, 232, 0.32);
  border-radius: 18px;
  background:
    linear-gradient(145deg, rgba(184, 166, 232, 0.10), rgba(110, 90, 154, 0.08));
  padding: 18px 20px;
}

.privacyEyebrow {
  color: var(--color-star);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.privacyPanel h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0;
}

.privacyPanel ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  color: var(--color-text-dim);
  font-size: 13px;
  line-height: 1.55;
}
</style>
