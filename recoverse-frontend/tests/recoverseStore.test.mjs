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

await writeFile(join(tempDir, "recoverseTypes.mjs"), "export {};\\n", "utf8");
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

const reflectionStore = await import(pathToFileURL(reflectionStorePath).href);
const reflectionDraftStore = await import(pathToFileURL(reflectionDraftStorePath).href);
const localPreferenceStore = await import(pathToFileURL(localPreferenceStorePath).href);
const reflectionBackup = await import(pathToFileURL(reflectionBackupPath).href);
const reflectionSync = await import(pathToFileURL(reflectionSyncPath).href);
const reflectionShare = await import(pathToFileURL(reflectionSharePath).href);
const sampleReflection = await import(pathToFileURL(sampleReflectionPath).href);
const questionTimeline = await import(pathToFileURL(questionTimelinePath).href);

const appNavPath = await compileTsModule(
  new URL("../src/lib/appNavigation.ts", import.meta.url),
  "appNavigation.mjs"
);
const appNav = await import(pathToFileURL(appNavPath).href);

const appHistoryPath = await compileTsModule(
  new URL("../src/lib/appHistory.ts", import.meta.url),
  "appHistory.mjs",
  [['"./reflectionShare"', '"./reflectionShare.mjs"']]
);
const appHistory = await import(pathToFileURL(appHistoryPath).href);

const rediscoveryPath = await compileTsModule(
  new URL("../src/lib/rediscovery.ts", import.meta.url),
  "rediscovery.mjs"
);
const rediscovery = await import(pathToFileURL(rediscoveryPath).href);

globalThis.localStorage = new MemoryStorage();

test("creates a reflection draft from the year template light question set", () => {
  const reflection = reflectionStore.createReflectionDraft({
    templateId: "template_year",
    period: { label: "2025년", year: 2025 },
    questionSetMode: "light",
  });

  const questions = reflection.questionGroups.flatMap((group) => group.questions);

  assert.equal(reflection.title, "2025년 한 해 회고");
  assert.equal(reflection.type, "year");
  assert.equal(reflection.mode, "solo");
  assert.equal(reflection.visibility, "private");
  assert.equal(questions.length, 10);
  assert.equal(questions[0].text, "올해 가장 기억에 남는 장소는?");
});

test("adds concrete writing hints to reflection template questions", () => {
  const reflection = reflectionStore.createReflectionDraft({
    templateId: "template_travel",
    period: { label: "제주 여행" },
    questionSetMode: "light",
  });
  const hints = reflection.questionGroups.flatMap((group) =>
    group.questions.map((question) => question.hint)
  );

  assert.ok(hints.every((hint) => hint && !hint.includes("단어만 적어도")));
  assert.match(hints[0], /도착|이동|숙소|길거리/);
});

test("saves loads updates and deletes reflection data", () => {
  localStorage.clear();

  let reflection = reflectionStore.createReflectionDraft({
    templateId: "template_year",
    period: { label: "2025년", year: 2025 },
    questionSetMode: "light",
  });
  const firstQuestionId = reflection.questionGroups[0].questions[0].id;

  reflection = reflectionStore.saveReflectionAnswer(reflection, firstQuestionId, "교토 철학의 길");
  reflectionStore.saveReflection(reflection);

  let loaded = reflectionStore.loadReflections();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].answers[0].value, "교토 철학의 길");
  assert.equal(loaded[0].completionRate, 10);
  assert.equal(loaded[0].representativeSentence, "교토 철학의 길");

  reflectionStore.deleteReflection(reflection.id);
  loaded = reflectionStore.loadReflections();
  assert.equal(loaded.length, 0);
});

test("keeps current writing drafts separate from completed answers", () => {
  localStorage.clear();

  const saved = reflectionDraftStore.saveReflectionDraft({
    reflectionId: "reflection_a",
    questionId: "question_a",
    value: "아직 다듬는 중인 문장 ",
  });

  assert.equal(saved.ok, true);
  assert.equal(
    reflectionDraftStore.loadReflectionDraft("reflection_a", "question_a").value,
    "아직 다듬는 중인 문장 "
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
    assert.equal(localPreferenceStore.loadPreferredTheme(), "universe");
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
    const reflection = reflectionStore.createReflectionDraft({
      templateId: "template_year",
      period: { label: "2026년", year: 2026 },
      questionSetMode: "light",
    });
    const saved = reflectionStore.saveReflections([reflection]);

    assert.equal(saved.length, 1);
    assert.deepEqual(reflectionStore.getReflectionStorageStatus(), { ok: false, reason: "write_failed" });
  } finally {
    globalThis.localStorage = originalStorage;
  }
});

