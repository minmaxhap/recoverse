import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import CoverView from '../views/CoverView.vue';
import LiveEntryView from '../views/live/LiveEntryView.vue';
import LiveSessionView from '../views/live/LiveSessionView.vue';
import SoloWriteView from '../views/SoloWriteView.vue';
import IssueDetailView from '../views/IssueDetailView.vue';
import RediscoverView from '../views/RediscoverView.vue';
import RediscoverDetailView from '../views/RediscoverDetailView.vue';
import SharedIssueView from '../views/SharedIssueView.vue';
import VocAdminView from '../views/VocAdminView.vue';
import { useIdentity } from '../composables/useIdentity';
import { useShelf } from '../composables/useShelf';
import { groupByQuestion } from '../lib/rediscover';

/**
 * 라우트 메타로 접근 조건을 선언한다. 가드가 이 플래그만 보고 판단하므로,
 * "라이브는 신원이 있어야", "상세는 대상이 존재해야" 같은 규칙이 라우트 표 한 곳에 모인다.
 */
declare module 'vue-router' {
  interface RouteMeta {
    readonly requiresIdentity?: boolean;
    readonly requiresIssue?: boolean;
    readonly requiresGroup?: boolean;
  }
}

// component는 라우트 표를 자기 문서화하고 이후 <router-view> 렌더의 소스가 된다.
// 화면 전환 애니메이션과 라우트 파생 props/이벤트 배선은 App 셸이 담당한다(컨테이너 패턴).
const routes: RouteRecordRaw[] = [
  { path: '/', name: 'cover', component: CoverView },
  { path: '/new', name: 'create', component: LiveEntryView },
  { path: '/join', name: 'join', component: LiveEntryView },
  { path: '/live', name: 'live', component: LiveSessionView, meta: { requiresIdentity: true } },
  { path: '/solo', name: 'solo', component: SoloWriteView },
  { path: '/issues/:id', name: 'issue', component: IssueDetailView, meta: { requiresIssue: true } },
  { path: '/rediscover', name: 'rediscover', component: RediscoverView },
  {
    path: '/rediscover/:key',
    name: 'rediscover-detail',
    component: RediscoverDetailView,
    meta: { requiresGroup: true },
  },
  { path: '/shared/:id', name: 'shared', component: SharedIssueView },
  { path: '/voc-admin', name: 'voc-admin', component: VocAdminView },
  // 알 수 없는 경로는 표지로. 잘못된 딥링크가 빈 화면이 되지 않게 한다.
  { path: '/:pathMatch(.*)*', redirect: { name: 'cover' } },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  // 레거시 링크 하위 호환: 옛 앱은 모든 상태를 '/'의 쿼리로 표현했다.
  // 이미 공유·저장된 ?admin/?share/?join 링크가 계속 열리도록 새 라우트로 리다이렉트한다.
  // admin이 가장 높은 우선순위였던 옛 동작을 그대로 따른다.
  if (to.path === '/') {
    if (to.query.admin === 'voc') return { name: 'voc-admin' };
    const share = to.query.share;
    if (typeof share === 'string' && share) return { name: 'shared', params: { id: share } };
    const join = to.query.join;
    if (typeof join === 'string' && join) return { name: 'join', query: { code: join.toUpperCase() } };
  }

  // 접근 가드 — 조건을 만족하지 못하면 가장 가까운 안전한 화면으로 되돌린다.
  if (to.meta.requiresIdentity) {
    const { identity } = useIdentity();
    if (!identity.code || !identity.name) return { name: 'cover' };
  }
  if (to.meta.requiresIssue && !useShelf().get(String(to.params.id))) {
    return { name: 'cover' };
  }
  if (to.meta.requiresGroup) {
    const exists = groupByQuestion(useShelf().issues.value).some((group) => group.key === String(to.params.key));
    if (!exists) return { name: 'rediscover' };
  }

  return true;
});
