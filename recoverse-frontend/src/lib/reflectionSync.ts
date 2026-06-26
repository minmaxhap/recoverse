import type { Reflection } from "../types/reflection";
import { normalizeReflection } from "./reflectionStore";

export type AccountStorageProvider = "google" | "kakao";
export type ReflectionSyncStatus = "local_only" | "syncing" | "synced" | "failed";

export type ReflectionSyncPayload = {
  schema: "recoverse_account_sync_v1";
  exportedAt: string;
  source: "local_browser";
  provider?: AccountStorageProvider;
  reflections: Reflection[];
};

export type AccountStorageAdapter = {
  provider: AccountStorageProvider;
  push(payload: ReflectionSyncPayload): Promise<{ remoteRevision: string }>;
  pull(): Promise<ReflectionSyncPayload>;
};

export function buildReflectionSyncPayload(
  reflections: Reflection[],
  provider?: AccountStorageProvider
): ReflectionSyncPayload {
  const normalized = reflections
    .map((reflection) => normalizeReflection(reflection))
    .filter(Boolean) as Reflection[];

  return {
    schema: "recoverse_account_sync_v1",
    exportedAt: new Date().toISOString(),
    source: "local_browser",
    provider,
    reflections: normalized,
  };
}

export function getAccountSaveUnavailableMessage(provider: AccountStorageProvider): string {
  const label = provider === "google" ? "Google" : "Kakao";
  return `${label} 계정 저장은 아직 연결 전이에요. 지금은 회고 백업 파일로 보관할 수 있어요.`;
}

export function getLocalOnlyStorageWarning(reflectionCount: number): string {
  if (reflectionCount <= 0) {
    return "아직 저장할 회고가 없어요.";
  }

  return "현재 회고는 이 브라우저에 임시 저장되어 있어요. 브라우저 데이터가 삭제되면 사라질 수 있으니 백업 파일을 보관해 주세요.";
}
