export type AppMode =
  | "home-book"
  | "reflection-new"
  | "reflection-write"
  | "reflection-detail"
  | "review-again"
  | "shared-reflections"
  | "archive-settings";

export type BottomTabId = "write" | "home" | "review";

export const bottomNavLabels: Record<BottomTabId, string> = {
  home: "홈",
  write: "작성하기",
  review: "다시보기",
};

export function shouldShowBottomNav(mode: AppMode): boolean {
  return [
    "home-book",
    "reflection-new",
    "reflection-write",
    "reflection-detail",
    "review-again",
    "shared-reflections",
    "archive-settings",
  ].includes(mode);
}

export function getActiveBottomTab(mode: AppMode): BottomTabId | null {
  if (mode === "home-book") return "home";
  if (mode === "reflection-new" || mode === "reflection-write") return "write";
  if (mode === "review-again") return "review";
  return null;
}

export function isTabActive(mode: AppMode, tabId: BottomTabId): boolean {
  return getActiveBottomTab(mode) === tabId;
}
