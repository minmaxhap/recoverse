export type FutureScreenId =
  | "home-universe"
  | "planet-detail"
  | "galaxy-detail"
  | "observation"
  | "archive-settings";

export type AppMode =
  | "home-universe"
  | "planet-detail"
  | "quick-entry-archive"
  | "year-archive"
  | "question-compare-archive";

export type ArchiveModeId = Exclude<AppMode, "home-universe" | "planet-detail">;

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
    title: "기억 우주 홈",
    note: "오늘의 발견, 우주 지도, 아카이브 진입만 남기는 모바일 우선 홈이다.",
  },
  {
    id: "planet-detail",
    targetScreen: "planet-detail",
    title: "기억 행성 상세",
    note: "선택된 개인 행성의 탐사 기록과 탐사 로그를 편집하는 화면이다.",
  },
  {
    id: "quick-entry-archive",
    targetScreen: "archive-settings",
    title: "빠른 입력 보관 영역",
    note: "홈에서 제거하고 아카이브/설정 아래의 보조 입력 흐름으로 이동할 대상이다.",
  },
  {
    id: "year-archive",
    targetScreen: "archive-settings",
    title: "연도 아카이브",
    note: "홈에서 제거하고 타임라인 기반 아카이브 섹션으로 이동할 대상이다.",
  },
  {
    id: "question-compare-archive",
    targetScreen: "archive-settings",
    title: "질문 비교 아카이브",
    note: "홈에서 제거하고 시간여행 비교 또는 아카이브 도구로 이동할 대상이다.",
  },
];

export const archiveModePlans = appModePlans.filter(
  (plan): plan is AppModePlan & { id: ArchiveModeId } => plan.targetScreen === "archive-settings"
);
