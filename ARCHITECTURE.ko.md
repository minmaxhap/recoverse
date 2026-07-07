# Recoverse 아키텍처

## 개요

Recoverse는 현재 서버 없는 프론트엔드 MVP입니다.

- Framework: Vue 3
- Language: TypeScript
- Build: Vite
- Package manager: pnpm
- Persistence: browser `localStorage`
- Backup: JSON file export/import
- Share: URL hash 기반 read-only snapshot

## 핵심 데이터 경계

### 회고 저장

`recoverse-frontend/src/lib/reflectionStore.ts`

- `loadReflections`
- `saveReflections`
- `normalizeReflection`
- `createReflectionDraft`
- `saveReflectionAnswer`

모든 회고 데이터는 `localStorage["recoverse_reflections_v1"]`에 저장됩니다.

### 백업

`recoverse-frontend/src/lib/reflectionBackup.ts`

- schema: `recoverse_reflections_v1`
- export: 현재 Reflection 배열을 JSON Blob으로 생성
- import: JSON parse 후 Reflection 정규화
- 방어 로직: 전체 텍스트 길이, reflection 수, question/answer 수, 긴 텍스트 필드 제한
- 병합 판단: `updatedAt` 문자열 비교가 아니라 `Date.parse` 기반 timestamp 비교

### 공유

`recoverse-frontend/src/lib/reflectionShare.ts`

- schema: `recoverse_shared_reflection_v1`
- URL hash prefix: `#share=`
- 공개 질문 중 사용자가 선택한 답변만 snapshot으로 encode
- 방어 로직: encoded hash 길이, decoded JSON byte 수, item 수, 개별 텍스트 길이 제한

공유 snapshot은 암호화가 아닙니다. 링크를 가진 사람은 선택된 내용을 읽을 수 있습니다.

## 보안 모델

현재 Recoverse는 로컬 우선 MVP입니다.

- 서버가 없으므로 서버 DB 유출 위험은 없습니다.
- localStorage 평문 저장이므로 XSS, 악성 확장 프로그램, 공유 브라우저 프로필에는 취약합니다.
- URL hash는 HTTP request에 포함되지 않지만, 사용자가 링크를 복사/공유하면 선택된 답변이 링크 안에 포함됩니다.
- 백업 JSON은 사용자 파일 입력이므로 크기와 구조 제한을 둡니다.

자세한 내용은 [SECURITY.md](./SECURITY.md)를 봅니다.

## 검증 명령

```bash
cd recoverse-frontend
pnpm test
pnpm run build
pnpm audit --prod
```
