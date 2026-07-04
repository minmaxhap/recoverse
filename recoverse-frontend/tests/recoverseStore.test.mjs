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

await writeFile(join(tempDir, "reflectionTypes.mjs"), "export {};\n", "utf8");
await compileTsModule(new URL("../src/data/reflectionTemplates.ts", import.meta.url), "reflectionTemplates.mjs");
const safeLocalStoragePath = await compileTsModule(
  new URL("../src/lib/safeLocalStorage.ts", import.meta.url),
  "safeLocalStorage.mjs"
);
const reflectionStorePath = await compileTsModule(
  new URL("../src/lib/reflectionStore.ts", import.meta.url),
  "reflectionStore.mjs",
  [
    ['"../data/reflectionTemplates"', '"./reflectionTemplates.mjs"'],
    ['"./safeLocalStorage"', '"./safeLocalStorage.mjs"'],
  ]
);
const reflectionDraftStorePath = await compileTsModule(
  new URL("../src/lib/reflectionDraftStore.ts", import.meta.url),
  "reflectionDraftStore.mjs",
  [['"./safeLocalStorage"', '"./safeLocalStorage.mjs"']]
);
const localPreferenceStorePath = await compileTsModule(
  new URL("../src/lib/localPreferenceStore.ts", import.meta.url),
  "localPreferenceStore.mjs",
  [['"./safeLocalStorage"', '"./safeLocalStorage.mjs"']]
);
const reflectionBackupPath = await compileTsModule(
  new URL("../src/lib/reflectionBackup.ts", import.meta.url),
  "reflectionBackup.mjs",
  [
    ['"../types/reflection"', '"./reflectionTypes.mjs"'],
    ['"./reflectionStore"', '"./reflectionStore.mjs"'],
  ]
);
const reflectionSyncPath = await compileTsModule(
  new URL("../src/lib/reflectionSync.ts", import.meta.url),
  "reflectionSync.mjs",
  [
    ['"../types/reflection"', '"./reflectionTypes.mjs"'],
    ['"./reflectionStore"', '"./reflectionStore.mjs"'],
  ]
);
const reflectionSharePath = await compileTsModule(
  new URL("../src/lib/reflectionShare.ts", import.meta.url),
  "reflectionShare.mjs"
);
const sampleReflectionPath = await compileTsModule(
  new URL("../src/lib/sampleReflection.ts", import.meta.url),
  "sampleReflection.mjs",
  [
    ['"../data/reflectionTemplates"', '"./reflectionTemplates.mjs"'],
    ['"./reflectionStore"', '"./reflectionStore.mjs"'],
  ]
);
const questionTimelinePath = await compileTsModule(
  new URL("../src/lib/questionTimeline.ts", import.meta.url),
  "questionTimeline.mjs"
);
const appNavPath = await compileTsModule(
  new URL("../src/lib/appNavigation.ts", import.meta.url),
  "appNavigation.mjs"
);
const appHistoryPath = await compileTsModule(
  new URL("../src/lib/appHistory.ts", import.meta.url),
  "appHistory.mjs",
  [['"./reflectionShare"', '"./reflectionShare.mjs"']]
);
const rediscoveryPath = await compileTsModule(
  new URL("../src/lib/rediscovery.ts", import.meta.url),
  "rediscovery.mjs"
);
const quickReflectionPath = await compileTsModule(
  new URL("../src/lib/quickReflection.ts", import.meta.url),
  "quickReflection.mjs"
);
const localTelemetryPath = await compileTsModule(
  new URL("../src/lib/localTelemetry.ts", import.meta.url),
  "localTelemetry.mjs",
  [['"./safeLocalStorage"', '"./safeLocalStorage.mjs"']]
);

const reflectionStore = await import(pathToFileURL(reflectionStorePath).href);
const reflectionDraftStore = await import(pathToFileURL(reflectionDraftStorePath).href);
const localPreferenceStore = await import(pathToFileURL(localPreferenceStorePath).href);
const reflectionBackup = await import(pathToFileURL(reflectionBackupPath).href);
const reflectionSync = await import(pathToFileURL(reflectionSyncPath).href);
const reflectionShare = await import(pathToFileURL(reflectionSharePath).href);
const sampleReflection = await import(pathToFileURL(sampleReflectionPath).href);
const questionTimeline = await import(pathToFileURL(questionTimelinePath).href);
const appNav = await import(pathToFileURL(appNavPath).href);
const appHistory = await import(pathToFileURL(appHistoryPath).href);
const rediscovery = await import(pathToFileURL(rediscoveryPath).href);
const quickReflection = await import(pathToFileURL(quickReflectionPath).href);
const localTelemetry = await import(pathToFileURL(localTelemetryPath).href);

