export type FutureScreenId =
  | "home-universe"
  | "reflection-new"
  | "reflection-write"
  | "reflection-detail"
  | "review-again"
  | "shared-reflections"
  | "planet-detail"
  | "galaxy-detail"
  | "observation"
  | "archive-settings";

export type AppMode =
  | "home-universe"
  | "reflection-new"
  | "reflection-write"
  | "reflection-detail"
  | "review-again"
  | "shared-reflections"
  | "planet-detail"
  | "galaxy-detail"
  | "observation"
  | "archive-library"
  | "archive-time"
  | "archive-organize"
  | "archive-settings";

export type ArchiveModeId = Exclude<
  AppMode,
  | "home-universe"
  | "reflection-new"
  | "reflection-write"
  | "reflection-detail"
  | "review-again"
  | "shared-reflections"
  | "planet-detail"
  | "galaxy-detail"
  | "observation"
>;

export type AppModePlan = {
  id: AppMode;
  targetScreen: FutureScreenId;
  title: string;
  note: string;
};

// Current modes keep their behavior for now while we rename them around the future IA.
export const appModePlans: AppModePlan[] = [
  {
    id: "home-universe",
    targetScreen: "home-universe",
    title: "홈",
    note: "오늘 다시 만나는 나, 이어쓰기, 새 회고 시작을 보여주는 메인 화면이다.",
  },
  {
    id: "reflection-new",
    targetScreen: "reflection-new",
    title: "새 회고",
    note: "유형, 기간, 질문 세트를 고르는 3단계 회고 시작 화면이다.",
  },
  {
    id: "reflection-write",
    targetScreen: "reflection-write",
    title: "회고 작성",
    note: "한 화면에 질문 하나씩 답하는 질문 카드 작성 화면이다.",
  },
  {
    id: "reflection-detail",
    targetScreen: "reflection-detail",
    title: "회고 읽기",
    note: "작성된 회고를 수정 폼이 아니라 감상용 질문 답변 카드로 읽는 화면이다.",
  },
  {
    id: "review-again",
    targetScreen: "review-again",
    title: "다시 보기",
    note: "같은 질문 타임라인과 랜덤 과거 답변을 다시 보는 화면이다.",
  },
  {
    id: "shared-reflections",
    targetScreen: "shared-reflections",
    title: "함께 보기",
    note: "친구가 공유한 회고와 내가 공유한 회고를 모아 보는 화면이다.",
  },
  {
    id: "planet-detail",
    targetScreen: "planet-detail",
    title: "기억 행성 상세",
    note: "선택된 개인 행성의 탐사 기록과 탐사 로그를 편집하는 화면이다.",
  },
  {
    id: "galaxy-detail",
    targetScreen: "galaxy-detail",
    title: "그룹 은하 상세",
    note: "그룹 은하의 멤버 행성, 공통 탐사 기록, 멤버별 탐사 로그를 편집하는 화면이다.",
  },
  {
    id: "observation",
    targetScreen: "observation",
    title: "관측 모드",
    note: "공유 시점에 고정된 행성 또는 은하 스냅샷을 읽기 전용으로 보는 화면이다.",
  },
  {
    id: "archive-library",
    targetScreen: "archive-settings",
    title: "보관함",
    note: "기억 행성을 검색하고 다시 여는 아카이브 기본 화면이다.",
  },
  {
    id: "archive-time",
    targetScreen: "archive-settings",
    title: "시간여행",
    note: "연도별 기록과 반복 질문 비교를 함께 보는 시간 탐색 화면이다.",
  },
  {
    id: "archive-organize",
    targetScreen: "archive-settings",
    title: "새 기억",
    note: "아카이브에서 바로 새 기억 행성 또는 그룹 은하 생성 흐름으로 이동한다.",
  },
  {
    id: "archive-settings",
    targetScreen: "archive-settings",
    title: "설정",
    note: "언어, 백업, 가져오기, 데이터 초기화를 다루는 관리 화면이다.",
  },
];

export const archiveModePlans = appModePlans.filter(
  (plan): plan is AppModePlan & { id: ArchiveModeId } => plan.targetScreen === "archive-settings"
);
