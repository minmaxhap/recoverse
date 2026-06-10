export type FutureScreenId =
  | "home-universe"
  | "planet-detail"
  | "galaxy-detail"
  | "observation"
  | "archive-settings";

export type AppMode =
  | "home-universe"
  | "planet-detail"
  | "galaxy-detail"
  | "observation"
  | "archive-library"
  | "archive-time"
  | "archive-organize"
  | "archive-settings";

export type ArchiveModeId = Exclude<
  AppMode,
  "home-universe" | "planet-detail" | "galaxy-detail" | "observation"
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
    title: "정리",
    note: "빠른 입력과 질문 보완으로 누락된 기록을 정리하는 화면이다.",
  },
  {
    id: "archive-settings",
    targetScreen: "archive-settings",
    title: "설정",
    note: "언어, 백업, 가져오기, 위험 작업을 다루는 관리 화면이다.",
  },
];

export const archiveModePlans = appModePlans.filter(
  (plan): plan is AppModePlan & { id: ArchiveModeId } => plan.targetScreen === "archive-settings"
);