globalThis.localStorage = new MemoryStorage();

function createYearDraft(year = 2026) {
  return reflectionStore.createReflectionDraft({
    templateId: "template_year",
    period: { label: String(year), year },
    questionSetMode: "light",
  });
}

function createTravelDraft(label = "jeju-trip") {
  return reflectionStore.createReflectionDraft({
    templateId: "template_travel",
    period: { label },
    questionSetMode: "light",
    title: `${label} memory`,
  });
}

test("creates a reflection draft from the year template light question set", () => {
  const reflection = createYearDraft();
  const questions = reflection.questionGroups.flatMap((group) => group.questions);

  assert.equal(reflection.type, "year");
  assert.equal(reflection.mode, "solo");
  assert.equal(reflection.visibility, "private");
  assert.equal(questions.length, 10);
  assert.equal(questions[0].id, "year_place");
  assert.equal(typeof questions[0].text, "string");
});

test("adds concrete writing hints to reflection template questions", () => {
  const reflection = createTravelDraft();
  const hints = reflection.questionGroups.flatMap((group) =>
    group.questions.map((question) => question.hint)
  );

  assert.ok(hints.every((hint) => typeof hint === "string" && hint.length > 10));
  assert.notEqual(hints[0], hints[1]);
});

test("saves loads updates and deletes reflection data", () => {
  localStorage.clear();

  let reflection = createYearDraft();
  const firstQuestionId = reflection.questionGroups[0].questions[0].id;

  reflection = reflectionStore.saveReflectionAnswer(reflection, firstQuestionId, "kyoto path");
  reflectionStore.saveReflection(reflection);

  let loaded = reflectionStore.loadReflections();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].answers[0].value, "kyoto path");
  assert.equal(loaded[0].completionRate, 10);
  assert.equal(loaded[0].representativeSentence, "kyoto path");

  reflectionStore.deleteReflection(reflection.id);
  loaded = reflectionStore.loadReflections();
  assert.equal(loaded.length, 0);
});

test("keeps current writing drafts separate from completed answers", () => {
  localStorage.clear();

  const saved = reflectionDraftStore.saveReflectionDraft({
    reflectionId: "reflection_a",
    questionId: "question_a",
    value: "draft sentence ",
  });

  assert.equal(saved.ok, true);
  assert.equal(
    reflectionDraftStore.loadReflectionDraft("reflection_a", "question_a").value,
    "draft sentence "
  );
  assert.equal(reflectionDraftStore.loadReflectionDraft("reflection_a", "missing"), null);

  reflectionDraftStore.clearReflectionDraft("reflection_a", "question_a");
  assert.equal(reflectionDraftStore.loadReflectionDraft("reflection_a", "question_a"), null);
});

test("ignores malformed draft storage instead of crashing", () => {
  localStorage.clear();
  localStorage.setItem(reflectionDraftStore.REFLECTION_DRAFT_STORAGE_KEY, "not-json");

  assert.deepEqual(reflectionDraftStore.loadReflectionDrafts(), []);
});

test("does not crash when draft storage cannot be read or written", () => {
  const originalStorage = globalThis.localStorage;
  const failingStorage = new MemoryStorage();
  failingStorage.getItem = () => {
    throw new Error("storage blocked");
  };
  failingStorage.setItem = () => {
    throw new Error("quota exceeded");
  };

  try {
    globalThis.localStorage = failingStorage;
    assert.deepEqual(reflectionDraftStore.loadReflectionDrafts(), []);
    assert.deepEqual(
      reflectionDraftStore.saveReflectionDraft({
        reflectionId: "reflection_a",
        questionId: "question_a",
        value: "draft",
      }),
      { ok: false, reason: "write_failed" }
    );
  } finally {
    globalThis.localStorage = originalStorage;
  }
});

