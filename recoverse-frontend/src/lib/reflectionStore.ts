import { buildQuestionGroupsForMode, getReflectionTemplate } from "../data/reflectionTemplates";
import type {
  Answer,
  Question,
  QuestionGroup,
  Reflection,
  ReflectionMode,
  ReflectionPeriod,
  ReflectionQuestionSetMode,
  ReflectionType,
} from "../types/reflection";

export const REFLECTION_STORAGE_KEY = "recoverse_reflections_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function uuid(): string {
  return (crypto as any)?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizePeriod(raw: any): ReflectionPeriod | null {
  if (!raw || typeof raw !== "object") return null;

  const label = normalizeText(raw.label);
  if (!label) return null;

  return {
    label,
    year: Number.isFinite(Number(raw.year)) ? Number(raw.year) : undefined,
    startDate: typeof raw.startDate === "string" ? raw.startDate : undefined,
    endDate: typeof raw.endDate === "string" ? raw.endDate : undefined,
  };
}

function isReflectionType(value: unknown): value is ReflectionType {
  return (
    value === "year" ||
    value === "half_year" ||
    value === "travel" ||
    value === "life_chapter" ||
    value === "project" ||
    value === "relationship" ||
    value === "custom"
  );
}

function isQuestionSetMode(value: unknown): value is ReflectionQuestionSetMode {
  return value === "light" || value === "deep" || value === "share" || value === "compare";
}

function normalizeQuestion(raw: any): Question | null {
  if (!raw || typeof raw !== "object") return null;

  const id = normalizeText(raw.id);
  const text = normalizeText(raw.text);
  const groupId = normalizeText(raw.groupId);
  if (!id || !text || !groupId) return null;

  const visibility =
    raw.visibility === "private" || raw.visibility === "hidden" ? raw.visibility : "public";

  return {
    id,
    text,
    groupId,
    hint: typeof raw.hint === "string" && raw.hint.trim() ? raw.hint.trim() : undefined,
    isRepeatable: Boolean(raw.isRepeatable),
    visibility,
  };
}

function normalizeQuestionGroup(raw: any): QuestionGroup | null {
  if (!raw || typeof raw !== "object") return null;

  const id = normalizeText(raw.id);
  const label = normalizeText(raw.label);
  if (!id || !label) return null;

  const questions = Array.isArray(raw.questions)
    ? (raw.questions.map(normalizeQuestion).filter(Boolean) as Question[])
    : [];

  return { id, label, questions };
}

