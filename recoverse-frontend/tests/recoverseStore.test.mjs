import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import ts from "typescript";

class MemoryStorage {
  #items = new Map();

  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null;
  }

  setItem(key, value) {
    this.#items.set(key, String(value));
  }

  removeItem(key) {
    this.#items.delete(key);
  }

  clear() {
    this.#items.clear();
  }
}

const tempDir = await mkdtemp(join(tmpdir(), "recoverse-store-test-"));

async function compileTsModule(inputUrl, outputName, replacements = []) {
  let source = await readFile(inputUrl, "utf8");
  for (const [from, to] of replacements) {
    source = source.replaceAll(from, to);
  }

  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const outputPath = join(tempDir, outputName);
  await writeFile(outputPath, compiled, "utf8");
  return outputPath;
}

await compileTsModule(new URL("../src/lib/capsuleTemplates.ts", import.meta.url), "capsuleTemplates.mjs");
const storePath = await compileTsModule(new URL("../src/lib/recoverseStore.ts", import.meta.url), "recoverseStore.mjs", [
  ['"./capsuleTemplates"', '"./capsuleTemplates.mjs"'],
]);
const capsuleImportExportPath = await compileTsModule(
  new URL("../src/lib/capsuleImportExport.ts", import.meta.url),
  "capsuleImportExport.mjs",
  [['"./recoverseStore"', '"./recoverseStore.mjs"']]
);
const capsuleHomeDataPath = await compileTsModule(
  new URL("../src/lib/capsuleHomeData.ts", import.meta.url),
  "capsuleHomeData.mjs"
);
const galaxyActionsPath = await compileTsModule(
  new URL("../src/lib/galaxyActions.ts", import.meta.url),
  "galaxyActions.mjs",
  [['"./recoverseStore"', '"./recoverseStore.mjs"']]
);
const observationActionsPath = await compileTsModule(
  new URL("../src/lib/observationActions.ts", import.meta.url),
  "observationActions.mjs",
  [['"./recoverseStore"', '"./recoverseStore.mjs"']]
);

const store = await import(pathToFileURL(storePath).href);
const capsuleImportExport = await import(pathToFileURL(capsuleImportExportPath).href);
const capsuleHomeData = await import(pathToFileURL(capsuleHomeDataPath).href);
const galaxyActions = await import(pathToFileURL(galaxyActionsPath).href);
const observationActions = await import(pathToFileURL(observationActionsPath).href);

globalThis.localStorage = new MemoryStorage();

test("converts legacy year entries into year capsules", () => {
  const data = store.buildCapsuleDataFromEntries([
    {
      id: "entry-1",
      year: 2024,
      q: "What changed?",
      answers: ["I moved."],
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "entry-2",
      year: 2024,
      q: "What mattered?",
      answers: ["Friends."],
      createdAt: "2024-01-02T00:00:00.000Z",
    },
  ]);

  assert.equal(data.capsules.length, 1);
  assert.equal(data.capsules[0].title, "2024년 회고");
  assert.equal(data.capsules[0].type, "year");
  assert.equal(data.cards.length, 2);
  assert.deepEqual(
    data.cards.map((card) => card.source),
    ["imported", "imported"]
  );
});

