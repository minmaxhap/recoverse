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

    <section class="samplePanel" aria-label="샘플 회고">
      <header>
        <span class="sampleEyebrow">앱 살펴보기</span>
        <h3>샘플 회고로 화면을 둘러보세요</h3>
      </header>
      <p>제주 여행을 다녀온 사람의 회고 예시를 불러옵니다. 내 회고 옆에 함께 놓이고, 언제든 삭제할 수 있어요.</p>
      <button type="button" class="sampleCta" @click="$emit('load-sample')">
        샘플 회고 열기
      </button>
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
  "load-sample": [];
}>();
</script>

<style scoped>
.settingsScreen { display: grid; gap: 16px; padding: 24px var(--space-page-x) calc(108px + env(safe-area-inset-bottom)); color: var(--text-primary); }
.settingsHead { display: grid; gap: 6px; width: min(760px, 100%); }
.settingsHead .eyebrow, .usageEyebrow, .privacyEyebrow, .sampleEyebrow { color: var(--accent-sage); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
.settingsHead h2 { margin: 0; font-family: var(--font-display); font-size: clamp(30px, 5.4vw, 44px); line-height: var(--leading-tight); font-weight: var(--display-weight); letter-spacing: 0; }
.settingsHead p, .samplePanel p, .usageHint { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: var(--leading-body); }
.settingsPanel { display: grid; }
.usagePanel, .privacyPanel, .samplePanel { display: grid; gap: 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-card); background: rgba(255, 253, 248, 0.86); padding: 18px 20px; box-shadow: 0 12px 28px rgba(58, 49, 43, 0.07); }
.privacyPanel { background: linear-gradient(145deg, rgba(255,253,248,0.92), rgba(221,229,216,0.46)); }
.usagePanel header, .samplePanel header { display: grid; gap: 4px; }
.usagePanel h3, .samplePanel h3, .privacyPanel h3 { margin: 0; font-family: var(--font-display); font-size: 20px; font-weight: var(--display-weight); letter-spacing: 0; }
.usageGrid { margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.usageGrid div { border: 1px solid var(--border-subtle); border-radius: var(--radius-card); background: rgba(251, 244, 236, 0.54); padding: 11px 14px; display: grid; gap: 4px; }
.usageGrid dt { color: var(--text-secondary); font-size: 12px; font-weight: var(--label-weight); }
.usageGrid dd { margin: 0; font-family: var(--font-display); font-size: 23px; font-weight: var(--display-weight); }
.privacyPanel ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; color: var(--text-secondary); font-size: 13px; line-height: var(--leading-body); }
.sampleCta { justify-self: start; border: 1px solid var(--border-strong); border-radius: var(--radius-pill); background: var(--accent-espresso); color: var(--surface-paper); padding: 10px 16px; font-weight: var(--heading-weight); letter-spacing: 0; }
.sampleCta:hover, .sampleCta:focus-visible { border-color: var(--accent-sage); }
@media (max-width: 720px) { .settingsScreen { padding: 16px 14px calc(104px + env(safe-area-inset-bottom)); } .usageGrid { grid-template-columns: 1fr; } }
</style>