function normalizeAnswer(raw: any, validQuestionIds: Set<string>): Answer | null {
  if (!raw || typeof raw !== "object") return null;

  const questionId = normalizeText(raw.questionId);
  if (!validQuestionIds.has(questionId)) return null;

  return {
    questionId,
    value: normalizeText(raw.value),
    skipped: Boolean(raw.skipped),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

export function calculateCompletionRate(questionGroups: QuestionGroup[], answers: Answer[]): number {
  const questionIds = questionGroups.flatMap((group) => group.questions.map((question) => question.id));
  if (questionIds.length === 0) return 0;

  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
  const completed = questionIds.filter((questionId) => {
    const answer = answerMap.get(questionId);
    return Boolean(answer && (answer.skipped || answer.value.trim().length > 0));
  }).length;

  return Math.round((completed / questionIds.length) * 100);
}

export function normalizeReflection(raw: any): Reflection | null {
  if (!raw || typeof raw !== "object") return null;

  const title = normalizeText(raw.title);
  const period = normalizePeriod(raw.period);
  if (!title || !period) return null;

  const questionGroups = Array.isArray(raw.questionGroups)
    ? (raw.questionGroups.map(normalizeQuestionGroup).filter(Boolean) as QuestionGroup[])
    : [];
  const questionIds = new Set(
    questionGroups.flatMap((group) => group.questions.map((question) => question.id))
  );
  const answers = Array.isArray(raw.answers)
    ? (raw.answers.map((answer: unknown) => normalizeAnswer(answer, questionIds)).filter(Boolean) as Answer[])
    : [];
  const now = new Date().toISOString();
  const completionRate = calculateCompletionRate(questionGroups, answers);

  return {
    id: typeof raw.id === "string" ? raw.id : uuid(),
    title,
    type: isReflectionType(raw.type) ? raw.type : "custom",
    mode: raw.mode === "with_friends" ? "with_friends" : "solo",
    period,
    templateId: typeof raw.templateId === "string" ? raw.templateId : "custom",
    questionSetMode: isQuestionSetMode(raw.questionSetMode) ? raw.questionSetMode : "light",
    questionGroups,
    answers,
    representativeSentence:
      typeof raw.representativeSentence === "string" && raw.representativeSentence.trim()
        ? raw.representativeSentence.trim()
        : firstAnswerValue(answers),
    visibility: raw.visibility === "shared" ? "shared" : "private",
    shareSettings: raw.shareSettings,
    isCompleted: Boolean(raw.isCompleted) || completionRate === 100,
    completionRate,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

function firstAnswerValue(answers: Answer[]): string | undefined {
  return answers.find((answer) => answer.value.trim().length > 0)?.value.trim();
}

export function loadReflections(): Reflection[] {
  const parsed = safeParse<any>(localStorage.getItem(REFLECTION_STORAGE_KEY));
  const reflections = Array.isArray(parsed?.reflections)
    ? (parsed.reflections.map(normalizeReflection).filter(Boolean) as Reflection[])
    : [];

  return reflections.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function saveReflections(reflections: Reflection[]): Reflection[] {
  const normalized = reflections.map(normalizeReflection).filter(Boolean) as Reflection[];
  localStorage.setItem(REFLECTION_STORAGE_KEY, JSON.stringify({ reflections: normalized }));
  return normalized;
}

export function saveReflection(reflection: Reflection): Reflection[] {
  const previous = loadReflections();
  const next = [
    normalizeReflection(reflection),
    ...previous.filter((item) => item.id !== reflection.id),
  ].filter(Boolean) as Reflection[];

  return saveReflections(next);
}

export function deleteReflection(reflectionId: string): Reflection[] {
  return saveReflections(loadReflections().filter((reflection) => reflection.id !== reflectionId));
}

export function createReflectionDraft(options: {
  templateId: string;
  period: ReflectionPeriod;
  questionSetMode: ReflectionQuestionSetMode;
  mode?: ReflectionMode;
  title?: string;
}): Reflection {
  const template = getReflectionTemplate(options.templateId);
  if (!template) {
    throw new Error(`Unknown reflection template: ${options.templateId}`);
  }

  const now = new Date().toISOString();
  const questionGroups = buildQuestionGroupsForMode(template, options.questionSetMode);
  const title = options.title?.trim() || `${options.period.label} ${template.label}`;

  return {
    id: uuid(),
    title,
    type: template.type,
    mode: options.mode ?? "solo",
    period: options.period,
    templateId: template.id,
    questionSetMode: options.questionSetMode,
    questionGroups,
    answers: [],
    visibility: "private",
    isCompleted: false,
    completionRate: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function saveReflectionAnswer(
  reflection: Reflection,
  questionId: string,
  value: string,
  skipped = false
): Reflection {
  const now = new Date().toISOString();
  const validQuestionIds = new Set(
    reflection.questionGroups.flatMap((group) => group.questions.map((question) => question.id))
  );

  if (!validQuestionIds.has(questionId)) {
    throw new Error(`Unknown reflection question: ${questionId}`);
  }

  const answers = [
    ...reflection.answers.filter((answer) => answer.questionId !== questionId),
    {
      questionId,
      value: value.trim(),
      skipped,
      updatedAt: now,
    },
  ];
  const completionRate = calculateCompletionRate(reflection.questionGroups, answers);

  return {
    ...reflection,
    answers,
    representativeSentence: reflection.representativeSentence ?? firstAnswerValue(answers),
    completionRate,
    isCompleted: completionRate === 100,
    updatedAt: now,
  };
}

