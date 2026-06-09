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