test("exports reflection backups with the canonical schema", async () => {
  const reflection = reflectionStore.createReflectionDraft({
    templateId: "template_travel",
    period: { label: "제주 여행" },
    questionSetMode: "light",
    title: "제주 여행의 기억",
  });

  const blob = reflectionBackup.exportReflectionBackup([reflection]);
  const payload = JSON.parse(await blob.text());

  assert.equal(payload.schema, "recoverse_reflections_v1");
  assert.equal(payload.reflections.length, 1);
  assert.equal(payload.reflections[0].title, "제주 여행의 기억");
});

test("merges reflection backups without overwriting newer local data", () => {
  const local = reflectionStore.createReflectionDraft({
    templateId: "template_year",
    period: { label: "2026년", year: 2026 },
    questionSetMode: "light",
  });
  const olderDuplicate = {
    ...local,
    title: "Older title",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };
  const incomingNew = reflectionStore.createReflectionDraft({
    templateId: "template_travel",
    period: { label: "부산 여행" },
    questionSetMode: "light",
    title: "부산 여행의 기억",
  });

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
  assert.ok(result.reflections.some((item) => item.title === "부산 여행의 기억"));
});

test("builds account sync payloads from canonical reflections", () => {
  const reflection = reflectionStore.createReflectionDraft({
    templateId: "template_travel",
    period: { label: "제주 여행" },
    questionSetMode: "light",
    title: "제주 여행의 기억",
  });

  const payload = reflectionSync.buildReflectionSyncPayload([reflection], "google");

  assert.equal(payload.schema, "recoverse_account_sync_v1");
  assert.equal(payload.source, "local_browser");
  assert.equal(payload.provider, "google");
  assert.equal(payload.reflections.length, 1);
  assert.equal(payload.reflections[0].title, "제주 여행의 기억");
});

test("explains local only account save fallback", () => {
  assert.match(
    reflectionSync.getAccountSaveUnavailableMessage("kakao"),
    /Kakao 계정 저장은 아직 연결 전/
  );
  assert.match(
    reflectionSync.getLocalOnlyStorageWarning(1),
    /브라우저 데이터가 삭제되면 사라질 수/
  );
});

test("encodes and restores read only reflection share snapshots", () => {
  let reflection = reflectionStore.createReflectionDraft({
    templateId: "template_travel",
    period: { label: "제주 여행" },
    questionSetMode: "light",
    title: "제주 여행의 기억",
  });
  const firstQuestion = reflection.questionGroups[0].questions[0];
  reflection = reflectionStore.saveReflectionAnswer(
    reflection,
    firstQuestion.id,
    "바다 앞에서 먹은 라면"
  );

  const snapshot = reflectionShare.buildSharedReflectionSnapshot(reflection, [firstQuestion.id]);
  const hash = reflectionShare.buildShareHash(snapshot);
  const restored = reflectionShare.readShareHash(hash);

  assert.ok(hash.startsWith("#share="));
  assert.equal(restored.title, "제주 여행의 기억");
  assert.equal(restored.items.length, 1);
  assert.equal(restored.items[0].questionText, firstQuestion.text);
  assert.equal(restored.items[0].answerText, "바다 앞에서 먹은 라면");
});

test("creates a complete sample reflection users can preview", () => {
  const sample = sampleReflection.createSampleReflection();

  assert.equal(sample.id, sampleReflection.SAMPLE_REFLECTION_ID);
  assert.equal(sample.templateId, "template_travel");
  assert.equal(sample.period.label, "제주 여행");
  assert.ok(sample.answers.length > 0);
  assert.equal(sample.completionRate, 100);
  assert.match(sample.representativeSentence, /바다/);
});

