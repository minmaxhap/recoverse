export type ReviewEntryV2 = {
  id: string;
  year: number;
  q: string;
  answers: string[];
  createdAt: string;
};

export type BackupPayloadV2 = {
  schema: "recoverse_v2";
  exportedAt: string;
  entries: ReviewEntryV2[];
};

export type CapsuleType =
  | "year"
  | "life_stage"
  | "career"
  | "relationship"
  | "travel"
  | "project"
  | "custom";

export type Capsule = {
  id: string;
  title: string;
  description?: string;
  type: CapsuleType;
  createdAt: string;
  updatedAt: string;
};

export type CapsuleCard = {
  id: string;
  capsuleId: string;
  questionText: string;
  answers: string[];
  source: "default" | "user" | "imported";
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CapsuleBackup = {
  schema: "recoverse_capsule_v1";
  exportedAt: string;
  capsules: Capsule[];
  cards: CapsuleCard[];
};

export type CapsuleTemplate = {
  id: string;
  title: string;
  type: CapsuleType;
  questions: string[];
};

export type CapsuleData = {
  capsules: Capsule[];
  cards: CapsuleCard[];
};

export type CapsuleImportResult = {
  data: CapsuleData;
  addedCapsules: number;
  addedCards: number;
  skippedCapsules: number;
  skippedCards: number;
};

export type CapsuleImportPreview = Omit<CapsuleImportResult, "data">;

export type AppLanguage = "ko" | "en";

export type LocalizedCapsuleTemplate = Omit<CapsuleTemplate, "title" | "questions"> & {
  title: Record<AppLanguage, string>;
  questions: Record<AppLanguage, string[]>;
};
