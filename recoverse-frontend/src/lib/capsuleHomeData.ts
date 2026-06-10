import type { Capsule, CapsuleCard, CapsuleType } from "../types/recoverse";

export type CapsulePlanetTone =
  | "gold"
  | "teal"
  | "navy"
  | "rose"
  | "moon"
  | "lavender";

export type CapsuleTypeDisplay = {
  tone: CapsulePlanetTone;
  sortRank: number;
};

export type CapsuleHomeStats = {
  cards: number;
  answered: number;
  answers: number;
  unanswered: number;
  latestUpdatedAt: string | null;
  recentAnsweredAt: string | null;
  recentCardId: string | null;
};

export type CapsuleHomeItem = {
  capsule: Capsule;
  stats: CapsuleHomeStats;
  typeDisplay: CapsuleTypeDisplay;
  isDiscoveryTarget: boolean;
};

export type CapsuleArchiveSort = "updated" | "created" | "title";

export type CapsuleArchiveResult = {
  capsule: Capsule;
  matchReason: string;
};

export const capsuleTypeDisplays: Record<CapsuleType, CapsuleTypeDisplay> = {
  year: { tone: "gold", sortRank: 10 },
  travel: { tone: "teal", sortRank: 20 },
  project: { tone: "navy", sortRank: 30 },
  relationship: { tone: "rose", sortRank: 40 },
  career: { tone: "navy", sortRank: 50 },
  life_stage: { tone: "lavender", sortRank: 60 },
  custom: { tone: "moon", sortRank: 70 },
};

export function createEmptyCapsuleStats(): CapsuleHomeStats {
  return {
    cards: 0,
    answered: 0,
    answers: 0,
    unanswered: 0,
    latestUpdatedAt: null,
    recentAnsweredAt: null,
    recentCardId: null,
  };
}

export function buildCapsuleStats(cards: CapsuleCard[]): Map<string, CapsuleHomeStats> {
  const map = new Map<string, CapsuleHomeStats>();

  for (const card of cards) {
    const prev = map.get(card.capsuleId) ?? createEmptyCapsuleStats();
    const hasAnswer = card.answers.length > 0;

    prev.cards += 1;
    prev.answers += card.answers.length;
    if (hasAnswer) prev.answered += 1;
    else prev.unanswered += 1;

    if (!prev.latestUpdatedAt || prev.latestUpdatedAt < card.updatedAt) {
      prev.latestUpdatedAt = card.updatedAt;
    }
    if (hasAnswer && (!prev.recentAnsweredAt || prev.recentAnsweredAt < card.updatedAt)) {
      prev.recentAnsweredAt = card.updatedAt;
      prev.recentCardId = card.id;
    }

    map.set(card.capsuleId, prev);
  }

  return map;
}

export function filterCapsules(capsules: Capsule[], query: string): Capsule[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return capsules;

  return capsules.filter((capsule) => {
    const haystack = [capsule.title, capsule.description ?? "", capsule.type]
      .join("\n")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function includesQuery(value: string | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query);
}

export function buildArchiveCapsuleResults(
  capsules: Capsule[],
  cards: CapsuleCard[],
  query: string,
  sort: CapsuleArchiveSort
): CapsuleArchiveResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  const results: CapsuleArchiveResult[] = [];

  for (const capsule of capsules) {
    const capsuleCards = cards.filter((card) => card.capsuleId === capsule.id);
    const questionMatch = capsuleCards.find((card) =>
      includesQuery(card.questionText, normalizedQuery)
    );
    const answerMatch = capsuleCards.find((card) =>
      card.answers.some((answer) => includesQuery(answer, normalizedQuery))
    );
    const titleMatched = includesQuery(capsule.title, normalizedQuery);
    const descriptionMatched = includesQuery(capsule.description, normalizedQuery);
    const typeMatched = includesQuery(capsule.type, normalizedQuery);

    if (
      normalizedQuery &&
      !titleMatched &&
      !descriptionMatched &&
      !typeMatched &&
      !questionMatch &&
      !answerMatch
    ) {
      continue;
    }

    let matchReason = "";
    if (normalizedQuery) {
      if (titleMatched) matchReason = `제목: ${capsule.title}`;
      else if (descriptionMatched) matchReason = `설명: ${capsule.description}`;
      else if (questionMatch) matchReason = `질문: ${questionMatch.questionText}`;
      else if (answerMatch) matchReason = `답변: ${answerMatch.answers[0] ?? ""}`;
      else if (typeMatched) matchReason = `유형: ${capsule.type}`;
    }

    results.push({ capsule, matchReason });
  }

  return results.sort((a, b) => {
    if (sort === "title") return a.capsule.title.localeCompare(b.capsule.title);
    if (sort === "created") return a.capsule.createdAt < b.capsule.createdAt ? 1 : -1;
    return a.capsule.updatedAt < b.capsule.updatedAt ? 1 : -1;
  });
}

export function selectDailyDiscoveryCard(
  cards: CapsuleCard[],
  now: Date = new Date()
): CapsuleCard | null {
  const candidates = cards
    .filter((card) => card.answers.length > 0)
    .sort((a, b) => {
      if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? 1 : -1;
      return a.id.localeCompare(b.id);
    });

  if (candidates.length === 0) return null;

  const todayKey = now.toISOString().slice(0, 10).replace(/-/g, "");
  return candidates[Number(todayKey) % candidates.length];
}

export function buildCapsuleHomeItems(
  capsules: Capsule[],
  stats: Map<string, CapsuleHomeStats>,
  discoveryCard: CapsuleCard | null
): CapsuleHomeItem[] {
  return capsules.map((capsule) => ({
    capsule,
    stats: stats.get(capsule.id) ?? createEmptyCapsuleStats(),
    typeDisplay: capsuleTypeDisplays[capsule.type],
    isDiscoveryTarget: discoveryCard?.capsuleId === capsule.id,
  }));
}

export function findMostRecentlyAnsweredCardId(cards: CapsuleCard[]): string | null {
  return (
    cards
      .filter((card) => card.answers.length > 0)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0]?.id ?? null
  );
}