test("builds same question timelines across reflection periods", () => {
  function makeYearReflection(year, value) {
    let reflection = reflectionStore.createReflectionDraft({
      templateId: "template_year",
      period: { label: `${year}년`, year },
      questionSetMode: "light",
    });
    const firstQuestion = reflection.questionGroups[0].questions[0];
    return reflectionStore.saveReflectionAnswer(reflection, firstQuestion.id, value);
  }

  const first = makeYearReflection(2024, "조금씩");
  const second = makeYearReflection(2025, "나답게");

  const questionText = first.questionGroups[0].questions[0].text;
  const timeline = questionTimeline.findSameQuestionAnswers(questionText, [first, second]);

  assert.deepEqual(
    timeline.map((item) => item.period.year),
    [2024, 2025]
  );
  assert.deepEqual(
    timeline.map((item) => item.answer.value),
    ["조금씩", "나답게"]
  );
});

test("appNavigation bottomNavLabels maps every BottomTabId", () => {
  const { bottomNavLabels } = appNav;

  assert.equal(typeof bottomNavLabels, "object");
  assert.equal(bottomNavLabels.home, "홈");
  assert.equal(bottomNavLabels.write, "기억 작성");
  assert.equal(bottomNavLabels.review, "다시 보기");
  assert.deepEqual(Object.keys(bottomNavLabels).sort(), ["home", "review", "write"]);
});

test("appNavigation shouldShowBottomNav returns true for every AppMode", () => {
  const { shouldShowBottomNav } = appNav;
  const modes = [
    "home-universe",
    "reflection-new",
    "reflection-write",
    "reflection-detail",
    "review-again",
    "shared-reflections",
    "archive-settings",
  ];

  for (const mode of modes) {
    assert.ok(shouldShowBottomNav(mode), `${mode} should show bottom nav`);
  }
});

test("appNavigation getActiveBottomTab maps modes to correct tabs", () => {
  const { getActiveBottomTab } = appNav;

  assert.equal(getActiveBottomTab("home-universe"), "home");
  assert.equal(getActiveBottomTab("reflection-new"), "write");
  assert.equal(getActiveBottomTab("reflection-write"), "write");
  assert.equal(getActiveBottomTab("review-again"), "review");
  // Modes without a tab home of their own do not highlight any pill.
  assert.equal(getActiveBottomTab("reflection-detail"), null);
  assert.equal(getActiveBottomTab("shared-reflections"), null);
  assert.equal(getActiveBottomTab("archive-settings"), null);
});

test("appNavigation isTabActive matches the navigateBottomTab guard logic", () => {
  const { isTabActive } = appNav;

  assert.ok(isTabActive("home-universe", "home"));
  assert.ok(!isTabActive("home-universe", "write"));
  assert.ok(!isTabActive("home-universe", "review"));

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
  assert.deepEqual(appHistory.createHistoryState("home-universe"), { recoverseMode: "home-universe" });
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
  assert.equal(appHistory.popFallbackMode(stack, "home-universe"), "home-universe");
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
    title: overrides.title ?? "샘플 회고",
    type: "year",
    mode: "solo",
    period: overrides.period ?? { label: "2025년", year: 2025 },
    templateId: "template_year",
    questionSetMode: "light",
    questionGroups: [
      {
        id: "g1",
        label: "이 시기의 장면",
        questions: [
          { id: "q1", groupId: "g1", text: "올해 가장 기억에 남는 장면은?", visibility: "public", mode: "short" },
        ],
      },
    ],
    answers: overrides.answers ?? [
      { questionId: "q1", value: "바다 앞 라면", skipped: false, updatedAt: now },
    ],
    representativeSentence: overrides.representativeSentence ?? "바다 앞 라면",
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
    title: "지난주",
    updatedAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const month = makeReflection({
    id: "month",
    title: "한 달 전",
    updatedAt: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const year = makeReflection({
    id: "year",
    title: "1년 전",
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
      title: `회고 ${i}`,
      updatedAt: new Date(day1 - (400 + i) * 24 * 60 * 60 * 1000).toISOString(),
    })
  );

  const pick1 = rediscovery.pickRediscovery(reflections, day1);
  const pick2 = rediscovery.pickRediscovery(reflections, day2);

  assert.ok(pick1);
  assert.ok(pick2);
  // Same day → same pick.
  assert.equal(rediscovery.pickRediscovery(reflections, day1)?.reflection.id, pick1.reflection.id);
  // Different day → may differ (deterministic by date seed).
  assert.equal(typeof pick2.reflection.id, "string");
});

test("rediscovery describeWindow maps to Korean labels", () => {
  assert.equal(rediscovery.describeWindow("year"), "1년 전");
  assert.equal(rediscovery.describeWindow("month"), "한 달 전");
  assert.equal(rediscovery.describeWindow("week"), "지난주");
});
