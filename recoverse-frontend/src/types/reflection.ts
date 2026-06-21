export type ReflectionType =
  | "year"
  | "half_year"
  | "travel"
  | "life_chapter"
  | "project"
  | "relationship"
  | "custom";

export type ReflectionMode = "solo" | "with_friends";

export type ReflectionQuestionSetMode = "light" | "deep" | "share" | "compare";

export type ReflectionVisibility = "private" | "shared";

export type QuestionVisibility = "public" | "private" | "hidden";

export interface ReflectionPeriod {
  label: string;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface Question {
  id: string;
  text: string;
  groupId: string;
  hint?: string;
  isRepeatable: boolean;
  visibility: QuestionVisibility;
}

export interface QuestionGroup {
  id: string;
  label: string;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  value: string;
  skipped: boolean;
  updatedAt: string;
}

export interface ShareSetting {
  shareId: string;
  selectedQuestionIds: string[];
  hiddenQuestionIds: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface Reflection {
  id: string;
  title: string;
  type: ReflectionType;
  mode: ReflectionMode;
  period: ReflectionPeriod;
  templateId: string;
  questionSetMode: ReflectionQuestionSetMode;
  questionGroups: QuestionGroup[];
  answers: Answer[];
  representativeSentence?: string;
  visibility: ReflectionVisibility;
  shareSettings?: ShareSetting;
  isCompleted: boolean;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionTemplateQuestion extends Question {
  modes: ReflectionQuestionSetMode[];
  topic: "scene" | "people" | "taste" | "change" | "self" | "future";
}

export interface ReflectionTemplateGroup {
  id: string;
  label: string;
  questions: ReflectionTemplateQuestion[];
}

export interface ReflectionTemplate {
  id: string;
  type: ReflectionType;
  label: string;
  periodPlaceholder: string;
  groups: ReflectionTemplateGroup[];
}

export interface LegacyEntry {
  id: string;
  year: number;
  q: string;
  answers: string[];
  createdAt: string;
}

export interface QuestionTimelineItem {
  reflectionId: string;
  reflectionTitle: string;
  period: ReflectionPeriod;
  questionId: string;
  questionText: string;
  answer: Answer;
}
