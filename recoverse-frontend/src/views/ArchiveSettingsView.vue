<template>
  <section class="settingsScreen bookCapsulePage">
    <header class="settingsHead">
      <h2>설정</h2>
      <p>표시 방식, 임시 저장 상태, 내 기억 데이터를 관리합니다.</p>
    </header>

    <section v-if="telemetry" class="usagePanel paperPanel" aria-label="내 사용 기록">
      <header>
        <h3>내 기록</h3>
        <p>이 기기에서만 보이는 사용 요약이에요.</p>
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

    <section class="samplePanel paperPanel" aria-label="샘플 회고">
      <button type="button" class="listRow" @click="$emit('load-sample')">
        <IconBadge icon="eye" tint="blue" />
        <span class="rowBody">
          <strong>샘플 회고 열기</strong>
          <span>제주 여행 예시로 흐름을 둘러보세요</span>
        </span>
        <svg class="rowChevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m6 3.5 4.5 4.5L6 12.5" />
        </svg>
      </button>
    </section>

    <ArchiveSettingsTools
      :theme="theme"
      :active-section="activeSection"
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
      @update:theme="$emit('update:theme', $event)"
      @reflection-export="$emit('reflection-export')"
      @reflection-import-file="$emit('reflection-import-file', $event)"
      @clear-all="$emit('clear-all')"
    />

    <section class="privacyPanel" aria-label="개인정보 안내">
      <div class="privacyHead">
        <IconBadge icon="shield" tint="sage" :size="32" />
        <h3>모든 기억은 이 기기에만 저장돼요</h3>
      </div>
      <ul>
        <li>회고 데이터는 브라우저 localStorage에만 저장됩니다. 서버, 계정, 외부 분석은 없습니다.</li>
        <li>공유 링크는 URL 해시에 직접 인코딩되며 원본 회고를 공개하지 않습니다.</li>
        <li>브라우저 데이터 삭제, 시크릿 모드 종료, 다른 기기 접속 시 회고가 사라질 수 있어요. 회고 백업으로 JSON을 내려받아 보관하세요.</li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import ArchiveSettingsTools from "../components/ArchiveSettingsTools.vue";
import IconBadge from "../components/IconBadge.vue";
import type {
  RecoverseTheme,
  SettingsSection,
} from "../components/ArchiveSettingsTools.vue";
import type { TelemetryState } from "../lib/localTelemetry";

defineProps<{
  theme: RecoverseTheme;
  activeSection: SettingsSection;
  themeOptions: Array<{ id: RecoverseTheme; label: string; description: string }>;
  reflectionCount: number;
  telemetry?: TelemetryState | null;
  telemetrySummary?: { daysSinceFirst: number; daysSinceLast: number } | null;
}>();

defineEmits<{
  "update:theme": [theme: RecoverseTheme];
  "reflection-export": [];
  "reflection-import-file": [event: Event];
  "clear-all": [];
  "load-sample": [];
}>();
</script>

<style scoped>
.settingsScreen {
  display: grid;
  gap: 14px;
  padding: 20px var(--space-page-x) calc(80px + env(safe-area-inset-bottom));
  color: var(--text-primary);
}

.settingsScreen > * { width: min(560px, 100%); margin-inline: auto; }

.settingsHead { display: grid; gap: 4px; padding: 0 2px; }
.settingsHead h2 {
  margin: 0;
  font-size: 22px;
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
  line-height: var(--leading-tight);
}
.settingsHead p { margin: 0; color: var(--text-tertiary); font-size: 13px; line-height: var(--leading-body); }

.usagePanel { display: grid; gap: 14px; padding: 18px 20px; }
.usagePanel header { display: grid; gap: 2px; }
.usagePanel h3 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
.usagePanel header p { margin: 0; color: var(--text-tertiary); font-size: 12px; }
.usageGrid { margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.usageGrid div { border-radius: 12px; background: var(--surface-ink-wash); padding: 12px 14px; display: grid; gap: 2px; }
.usageGrid dt { color: var(--text-tertiary); font-size: 12px; font-weight: var(--label-weight); }
.usageGrid dd { margin: 0; font-size: 20px; font-weight: var(--display-weight); letter-spacing: var(--tracking-display); color: var(--text-primary); }
.usageHint { margin: 0; color: var(--text-tertiary); font-size: 12px; }

.samplePanel { overflow: hidden; padding: 4px 0; }
.rowBody { display: grid; gap: 2px; min-width: 0; }
.rowBody strong { font-size: 15px; font-weight: var(--label-weight); color: var(--text-primary); }
.rowBody span { color: var(--text-tertiary); font-size: 12px; }

.privacyPanel {
  display: grid;
  gap: 10px;
  border-radius: var(--radius-card);
  background: var(--surface-ink-wash);
  padding: 16px 18px;
}
.privacyHead { display: flex; align-items: center; gap: 10px; }
.privacyPanel h3 { margin: 0; font-size: 14px; font-weight: 700; letter-spacing: -0.01em; word-break: keep-all; }
.privacyPanel ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: var(--leading-body);
}
</style>
