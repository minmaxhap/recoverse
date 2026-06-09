# Recoverse 아키텍처

## 현재 방향

Recoverse는 Vue 3 기반의 localStorage 우선 MVP다.

제품 구조는 캡슐 중심이다.

```text
캡슐 -> 질문 카드 -> 답변
```

## 핵심 엔티티

### Capsule

기억을 묶는 최상위 단위다.

### CapsuleCard

캡슐 안의 질문 카드와 답변 목록을 가진다.

### CapsuleBackup

JSON 백업과 가져오기의 기준 포맷이다.

## 저장소

현재 저장 키:

```text
localStorage["recoverse_capsule_v1"]
```

기존 연도 기반 데이터는 연도 회고 캡슐로 변환할 수 있어야 한다.

## 현재 주요 파일

```text
recoverse-frontend/src/App.vue
recoverse-frontend/src/components/CapsuleProgress.vue
recoverse-frontend/src/components/CapsuleQuestionCompare.vue
recoverse-frontend/src/lib/recoverseStore.ts
recoverse-frontend/tests/recoverseStore.test.mjs
```

## 향후 구조

```text
src/
  views/
    HomeView.vue
    CapsuleDetailView.vue
  components/
    HomeRediscoverCard.vue
    CapsuleCard.vue
    AnswerEditor.vue
    ImportExportPanel.vue
  lib/
    recoverseStore.ts
    capsuleImportExport.ts
    capsuleTemplates.ts
  types/
    recoverse.ts
```

## 공유 확장 방향

공유는 MVP 범위 밖이다. 나중에 읽기 전용 스냅샷과 비밀번호 링크를 별도 구조로 추가한다.

## 읽기 전용 공유 데이터 모델 초안

공유 데이터는 원본 `CapsuleData`를 직접 노출하지 않고, 공유 시점의 스냅샷으로 분리한다.

```ts
type SharedCapsuleSnapshot = {
  id: string;
  sourceCapsuleId: string;
  title: string;
  description?: string;
  visibility: "private" | "link";
  accessMode: "read_only";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  cards: SharedCapsuleCardSnapshot[];
};

type SharedCapsuleCardSnapshot = {
  id: string;
  sourceCardId: string;
  questionText: string;
  answers: string[];
  order: number;
};
```

원칙:

- 공유 스냅샷은 읽기 전용이다.
- 원본 캡슐을 수정해도 기존 공유본은 자동 변경하지 않는다.
- 공유본 갱신은 사용자가 명시적으로 다시 발행할 때만 수행한다.
- 나중에 서버 저장소를 도입하면 `sourceCapsuleId`와 `sourceCardId`로 원본과 연결한다.

## 비밀번호 링크 공유 필드 후보

비밀번호 링크 공유는 서버 저장소 도입 이후에 구현한다. MVP에서는 구현하지 않는다.

```ts
type ShareLink = {
  id: string;
  snapshotId: string;
  slug: string;
  visibility: "password_link";
  passwordHash?: string;
  passwordSalt?: string;
  expiresAt?: string;
  revokedAt?: string;
  createdAt: string;
  lastOpenedAt?: string;
  openCount: number;
};
```

필드 원칙:

- 비밀번호 원문은 저장하지 않는다.
- `slug`는 URL에 노출되는 식별자이고, 원본 캡슐 ID를 포함하지 않는다.
- `expiresAt`과 `revokedAt`으로 공유 링크를 닫을 수 있게 한다.
- `openCount`와 `lastOpenedAt`은 나중에 공유 상태 표시용으로만 사용한다.
- 초기 공유 권한은 `read_only`만 허용한다.
