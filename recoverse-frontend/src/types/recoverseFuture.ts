// These draft types stay isolated from the active MVP model until galaxy/observation
// screens are wired into the app. This keeps current local capsule behavior stable.

export type GalaxyTheme =
  | "year"
  | "trip"
  | "project"
  | "relationship"
  | "career"
  | "custom";

export type Galaxy = {
  id: string;
  title: string;
  description?: string;
  theme: GalaxyTheme;
  createdAt: string;
  updatedAt: string;
};

export type GalaxyMember = {
  id: string;
  galaxyId: string;
  displayName: string;
  colorTone?: string;
  joinedAt: string;
};

export type GalaxyPrompt = {
  id: string;
  galaxyId: string;
  questionText: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type GalaxyLog = {
  id: string;
  galaxyId: string;
  promptId: string;
  memberId: string;
  answers: string[];
  updatedAt: string;
};

export type ObservationSnapshot = {
  id: string;
  sourceType: "planet" | "galaxy";
  sourceId: string;
  title: string;
  description?: string;
  accessMode: "read_only";
  createdAt: string;
  publishedAt?: string;
  records: ObservationRecordSnapshot[];
};

export type ObservationRecordSnapshot = {
  id: string;
  title: string;
  logs: string[];
  order: number;
};
