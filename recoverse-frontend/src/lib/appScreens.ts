export type FutureScreenId =
  | "home-universe"
  | "planet-detail"
  | "galaxy-detail"
  | "observation"
  | "archive-settings";

export type AppMode =
  | "home-universe"
  | "quick-entry-archive"
  | "year-archive"
  | "question-compare-archive";

export type ArchiveModeId = Exclude<AppMode, "home-universe">;

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
    note: "현재는 홈 안에 개인 행성 상세가 함께 있지만, 이후 PlanetDetailView로 분리한다.",
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