test("does not crash when reflection storage cannot be read", () => {
  const originalStorage = globalThis.localStorage;
  const failingStorage = new MemoryStorage();
  failingStorage.getItem = () => {
    throw new Error("storage blocked");
  };

  try {
    globalThis.localStorage = failingStorage;
    assert.deepEqual(reflectionStore.loadReflections(), []);
    assert.deepEqual(reflectionStore.getReflectionStorageStatus(), { ok: false, reason: "read_failed" });
  } finally {
    globalThis.localStorage = originalStorage;
  }
});

test("falls back when preference storage is blocked", () => {
  const originalStorage = globalThis.localStorage;
  const failingStorage = new MemoryStorage();
  failingStorage.getItem = () => {
    throw new Error("storage blocked");
  };
  failingStorage.setItem = () => {
    throw new Error("quota exceeded");
  };

  try {
    globalThis.localStorage = failingStorage;
    assert.equal(localPreferenceStore.loadPreferredLanguage(), "ko");
    assert.equal(localPreferenceStore.loadPreferredTheme(), "book");
    assert.equal(localPreferenceStore.savePreferredLanguage("en"), false);
    assert.equal(localPreferenceStore.savePreferredTheme("letter"), false);
  } finally {
    globalThis.localStorage = originalStorage;
  }
});

test("does not crash when reflection storage cannot be written", () => {
  const originalStorage = globalThis.localStorage;
  const failingStorage = new MemoryStorage();
  failingStorage.setItem = () => {
    throw new Error("quota exceeded");
  };

  try {
    globalThis.localStorage = failingStorage;
    const reflection = createYearDraft();
    const saved = reflectionStore.saveReflections([reflection]);

    assert.equal(saved.length, 1);
    assert.deepEqual(reflectionStore.getReflectionStorageStatus(), { ok: false, reason: "write_failed" });
  } finally {
    globalThis.localStorage = originalStorage;
  }
});

test("exports reflection backups with the canonical schema", async () => {
  const reflection = createTravelDraft();
  const blob = reflectionBackup.exportReflectionBackup([reflection]);
  const payload = JSON.parse(await blob.text());

  assert.equal(payload.schema, "recoverse_reflections_v1");
  assert.equal(payload.reflections.length, 1);
  assert.equal(payload.reflections[0].title, "jeju-trip memory");
});

test("merges reflection backups without overwriting newer local data", () => {
  const local = createYearDraft();
  const olderDuplicate = {
    ...local,
    title: "Older title",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };
  const incomingNew = createTravelDraft("busan-trip");

  const backup = JSON.stringify({
    schema: "recoverse_reflections_v1",
    exportedAt: "2026-01-01T00:00:00.000Z",
    reflections: [olderDuplicate, incomingNew],
  });
  const result = reflectionBackup.mergeReflectionBackup([local], backup);

  assert.equal(result.added, 1);
  assert.equal(result.updated, 0);
  assert.equal(result.skipped, 1);
  assert.equal(result.reflections.length, 2);
  assert.equal(result.reflections.find((item) => item.id === local.id).title, local.title);
  assert.ok(result.reflections.some((item) => item.title === "busan-trip memory"));
});

test("builds account sync payloads from canonical reflections", () => {
  const reflection = createTravelDraft();
  const payload = reflectionSync.buildReflectionSyncPayload([reflection], "google");

  assert.equal(payload.schema, "recoverse_account_sync_v1");
  assert.equal(payload.source, "local_browser");
  assert.equal(payload.provider, "google");
  assert.equal(payload.reflections.length, 1);
  assert.equal(payload.reflections[0].title, "jeju-trip memory");
});

test("explains local only account save fallback", () => {
  assert.match(reflectionSync.getAccountSaveUnavailableMessage("kakao"), /Kakao/);
  assert.ok(reflectionSync.getLocalOnlyStorageWarning(1).length > 10);
});

test("encodes and restores read only reflection share snapshots", () => {
  let reflection = createTravelDraft();
  const firstQuestion = reflection.questionGroups[0].questions[0];
  reflection = reflectionStore.saveReflectionAnswer(reflection, firstQuestion.id, "sea ramen");

  const snapshot = reflectionShare.buildSharedReflectionSnapshot(reflection, [firstQuestion.id]);
  const hash = reflectionShare.buildShareHash(snapshot);
  const restored = reflectionShare.readShareHash(hash);

  assert.ok(hash.startsWith("#share="));
  assert.equal(restored.title, "jeju-trip memory");
  assert.equal(restored.items.length, 1);
  assert.equal(restored.items[0].questionText, firstQuestion.text);
  assert.equal(restored.items[0].answerText, "sea ramen");
});

