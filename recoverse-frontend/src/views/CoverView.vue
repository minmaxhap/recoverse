<template>
  <AppShell variant="cover">
    <div class="coverHome">
      <div class="coverTop">
        <div class="coverTools noPrint">
          <SettingsPanel :issues="issues" />
        </div>

        <header class="masthead">
          <div class="rule thick" />
          <h1 class="brand">RECOVERSE</h1>
          <div class="deck">
            <span>질문과 장면을 엮는 나만의 호</span>
            <span>EST. 2016</span>
          </div>
          <div class="rule" />
        </header>
      </div>

      <div class="coverSpread">
        <section class="coverLead" aria-label="Recoverse 소개">
          <p class="coverline">
            오늘의 장면을,<br />
            우리는 한 권의<br />
            <em>호</em>로 엮는다.
          </p>

          <div class="momentSlot">
            <button v-if="moment" class="momentCard" @click="$emit('open-group', moment.groupKey)">
              <span class="eyebrow gold">{{ momentLabel }}</span>
              <span class="momentQ">{{ moment.question }}</span>
              <span class="momentA">“{{ momentTeaser }}”</span>
              <span class="momentMeta">{{ moment.year }} · {{ moment.issueTitle }} →</span>
            </button>
          </div>
        </section>

        <aside class="coverDesk" :class="{ hasResume: resumeDraft.resumable }" aria-label="홈 목차와 지난 호">
          <CoverResumeDraft :summary="resumeDraft" @resume="$emit('navigate', 'solo')" />
          <CoverEntryList @navigate="$emit('navigate', $event)" />
          <CoverBackIssues :issues="issues" @navigate="$emit('navigate', $event)" @open="$emit('open', $event)" />
        </aside>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Issue } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import CoverBackIssues from '../components/CoverBackIssues.vue';
import CoverEntryList from '../components/CoverEntryList.vue';
import CoverResumeDraft from '../components/CoverResumeDraft.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import { peekSoloIssueDraft } from '../composables/useSoloIssueDraft';
import type { RediscoveryMoment } from '../lib/rediscover';

const props = defineProps<{ readonly issues: readonly Issue[]; readonly moment?: RediscoveryMoment | null }>();
defineEmits<{
  navigate: ['create' | 'join' | 'solo' | 'rediscover'];
  open: [string];
  'open-group': [string];
}>();

const momentLabel = computed(() => {
  const m = props.moment;
  if (!m) return '';
  if (m.anniversary) return m.yearsAgo <= 1 ? '1년 전 오늘 즈음' : `${m.yearsAgo}년 전 오늘 즈음`;
  return '오늘의 재발견';
});

const momentTeaser = computed(() => {
  const m = props.moment;
  if (!m) return '';
  const first = Object.values(m.answers).find((answer) => answer.text.trim());
  return first?.text ?? '';
});

// 홈에 들어올 때마다 저장소를 읽기 전용으로 훑는다. CoverView는 mode가 cover일 때마다
// key로 재마운트되므로(App.vue), 발행으로 드래프트를 비운 뒤 돌아오면 카드가 사라진다.
const resumeDraft = peekSoloIssueDraft();
</script>

<style scoped>
.coverHome {
  min-height: 100%;
}

.coverTools {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}
.masthead .brand {
  font-family: var(--font-display);
  font-size: clamp(30px, 9vw, 40px);
  letter-spacing: 0.02em;
  margin: 10px 0 6px;
  font-weight: 700;
}
.masthead .deck {
  display: grid;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding-bottom: 10px;
  line-height: 1.5;
}
.momentCard {
  width: 100%;
  display: grid;
  gap: 6px;
  text-align: left;
  border: 1px solid var(--ink);
  background: var(--paper-card);
  padding: 18px 16px;
  margin: 24px 0;
  cursor: pointer;
  color: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.momentSlot:empty {
  display: none;
}
.momentCard:hover {
  border-color: var(--vermilion);
  box-shadow: inset 0 -3px 0 var(--vermilion);
}
.momentQ {
  font-family: var(--font-display);
  font-size: 19px;
  line-height: 1.5;
  font-weight: 700;
}
.momentA {
  font-family: var(--font-display);
  font-size: 15px;
  line-height: 1.7;
  color: var(--dim-strong);
}
.momentMeta {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--dim);
}
.coverline {
  font-family: var(--font-display);
  font-size: 30px;
  line-height: 1.5;
  margin: 34px 0 36px;
}
.coverline em {
  font-style: normal;
  color: var(--vermilion);
  background: linear-gradient(var(--vermilion), var(--vermilion)) left bottom / 0% 3px no-repeat;
  animation: drawUnderline 0.7s ease 0.5s both;
  padding-bottom: 2px;
}
@keyframes drawUnderline {
  to {
    background-size: 100% 3px;
  }
}

@media (min-width: 1024px) {
  .coverHome {
    height: 100%;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: clamp(14px, 2.2vh, 24px);
    overflow: hidden;
  }
  .coverTools {
    margin-bottom: clamp(6px, 1.2vh, 12px);
  }
  .masthead .brand {
    font-size: clamp(30px, 4.3vh, 40px);
    margin: clamp(6px, 1.2vh, 10px) 0 4px;
  }
  .masthead .deck {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: clamp(6px, 1.2vh, 10px);
  }
  .coverSpread {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(420px, 1fr);
    gap: 28px;
    min-height: 0;
    overflow: hidden;
  }
  .coverLead {
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    align-items: center;
    padding-right: 28px;
    border-right: 1px solid var(--hairline);
  }
  .coverDesk {
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    align-content: stretch;
    gap: clamp(12px, 2vh, 18px);
    overflow: hidden;
  }
  /* 이어쓰기 카드가 있으면 맨 위 행을 추가해도 목차는 스크롤, 지난 호는 하단 고정 유지 */
  .coverDesk.hasResume {
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .coverline {
    font-size: clamp(27px, 4vh, 34px);
    line-height: 1.38;
    margin: 0;
  }
  .momentCard {
    margin: clamp(12px, 2vh, 18px) 0 10px;
    padding: clamp(11px, 1.7vh, 16px) 14px;
  }
  .momentSlot {
    align-self: end;
  }
  .momentSlot:empty {
    display: block;
  }
  .momentQ {
    font-size: clamp(16px, 2vh, 19px);
    line-height: 1.42;
  }
  .momentA {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

@media (min-width: 1024px) and (max-height: 720px) {
  .coverHome {
    gap: 10px;
    height: auto;
    min-height: 100%;
    overflow: visible;
  }
  .coverSpread {
    gap: 24px;
    overflow: visible;
  }
  .coverLead {
    padding-right: 24px;
  }
  .momentCard {
    gap: 3px;
    margin-top: 10px;
  }
  .momentA {
    -webkit-line-clamp: 1;
  }
}
</style>
