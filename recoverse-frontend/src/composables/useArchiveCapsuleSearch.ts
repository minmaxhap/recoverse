import { computed, ref, type Ref } from "vue";
import {
  buildArchiveCapsuleResults,
  type CapsuleArchiveSort,
} from "../lib/capsuleHomeData";
import type { Capsule, CapsuleCard } from "../lib/recoverseStore";

export function useArchiveCapsuleSearch(capsules: Ref<Capsule[]>, cards: Ref<CapsuleCard[]>) {
  const capsuleSearch = ref("");
  const capsuleArchiveSort = ref<CapsuleArchiveSort>("updated");

  const archiveCapsuleResults = computed(() =>
    buildArchiveCapsuleResults(
      capsules.value,
      cards.value,
      capsuleSearch.value,
      capsuleArchiveSort.value
    )
  );

  const filteredCapsules = computed(() =>
    archiveCapsuleResults.value.map((result) => result.capsule)
  );

  const capsuleMatchReasons = computed(() => {
    return new Map(
      archiveCapsuleResults.value.map((result) => [result.capsule.id, result.matchReason])
    );
  });

  return {
    capsuleSearch,
    capsuleArchiveSort,
    archiveCapsuleResults,
    filteredCapsules,
    capsuleMatchReasons,
  };
}
