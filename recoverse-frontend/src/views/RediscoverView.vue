<template>
  <AppShell variant="read">
    <BackHeader label="다시 발견" @back="$emit('back')" />
    <h1 class="pageTitle">같은 질문,<br />다른 해의 나</h1>

    <button v-if="moment" class="momentCard" @click="$emit('open-group', moment.groupKey)">
      <span class="eyebrow gold">{{ momentLabel }}</span>
      <span class="momentQ">{{ moment.question }}</span>
      <span class="momentA">{{ momentTeaser ? `“${momentTeaser}”` : '그때 뭐라고 답했을까요?' }}</span>
      <span class="momentMeta">{{ moment.year }} · {{ moment.issueTitle }} →</span>
    </button>

    <input
      v-if="groups.length > 0"
      v-model="searchQuery"
      class="field searchField"
      type="text"
      placeholder="질문이나 답변 내용으로 검색"
      aria-label="다시 발견 검색"
    />

    <p v-if="hasSearch && filteredGroups.length === 0" class="empty">찾는 결과가 없어요.</p>

    <button v-for="g in filteredGroups" :key="g.key" class="redisRow" @click="$emit('open-group', g.key)">
      <span class="redisQ">{{ g.question }}</span>
      <span class="yearChips">
        <em v-for="y in g.years" :key="y">{{ y }}</em>
        <b v-if="g.years.length > 1">{{ g.years.length }}개의 해</b>
      </span>
    </button>

    <!-- 내 질문이 먼저, 예시는 그 아래. 진짜 재발견이 생기면 이 제안은 물러난다. -->
    <div v-if="!hasRediscovery && !hasSamples" class="stack sampleInvite">
      <p class="empty">
        {{ groups.length === 0 ? '아직 책장이 비어 있어요.' : '여러 해에 걸친 질문은 아직 없어요.' }}
        예시로 먼저 볼 수 있어요.
      </p>
      <button class="ghost" @click="$emit('addSamples')">예시 지난 호 3권 꽂아보기</button>
    </div>

    <template v-if="hasSamples">
      <div class="gap" />
      <button class="endLink" @click="$emit('removeSamples')">예시 데이터 지우기</button>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { filterGroups, type QuestionGroup, type RediscoveryMoment } from '../lib/rediscover';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';

const props = defineProps<{
  groups: QuestionGroup[];
  hasSamples: boolean;
  moment: RediscoveryMoment | null;
}>();
// 질문을 열면 호가 아니라 재발견 타임라인으로 간다 — 표지와 같은 'open-group'을 쓴다.
// 'open'은 앱 셸에서 호 상세로 배선돼 있어, 질문 키를 넘기면 가드에 막혀 표지로 튕긴다.
defineEmits<{ back: []; 'open-group': [string]; addSamples: []; removeSamples: [] }>();

const searchQuery = ref('');
const hasSearch = computed(() => searchQuery.value.trim().length > 0);
const filteredGroups = computed(() => {
  const matches = filterGroups(props.groups, searchQuery.value);
  // 위 카드와 겹치지 않게 그 질문은 목록에서 뺀다. 다만 질문이 하나뿐이면 빼는 순간
  // 목록이 통째로 사라져 화면이 침묵한다 — 그럴 땐 겹치더라도 남긴다. 카드는 한 해의
  // 답을, 목록 줄은 몇 개의 해에 걸쳤는지를 말하므로 서로 다른 것을 알려준다.
  if (hasSearch.value || !props.moment || matches.length <= 1) return matches;
  return matches.filter((group) => group.key !== props.moment?.groupKey);
});

/**
 * 이 화면이 약속하는 것은 "다른 해의 나"인데, 여러 해에 걸친 질문이 아직 없으면
 * 보여줄 게 없다. 예시 세 권이 그 약속을 3초에 설명하므로, 진짜 재발견이 생기기
 * 전까지는 계속 권한다. 책장이 빌 때만 권하면 첫 호를 쓰는 순간 사라진다.
 */
const hasRediscovery = computed(() => props.groups.some((group) => group.years.length > 1));

const momentLabel = computed(() => {
  const m = props.moment;
  if (!m) return '';
  if (m.anniversary) return m.yearsAgo <= 1 ? '1년 전 오늘 즈음' : `${m.yearsAgo}년 전 오늘 즈음`;
  return '오늘의 재발견';
});

// 표지와 같은 규칙 — 지난 해의 답은 타임라인에서 열어보게 두고 여기서 흘리지 않는다.
const momentTeaser = computed(() => {
  const m = props.moment;
  if (!m || m.year !== String(new Date().getFullYear())) return '';
  const first = Object.values(m.answers).find((answer) => answer.text.trim());
  return first?.text ?? '';
});
</script>

<style scoped>
.momentCard {
  width: 100%;
  display: grid;
  gap: 6px;
  text-align: left;
  border: 1px solid var(--ink);
  background: var(--paper-card);
  padding: 18px 16px;
  margin-bottom: 22px;
  cursor: pointer;
  color: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.momentCard:hover {
  border-color: var(--vermilion);
  box-shadow: 3px 3px 0 var(--vermilion);
  transform: translate(-1px, -1px);
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
.empty {
  font-size: 14px;
  line-height: 1.6;
  color: var(--dim);
}
.sampleInvite {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--hairline);
}
.searchField {
  margin-bottom: 18px;
}
.redisRow {
  width: 100%;
  display: grid;
  gap: 8px;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--hairline);
  padding: 16px 2px;
  cursor: pointer;
  color: inherit;
  transition: background 0.15s ease;
}
.redisRow:hover {
  background: var(--paper-card);
}
.redisRow:hover .redisQ {
  color: var(--vermilion);
}
.redisQ {
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1.55;
  font-weight: 700;
  transition: color 0.15s ease;
}
.yearChips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.yearChips em {
  font-style: normal;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  border: 1px solid var(--ink);
  padding: 2px 8px;
}
.yearChips b {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--vermilion);
}
</style>
