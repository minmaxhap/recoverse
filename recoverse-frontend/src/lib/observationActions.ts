import {
  type Capsule,
  type CapsuleCard,
  type Galaxy,
  type GalaxyLog,
  type GalaxyMember,
  type GalaxyPrompt,
  type ObservationData,
  type ObservationRecordSnapshot,
  type ObservationSnapshot,
  loadObservationData,
  saveObservationData,
} from "./recoverseStore";

function uuid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function saveSnapshot(snapshot: ObservationSnapshot): ObservationData {
  const previous = loadObservationData();
  const next = {
    snapshots: [snapshot, ...previous.snapshots],
  };
  saveObservationData(next);
  return next;
}

export function createPlanetObservationSnapshot(
  capsule: Capsule,
  cards: CapsuleCard[]
): ObservationData {
  const now = new Date().toISOString();
  const records: ObservationRecordSnapshot[] = cards
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((card, order) => ({
      id: uuid(),
      title: card.questionText,
      logs: [...card.answers],
      order,
    }));

  return saveSnapshot({
    id: uuid(),
    sourceType: "planet",
    sourceId: capsule.id,
    title: capsule.title,
    description: capsule.description,
    accessMode: "read_only",
    createdAt: now,
    publishedAt: now,
    records,
  });
}

export function createGalaxyObservationSnapshot(
  galaxy: Galaxy,
  members: GalaxyMember[],
  prompts: GalaxyPrompt[],
  logs: GalaxyLog[]
): ObservationData {
  const now = new Date().toISOString();
  const records: ObservationRecordSnapshot[] = prompts
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((prompt, order) => {
      const promptLogs = members.flatMap((member) => {
        const log = logs.find(
          (item) => item.promptId === prompt.id && item.memberId === member.id
        );
        return (log?.answers ?? []).map((answer) => `${member.displayName}: ${answer}`);
      });

      return {
        id: uuid(),
        title: prompt.questionText,
        logs: promptLogs,
        order,
      };
    });

  return saveSnapshot({
    id: uuid(),
    sourceType: "galaxy",
    sourceId: galaxy.id,
    title: galaxy.title,
    description: galaxy.description,
    accessMode: "read_only",
    createdAt: now,
    publishedAt: now,
    records,
  });
}
