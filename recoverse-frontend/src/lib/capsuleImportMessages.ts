import type { AppLanguage } from "./recoverseStore";
import type { CapsuleImportPreview, CapsuleImportResult } from "../types/recoverse";
import { CAPSULE_IMPORT_ERROR } from "./capsuleImportExport";

export function buildImportPreviewMessage(
  preview: CapsuleImportPreview,
  language: AppLanguage
): string {
  const duplicates = preview.skippedCapsules + preview.skippedCards;
  if (language === "ko") {
    return [
      "가져오기 미리보기",
      `추가될 기억 행성: ${preview.addedCapsules}개`,
      `추가될 탐사 기록: ${preview.addedCards}개`,
      `중복: ${duplicates}개`,
      "계속 가져올까요?",
    ].join("\n");
  }

  return [
    "Import preview",
    `Memory planets to add: ${preview.addedCapsules}`,
    `Exploration records to add: ${preview.addedCards}`,
    `Duplicates: ${duplicates}`,
    "Continue importing?",
  ].join("\n");
}

export function buildImportResultMessage(
  result: CapsuleImportResult,
  language: AppLanguage
): string {
  const duplicates = result.skippedCapsules + result.skippedCards;
  const added = result.addedCapsules + result.addedCards;

  if (language === "ko") {
    if (added === 0) {
      return `가져오기 완료: 추가 0개 / 중복 건너뜀 ${duplicates}개 / 오류 0개`;
    }

    return `가져오기 완료: 추가 ${added}개(기억 행성 ${result.addedCapsules}개, 탐사 기록 ${result.addedCards}개) / 중복 건너뜀 ${duplicates}개 / 오류 0개`;
  }

  if (added === 0) {
    return `Import complete: added 0 / skipped duplicates ${duplicates} / errors 0.`;
  }

  return `Import complete: added ${added} (${result.addedCapsules} memory planets, ${result.addedCards} exploration records) / skipped duplicates ${duplicates} / errors 0.`;
}

export function buildCapsuleImportErrorMessage(
  err: unknown,
  language: AppLanguage,
  unknownError: string
): string {
  const message = err instanceof Error ? err.message : "";

  if (language === "ko") {
    if (message === CAPSULE_IMPORT_ERROR.invalidJson) {
      return "JSON 형식이 올바르지 않아요. Recoverse에서 내보낸 JSON 파일인지 확인해 주세요.";
    }
    if (message === CAPSULE_IMPORT_ERROR.unsupportedVersion) {
      return "지원하지 않는 백업 버전이에요. 최신 Recoverse 백업 파일을 사용해 주세요.";
    }
    if (message === CAPSULE_IMPORT_ERROR.unsupportedFormat) {
      return "Recoverse 백업 구조를 찾을 수 없어요. 기억 행성 백업 또는 기존 연도별 백업 파일인지 확인해 주세요.";
    }
  } else {
    if (message === CAPSULE_IMPORT_ERROR.invalidJson) {
      return "This is not valid JSON. Please check that it was exported from Recoverse.";
    }
    if (message === CAPSULE_IMPORT_ERROR.unsupportedVersion) {
      return "This backup version is not supported. Please use a recent Recoverse backup file.";
    }
    if (message === CAPSULE_IMPORT_ERROR.unsupportedFormat) {
      return "Recoverse backup data was not found. Please use a memory planet backup or legacy yearly backup file.";
    }
  }

  return err instanceof Error ? err.message : unknownError;
}
