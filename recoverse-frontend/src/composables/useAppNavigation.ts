import { computed, ref } from "vue";
import type { AppMode, ArchiveModeId } from "../lib/appScreens";

export function isArchiveMode(m: AppMode): m is ArchiveModeId {
  return (
    m === "archive-library" ||
    m === "archive-time" ||
    m === "archive-organize" ||
    m === "archive-settings"
  );
}

export function useAppNavigation(initialMode: AppMode = "home-universe") {
  const mode = ref<AppMode>(initialMode);
  const lastArchiveMode = ref<ArchiveModeId>("archive-library");

  const activeArchiveMode = computed<ArchiveModeId>(() => {
    return isArchiveMode(mode.value) ? mode.value : lastArchiveMode.value;
  });

  function setNavigationMode(nextMode: AppMode) {
    mode.value = nextMode;
    if (isArchiveMode(nextMode)) {
      lastArchiveMode.value = nextMode;
    }
  }

  return {
    mode,
    lastArchiveMode,
    activeArchiveMode,
    setNavigationMode,
  };
}