test("exports a capsule backup payload", async () => {
  const blob = capsuleImportExport.exportCapsuleBackup({
    capsules: [
      {
        id: "capsule-1",
        title: "Travel",
        type: "travel",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
    cards: [
      {
        id: "card-1",
        capsuleId: "capsule-1",
        questionText: "Best scene?",
        answers: ["Sunset."],
        source: "user",
        order: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
  });

  const payload = JSON.parse(await blob.text());
  assert.equal(payload.schema, "recoverse_capsule_v1");
  assert.equal(payload.capsules.length, 1);
  assert.equal(payload.cards.length, 1);
});

test("imports capsule backups by merging and skipping duplicate ids", () => {
  localStorage.clear();
  localStorage.setItem("recoverse_capsule_v1", JSON.stringify({ capsules: [], cards: [] }));

  const backup = JSON.stringify({
    schema: "recoverse_capsule_v1",
    exportedAt: "2024-01-01T00:00:00.000Z",
    capsules: [
      {
        id: "capsule-1",
        title: "Project",
        type: "project",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
    cards: [
      {
        id: "card-1",
        capsuleId: "capsule-1",
        questionText: "What worked?",
        answers: ["A small scope."],
        source: "user",
        order: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
  });

  const first = capsuleImportExport.importCapsuleBackup(backup);
  const second = capsuleImportExport.importCapsuleBackup(backup);

  assert.equal(first.addedCapsules, 1);
  assert.equal(first.addedCards, 1);
  assert.equal(second.addedCapsules, 0);
  assert.equal(second.addedCards, 0);
  assert.equal(second.skippedCapsules, 1);
  assert.equal(second.skippedCards, 1);
});

test("previews capsule backup imports without mutating storage", () => {
  localStorage.clear();
  localStorage.setItem("recoverse_capsule_v1", JSON.stringify({ capsules: [], cards: [] }));

  const backup = JSON.stringify({
    schema: "recoverse_capsule_v1",
    exportedAt: "2024-01-01T00:00:00.000Z",
    capsules: [
      {
        id: "capsule-preview",
        title: "Preview",
        type: "custom",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
    cards: [
      {
        id: "card-preview",
        capsuleId: "capsule-preview",
        questionText: "What will be added?",
        answers: [],
        source: "user",
        order: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
  });

  const preview = capsuleImportExport.previewCapsuleBackupImport(backup);
  const stored = store.loadCapsuleData();

  assert.equal(preview.addedCapsules, 1);
  assert.equal(preview.addedCards, 1);
  assert.equal(stored.capsules.length, 0);
  assert.equal(stored.cards.length, 0);
});

test("rejects invalid capsule backup JSON", () => {
  localStorage.clear();

  assert.throws(
    () => capsuleImportExport.importCapsuleBackup("{not-json"),
    /RECOVERSE_IMPORT_INVALID_JSON/
  );
});

test("rejects unsupported capsule backup versions", () => {
  localStorage.clear();

  assert.throws(
    () =>
      capsuleImportExport.importCapsuleBackup(
        JSON.stringify({
          schema: "recoverse_capsule_v999",
          exportedAt: "2024-01-01T00:00:00.000Z",
          capsules: [],
          cards: [],
        })
      ),
    /RECOVERSE_IMPORT_UNSUPPORTED_VERSION/
  );
});

test("imports legacy v2 backups as capsules", () => {
  localStorage.clear();
  localStorage.setItem("recoverse_capsule_v1", JSON.stringify({ capsules: [], cards: [] }));

  const result = capsuleImportExport.importCapsuleBackup(
    JSON.stringify({
      schema: "recoverse_v2",
      exportedAt: "2024-01-01T00:00:00.000Z",
      entries: [
        {
          id: "legacy-1",
          year: 2025,
          q: "What did I learn?",
          answers: ["To keep notes."],
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ],
    })
  );

  assert.equal(result.addedCapsules, 1);
  assert.equal(result.addedCards, 1);
  assert.equal(result.data.capsules[0].title, "2025년 회고");
  assert.equal(result.data.cards[0].questionText, "What did I learn?");
});

test("keeps legacy yearly array backup import path", () => {
  localStorage.clear();
  localStorage.setItem("recoverse_capsule_v1", JSON.stringify({ capsules: [], cards: [] }));

  const result = capsuleImportExport.importCapsuleBackup(
    JSON.stringify([
      {
        id: "legacy-array-1",
        year: 2026,
        q: "What should I remember?",
        answers: ["Small records compound."],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ])
  );

  assert.equal(result.addedCapsules, 1);
  assert.equal(result.addedCards, 1);
  assert.equal(result.data.capsules[0].type, "year");
  assert.equal(result.data.cards[0].id, "legacy-array-1");
});

test("builds capsule home stats for planet map data", () => {
  const stats = capsuleHomeData.buildCapsuleStats([
    {
      id: "card-unanswered",
      capsuleId: "capsule-1",
      questionText: "Empty?",
      answers: [],
      source: "user",
      order: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-03-01T00:00:00.000Z",
    },
    {
      id: "card-recent-answer",
      capsuleId: "capsule-1",
      questionText: "Recent?",
      answers: ["Yes."],
      source: "user",
      order: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-02-01T00:00:00.000Z",
    },
    {
      id: "card-old-answer",
      capsuleId: "capsule-1",
      questionText: "Old?",
      answers: ["Earlier.", "Again."],
      source: "user",
      order: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ]);

  const capsuleStats = stats.get("capsule-1");

  assert.equal(capsuleStats.cards, 3);
  assert.equal(capsuleStats.answered, 2);
  assert.equal(capsuleStats.answers, 3);
  assert.equal(capsuleStats.unanswered, 1);
  assert.equal(capsuleStats.latestUpdatedAt, "2024-03-01T00:00:00.000Z");
  assert.equal(capsuleStats.recentCardId, "card-recent-answer");
});

test("filters capsules and selects a daily discovery card", () => {
  const capsules = [
    {
      id: "capsule-1",
      title: "Travel Archive",
      description: "Jeju memories",
      type: "travel",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "capsule-2",
      title: "Career Notes",
      type: "career",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ];
  const cards = [
    {
      id: "card-oldest",
      capsuleId: "capsule-1",
      questionText: "First?",
      answers: ["A."],
      source: "user",
      order: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "card-empty",
      capsuleId: "capsule-2",
      questionText: "Empty?",
      answers: [],
      source: "user",
      order: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
    },
  ];

  const filtered = capsuleHomeData.filterCapsules(capsules, "jeju");
  const discovery = capsuleHomeData.selectDailyDiscoveryCard(
    cards,
    new Date("2024-01-02T00:00:00.000Z")
  );

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "capsule-1");
  assert.equal(discovery.id, "card-oldest");
});

test("builds archive results from title question and answer matches", () => {
  const capsules = [
    {
      id: "capsule-1",
      title: "Travel Archive",
      description: "Jeju memories",
      type: "travel",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "capsule-2",
      title: "Career Notes",
      type: "career",
      createdAt: "2024-02-01T00:00:00.000Z",
      updatedAt: "2024-02-01T00:00:00.000Z",
    },
  ];
  const cards = [
    {
      id: "card-answer",
      capsuleId: "capsule-2",
      questionText: "What worked?",
      answers: ["A careful launch."],
      source: "user",
      order: 0,
      createdAt: "2024-02-01T00:00:00.000Z",
      updatedAt: "2024-02-01T00:00:00.000Z",
    },
  ];

  const answerResults = capsuleHomeData.buildArchiveCapsuleResults(
    capsules,
    cards,
    "launch",
    "updated"
  );
  const titleResults = capsuleHomeData.buildArchiveCapsuleResults(
    capsules,
    cards,
    "travel",
    "title"
  );

  assert.equal(answerResults.length, 1);
  assert.equal(answerResults[0].capsule.id, "capsule-2");
  assert.match(answerResults[0].matchReason, /답변/);
  assert.equal(titleResults[0].capsule.id, "capsule-1");
});

test("saves and loads galaxy data separately from capsule data", () => {
  localStorage.clear();

  store.saveGalaxyData({
    galaxies: [
      {
        id: "galaxy-1",
        title: "Team Galaxy",
        description: "Shared memories",
        theme: "project",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    members: [
      {
        id: "member-1",
        galaxyId: "galaxy-1",
        displayName: "Me",
        colorTone: "toneGold",
        joinedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    prompts: [
      {
        id: "prompt-1",
        galaxyId: "galaxy-1",
        questionText: "What should we remember?",
        order: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    logs: [
      {
        id: "log-1",
        galaxyId: "galaxy-1",
        promptId: "prompt-1",
        memberId: "member-1",
        answers: ["The launch."],
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  });

  const loaded = store.loadGalaxyData();
  const capsules = store.loadCapsuleData();

  assert.equal(loaded.galaxies.length, 1);
  assert.equal(loaded.members.length, 1);
  assert.equal(loaded.prompts.length, 1);
  assert.equal(loaded.logs.length, 1);
  assert.equal(loaded.galaxies[0].title, "Team Galaxy");
  assert.equal(capsules.capsules.length, 0);
});

test("creates and edits galaxy members prompts and logs", () => {
  localStorage.clear();

  let data = galaxyActions.createGalaxy({
    title: "Team Galaxy",
    description: "Shared memories",
    theme: "project",
    language: "en",
  });
  const galaxy = data.galaxies[0];

  data = galaxyActions.addGalaxyMember(galaxy.id, "Dana", "en");
  const member = data.members.find((item) => item.displayName === "Dana");
  assert.ok(member);

  data = galaxyActions.addGalaxyPrompt(galaxy.id, "What worked?", "en");
  const prompt = data.prompts.find((item) => item.questionText === "What worked?");
  assert.ok(prompt);

  data = galaxyActions.saveGalaxyLog(galaxy.id, prompt.id, member.id, "Small scope\nClear roles");
  let log = data.logs.find((item) => item.promptId === prompt.id && item.memberId === member.id);
  assert.deepEqual(log.answers, ["Small scope", "Clear roles"]);

  data = galaxyActions.updateGalaxyMember(member.id, "Dana K.", "en");
  assert.equal(data.members.find((item) => item.id === member.id).displayName, "Dana K.");

  data = galaxyActions.updateGalaxyPrompt(prompt.id, "What should we keep?", "en");
  assert.equal(data.prompts.find((item) => item.id === prompt.id).questionText, "What should we keep?");

  data = galaxyActions.deleteGalaxyPrompt(prompt.id);
  log = data.logs.find((item) => item.promptId === prompt.id);
  assert.equal(log, undefined);
});

test("creates immutable observation snapshots from planet data", () => {
  localStorage.clear();

  const capsule = {
    id: "capsule-obs",
    title: "Observation Planet",
    description: "Original source",
    type: "custom",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const cards = [
    {
      id: "card-obs",
      capsuleId: capsule.id,
      questionText: "What stays?",
      answers: ["First answer"],
      source: "user",
      order: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const data = observationActions.createPlanetObservationSnapshot(capsule, cards);
  cards[0].answers[0] = "Changed answer";
  const loaded = store.loadObservationData();

  assert.equal(data.snapshots.length, 1);
  assert.equal(loaded.snapshots[0].sourceType, "planet");
  assert.equal(loaded.snapshots[0].records[0].logs[0], "First answer");
});
