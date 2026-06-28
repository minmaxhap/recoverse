export type AppMode =
  | "home-universe"
  | "reflection-new"
  | "reflection-write"
  | "reflection-detail"
  | "review-again"
  | "shared-reflections"
  | "archive-settings";

export type BottomTabId = "write" | "home" | "review";

export const bottomNavLabels: Record<BottomTabId, string> = {
  home: "홈",
  write: "기억 작성",
  review: "다시 보기",
};

export function shouldShowBottomNav(mode: AppMode): boolean {
  return [
    "home-universe",
    "reflection-new",
    "reflection-write",
    "reflection-detail",
    "review-again",
    "shared-reflections",
    "archive-settings",
  ].includes(mode);
}

export function getActiveBottomTab(mode: AppMode): BottomTabId {
  if (mode === "reflection-new" || mode === "reflection-write") return "write";
  if (mode === "review-again" || mode === "shared-reflections") return "review";
  return "home";
}

export function isTabActive(mode: AppMode, tabId: BottomTabId): boolean {
  if (tabId === "home") return mode === "home-universe";
  if (tabId === "write") return mode === "reflection-new" || mode === "reflection-write";
  if (tabId === "review") return mode === "review-again";
  return false;
}