test("creates a complete sample reflection users can preview", () => {
  const sample = sampleReflection.createSampleReflection();

  assert.equal(sample.id, sampleReflection.SAMPLE_REFLECTION_ID);
  assert.equal(sample.templateId, "template_travel");
  assert.ok(sample.period.label.length > 0);
  assert.ok(sample.answers.length > 0);
  assert.equal(sample.completionRate, 100);
  assert.ok(sample.representativeSentence.length > 0);
});

test("builds same question timelines across reflection periods", () => {
  function makeYearReflection(year, value) {
    let reflection = createYearDraft(year);
    const firstQuestion = reflection.questionGroups[0].questions[0];
    return reflectionStore.saveReflectionAnswer(reflection, firstQuestion.id, value);
  }

  const first = makeYearReflection(2024, "slowly");
  const second = makeYearReflection(2025, "clearly");

  const questionText = first.questionGroups[0].questions[0].text;
  const timeline = questionTimeline.findSameQuestionAnswers(questionText, [first, second]);

  assert.deepEqual(timeline.map((item) => item.period.year), [2024, 2025]);
  assert.deepEqual(timeline.map((item) => item.answer.value), ["slowly", "clearly"]);
});

test("appNavigation bottomNavLabels maps every BottomTabId", () => {
  const { bottomNavLabels } = appNav;

  assert.equal(typeof bottomNavLabels, "object");
  assert.deepEqual(Object.keys(bottomNavLabels).sort(), ["home", "review", "write"]);
  assert.ok(Object.values(bottomNavLabels).every((label) => typeof label === "string" && label.length > 0));
});

test("appNavigation shouldShowBottomNav keeps the tab bar visible in every mode", () => {
  const { shouldShowBottomNav } = appNav;
  const visibleModes = [
    "home-book",
    "reflection-new",
    "reflection-write",
    "reflection-detail",
    "review-again",
    "shared-reflections",
    "archive-settings",
  ];

  for (const mode of visibleModes) {
    assert.ok(shouldShowBottomNav(mode), `${mode} should show bottom nav`);
  }
});

test("appNavigation getActiveBottomTab maps modes to correct tabs", () => {
  const { getActiveBottomTab } = appNav;

  assert.equal(getActiveBottomTab("home-book"), "home");
  assert.equal(getActiveBottomTab("reflection-new"), "write");
  assert.equal(getActiveBottomTab("reflection-write"), "write");
  assert.equal(getActiveBottomTab("review-again"), "review");
  assert.equal(getActiveBottomTab("reflection-detail"), null);
  assert.equal(getActiveBottomTab("shared-reflections"), null);
  assert.equal(getActiveBottomTab("archive-settings"), null);
});

test("appNavigation isTabActive matches the navigateBottomTab guard logic", () => {
  const { isTabActive } = appNav;

  assert.ok(isTabActive("home-book", "home"));
  assert.ok(!isTabActive("home-book", "write"));
  assert.ok(!isTabActive("home-book", "review"));
  assert.ok(isTabActive("reflection-new", "write"));
  assert.ok(isTabActive("reflection-write", "write"));
  assert.ok(!isTabActive("reflection-new", "home"));
  assert.ok(!isTabActive("reflection-write", "home"));
  assert.ok(isTabActive("review-again", "review"));
  assert.ok(!isTabActive("shared-reflections", "review"));
  assert.ok(!isTabActive("review-again", "home"));
  assert.ok(!isTabActive("reflection-detail", "home"));
  assert.ok(!isTabActive("reflection-detail", "write"));
  assert.ok(!isTabActive("reflection-detail", "review"));
});

test("appHistory createHistoryState creates correct state object", () => {
  assert.deepEqual(appHistory.createHistoryState("home-book"), { recoverseMode: "home-book" });
  assert.deepEqual(appHistory.createHistoryState("reflection-write"), { recoverseMode: "reflection-write" });
});

test("appHistory shouldRecordHistory returns true by default and false when recordHistory is false", () => {
  assert.equal(appHistory.shouldRecordHistory({}), true);
  assert.equal(appHistory.shouldRecordHistory({ recordHistory: true }), true);
  assert.equal(appHistory.shouldRecordHistory({ recordHistory: false }), false);
});

