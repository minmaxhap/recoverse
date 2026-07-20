<template>
  <!-- 앱 셸: 라우터가 매칭한 화면(Component)을 페이지 넘김 전환으로 감싸 렌더한다.
       라우트에서 파생한 props와 내비게이션 이벤트 배선을 여기서 주입하므로, 각 화면은
       라우터를 몰라도 되는 프레젠테이셔널 컴포넌트로 남고 단독 테스트가 가능하다(컨테이너 패턴).
       :duration 명시 = animationend 대신 타이머로 종료. prefers-reduced-motion(전역 animation:none)
       이나 백그라운드 탭에서도 전환이 멈추지 않는다. -->
  <router-view v-slot="{ Component }">
    <Transition name="page" mode="out-in" :duration="{ enter: 300, leave: 160 }">
      <component :is="Component" :key="viewKey" v-bind="viewProps" v-on="viewHandlers" />
    </Transition>
  </router-view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useShelf } from './composables/useShelf';
import { useIdentity } from './composables/useIdentity';
import { groupByQuestion, pickRediscoveryMoment } from './lib/rediscover';
import { sampleIssues, isSample } from './lib/samples';

type CoverTarget = 'create' | 'join' | 'solo' | 'rediscover';

const route = useRoute();
const router = useRouter();
const shelf = useShelf();
const identity = useIdentity();

const groups = computed(() => groupByQuestion(shelf.issues.value));
const moment = computed(() => pickRediscoveryMoment(shelf.issues.value));
const hasSamples = computed(() => shelf.issues.value.some(isSample));

// 라우트 파라미터로부터 현재 대상 엔티티를 되짚는다. 존재 보장은 라우터 가드가 하므로,
// 여기서는 이름이 맞는 라우트일 때만 조회한다(가드가 막지 못한 찰나의 방어선 겸용).
const activeIssue = computed(() =>
  route.name === 'issue' ? shelf.get(String(route.params.id)) : undefined,
);
const activeGroup = computed(() =>
  route.name === 'rediscover-detail'
    ? groups.value.find((group) => group.key === String(route.params.key))
    : undefined,
);

function goHome(): void {
  router.push({ name: 'cover' });
}
function goBack(): void {
  // 재발견 타임라인에서 뒤로가기는 목록으로, 그 외 화면은 표지로.
  if (route.name === 'rediscover-detail') router.push({ name: 'rediscover' });
  else goHome();
}
function onCoverNavigate(target: CoverTarget): void {
  router.push({ name: target });
}
function openIssue(id: string): void {
  router.push({ name: 'issue', params: { id } });
}
function openGroup(key: string): void {
  router.push({ name: 'rediscover-detail', params: { key } });
}
function enterSession(): void {
  // LiveEntryView가 신원을 세팅한 뒤 emit하므로 라이브 가드를 통과한다.
  router.push({ name: 'live' });
}
function leaveSession(): void {
  identity.clear();
  shelf.reload();
  goHome();
}
function addSamples(): void {
  for (const issue of sampleIssues()) shelf.add(issue);
}
function removeSamples(): void {
  for (const issue of shelf.issues.value.filter(isSample)) shelf.remove(issue.id);
}

// 현재 라우트에 필요한 props만 골라 넘긴다 — 선언되지 않은 여분 prop이 속성으로 새지 않게 한다.
const viewProps = computed<Record<string, unknown>>(() => {
  switch (route.name) {
    case 'cover':
      return { issues: shelf.issues.value, moment: moment.value };
    case 'create':
    case 'join':
      return {
        intent: route.name,
        prefillCode:
          route.name === 'join' && typeof route.query.code === 'string'
            ? route.query.code.toUpperCase()
            : undefined,
      };
    case 'live':
      return {
        code: identity.identity.code,
        me: identity.identity.name,
        isHost: identity.identity.isHost,
        playerToken: identity.identity.playerToken,
      };
    case 'issue':
      return { issue: activeIssue.value };
    case 'rediscover':
      return { groups: groups.value, hasSamples: hasSamples.value, moment: moment.value };
    case 'rediscover-detail':
      return { group: activeGroup.value };
    case 'shared':
      return { shareId: String(route.params.id) };
    default:
      return {};
  }
});

// 각 화면의 의미론적 이벤트를 앱 셸의 내비게이션 동작으로 연결한다.
// 화면마다 자기 이벤트만 emit하므로 상위 집합을 한 번에 배선해도 안전하다.
const viewHandlers = {
  navigate: onCoverNavigate,
  open: openIssue,
  openGroup,
  back: goBack,
  entered: enterSession,
  exit: leaveSession,
  published: goHome,
  removed: goHome,
  start: goHome,
  addSamples,
  removeSamples,
};

// 같은 화면이라도 대상 엔티티가 바뀌면 전환을 다시 재생하고 내부 상태를 초기화한다.
const viewKey = computed(() => {
  if (route.name === 'issue') return `issue-${route.params.id}`;
  if (route.name === 'rediscover-detail') return `group-${route.params.key}`;
  if (route.name === 'shared') return `shared-${route.params.id}`;
  return String(route.name ?? 'cover');
});
</script>
