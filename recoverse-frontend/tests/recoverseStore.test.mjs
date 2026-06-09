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

const store = await import(pathToFileURL(storePath).href);

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
  const blob = store.exportCapsuleBackup({
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

  const first = store.importCapsuleBackup(backup);
  const second = store.importCapsuleBackup(backup);

  assert.equal(first.addedCapsules, 1);
  assert.equal(first.addedCards, 1);
  assert.equal(second.addedCapsules, 0);
  assert.equal(second.addedCards, 0);
  assert.equal(second.skippedCapsules, 1);
  assert.equal(second.skippedCards, 1);
});

test("imports legacy v2 backups as capsules", () => {
  localStorage.clear();
  localStorage.setItem("recoverse_capsule_v1", JSON.stringify({ capsules: [], cards: [] }));

  const result = store.importCapsuleBackup(
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