test("appHistory urlWithoutHash concatenates pathname and search", () => {
  assert.equal(appHistory.urlWithoutHash("/app", "?lang=ko"), "/app?lang=ko");
  assert.equal(appHistory.urlWithoutHash("/app/", ""), "/app/");
  assert.equal(appHistory.urlWithoutHash("/", "?q=test"), "/?q=test");
});

test("appHistory popFallbackMode pops from stack or returns default", () => {
  const stack = ["a", "b"];
  assert.equal(appHistory.popFallbackMode(stack, "default"), "b");
  assert.equal(stack.length, 1);
  assert.equal(appHistory.popFallbackMode(stack, "default"), "a");
  assert.equal(stack.length, 0);
  assert.equal(appHistory.popFallbackMode(stack, "home-book"), "home-book");
});

test("appHistory urlHasShareHash detects share hash prefix", () => {
  assert.equal(appHistory.urlHasShareHash("#share=abc123"), true);
  assert.equal(appHistory.urlHasShareHash("#other=value"), false);
  assert.equal(appHistory.urlHasShareHash(""), false);
  assert.equal(appHistory.urlHasShareHash("no-hash"), false);
});

function makeReflection(overrides = {}) {
  const now = new Date("2026-06-29T00:00:00Z").toISOString();
  return {
    id: overrides.id ?? "r1",
    title: overrides.title ?? "sample",
    type: "year",
    mode: "solo",
    period: overrides.period ?? { label: "2025", year: 2025 },
    templateId: "template_year",
    questionSetMode: "light",
    questionGroups: [
      {
        id: "g1",
        label: "scene",
        questions: [
          {
            id: "q1",
            groupId: "g1",
            text: "same question",
            visibility: "public",
            isRepeatable: false,
          },
        ],
      },
    ],
    answers: overrides.answers ?? [
      { questionId: "q1", value: "sea ramen", skipped: false, updatedAt: now },
    ],
    representativeSentence: overrides.representativeSentence ?? "sea ramen",
    visibility: "private",
    isCompleted: overrides.isCompleted ?? true,
    completionRate: 100,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

test("rediscovery skips reflections newer than the threshold", () => {
  const now = new Date("2026-06-29T00:00:00+09:00").getTime();
  const reflection = makeReflection({
    updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
  });

  assert.equal(rediscovery.pickRediscovery([reflection], now), null);
});

test("rediscovery skips reflections with only empty answers", () => {
  const now = new Date("2026-06-29T00:00:00+09:00").getTime();
  const reflection = makeReflection({
    answers: [
      { questionId: "q1", value: "", skipped: true, updatedAt: new Date(now).toISOString() },
    ],
    updatedAt: new Date(now - 400 * 24 * 60 * 60 * 1000).toISOString(),
  });

  assert.equal(rediscovery.pickRediscovery([reflection], now), null);
});

test("rediscovery prefers the largest ago bucket", () => {
  const now = new Date("2026-06-29T00:00:00+09:00").getTime();
  const week = makeReflection({
    id: "week",
    updatedAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const month = makeReflection({
    id: "month",
    updatedAt: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const year = makeReflection({
    id: "year",
    updatedAt: new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const pick = rediscovery.pickRediscovery([week, month, year], now);
  assert.equal(pick?.reflection.id, "year");
  assert.equal(pick?.window, "year");
});

test("rediscovery rotates daily inside a bucket via date seed", () => {
  const day1 = new Date("2026-06-29T00:00:00+09:00").getTime();
  const day2 = new Date("2026-06-30T00:00:00+09:00").getTime();
  const reflections = Array.from({ length: 5 }, (_, i) =>
    makeReflection({
      id: `r${i}`,
      title: `reflection ${i}`,
      updatedAt: new Date(day1 - (400 + i) * 24 * 60 * 60 * 1000).toISOString(),
    })
  );

  const pick1 = rediscovery.pickRediscovery(reflections, day1);
  const pick2 = rediscovery.pickRediscovery(reflections, day2);

  assert.ok(pick1);
  assert.ok(pick2);
  assert.equal(rediscovery.pickRediscovery(reflections, day1)?.reflection.id, pick1.reflection.id);
  assert.equal(typeof pick2.reflection.id, "string");
});

test("rediscovery describeWindow maps every bucket to a label", () => {
  assert.ok(rediscovery.describeWindow("year").length > 0);
  assert.ok(rediscovery.describeWindow("month").length > 0);
  assert.ok(rediscovery.describeWindow("week").length > 0);
});

test("quickReflection builds a single-question draft a normalizer accepts", () => {
  const now = new Date("2026-06-29T03:00:00Z");
  const draft = quickReflection.createQuickReflection(now);

  assert.equal(draft.questionGroups.length, 1);
  assert.equal(draft.questionGroups[0].questions.length, 1);
  assert.equal(draft.isCompleted, false);
  assert.equal(draft.completionRate, 0);
  assert.equal(draft.answers.length, 0);
  assert.equal(draft.templateId, "quick_one_line");

  const normalized = reflectionStore.normalizeReflection(draft);
  assert.ok(normalized, "quick draft should pass normalization");
  assert.equal(normalized.questionGroups[0].questions[0].id, draft.questionGroups[0].questions[0].id);
});

test("quickReflection produces unique ids across calls", () => {
  const a = quickReflection.createQuickReflection(new Date("2026-06-29T03:00:00Z"));
  const b = quickReflection.createQuickReflection(new Date("2026-06-29T03:00:00Z"));
  assert.notEqual(a.id, b.id);
  assert.notEqual(a.questionGroups[0].id, b.questionGroups[0].id);
  assert.notEqual(a.questionGroups[0].questions[0].id, b.questionGroups[0].questions[0].id);
});

test("telemetry counts at most one session per local day", () => {
  localStorage.clear();
  const day1 = new Date("2026-06-29T09:00:00+09:00");
  const day1Later = new Date("2026-06-29T18:00:00+09:00");
  const after1 = localTelemetry.recordSession(day1);
  const after2 = localTelemetry.recordSession(day1Later);
  assert.equal(after1.totalSessions, 1);
  assert.equal(after2.totalSessions, 1);
  assert.equal(after2.currentStreak, 1);
  assert.equal(after2.longestStreak, 1);
});

test("telemetry extends a streak when consecutive days appear", () => {
  localStorage.clear();
  const day1 = new Date("2026-06-29T09:00:00+09:00");
  const day2 = new Date("2026-06-30T09:00:00+09:00");
  const day3 = new Date("2026-07-01T09:00:00+09:00");
  localTelemetry.recordSession(day1);
  localTelemetry.recordSession(day2);
  const state = localTelemetry.recordSession(day3);
  assert.equal(state.totalSessions, 3);
  assert.equal(state.currentStreak, 3);
  assert.equal(state.longestStreak, 3);
});

test("telemetry resets the streak when a day is skipped", () => {
  localStorage.clear();
  const day1 = new Date("2026-06-29T09:00:00+09:00");
  const day3 = new Date("2026-07-01T09:00:00+09:00");
  localTelemetry.recordSession(day1);
  const state = localTelemetry.recordSession(day3);
  assert.equal(state.totalSessions, 2);
  assert.equal(state.currentStreak, 1);
  assert.equal(state.longestStreak, 1);
});

test("telemetry recordAnswer accumulates the answer count", () => {
  localStorage.clear();
  localTelemetry.recordSession(new Date("2026-06-29T09:00:00+09:00"));
  localTelemetry.recordAnswer(new Date("2026-06-29T09:05:00+09:00"));
  const after = localTelemetry.recordAnswer(new Date("2026-06-29T09:06:00+09:00"));
  assert.equal(after.totalAnswers, 2);
});

test("telemetry describeTelemetry returns local-day deltas", () => {
  localStorage.clear();
  localTelemetry.recordSession(new Date("2026-06-29T09:00:00+09:00"));
  const state = localTelemetry.recordSession(new Date("2026-07-02T09:00:00+09:00"));
  const summary = localTelemetry.describeTelemetry(state, new Date("2026-07-05T09:00:00+09:00"));
  assert.equal(summary.daysSinceFirst, 6);
  assert.equal(summary.daysSinceLast, 3);
});

test("telemetry resetTelemetry clears the stored counters", () => {
  localStorage.clear();
  localTelemetry.recordSession(new Date("2026-06-29T09:00:00+09:00"));
  localTelemetry.recordAnswer(new Date("2026-06-29T09:05:00+09:00"));
  localTelemetry.resetTelemetry();
  const state = localTelemetry.loadTelemetry(new Date("2026-06-29T09:10:00+09:00"));
  assert.equal(state.totalSessions, 0);
  assert.equal(state.totalAnswers, 0);
  assert.equal(state.currentStreak, 0);
});
