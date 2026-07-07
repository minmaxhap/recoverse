/**
 * 다시 발견의 질문 그룹핑 키 — 공백·문장부호 제거 + 소문자.
 * "올해 가장 잘한 선택은?" ≡ "올해, 가장 잘한 선택은…"
 */
export function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[\s?.!,~…·'"'"‘’“”()\[\]{}<>:;\-—–_/\\]+/g, '');
}
