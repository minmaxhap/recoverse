# Recoverse 계정 저장 설계

## 목적

Recoverse의 기준 데이터는 `Reflection`이다. 계정 저장은 로컬 임시 저장을 서버 저장으로 바꾸는 작업이 아니라, `recoverse_reflections_v1` 데이터를 계정 단위로 안전하게 동기화하는 작업이다.

## 현재 상태

- 사용자는 로그인 없이 회고를 작성할 수 있다.
- 작성 데이터는 `localStorage["recoverse_reflections_v1"]`에 저장된다.
- 백업 파일 schema는 `recoverse_reflections_v1`이다.
- Google/Kakao 버튼은 아직 실제 OAuth와 서버 저장에 연결되어 있지 않다.
- 계정 저장 버튼을 누르면 현재는 백업 파일 저장을 안내한다.

## 동기화 계약

프론트엔드는 서버 제공자와 직접 결합하지 않고 `ReflectionSyncPayload`를 만든다.

```ts
type ReflectionSyncPayload = {
  schema: "recoverse_account_sync_v1";
  exportedAt: string;
  source: "local_browser";
  provider?: "google" | "kakao";
  reflections: Reflection[];
};
```

서버 어댑터는 아래 계약만 만족하면 된다.

```ts
type AccountStorageAdapter = {
  provider: "google" | "kakao";
  push(payload: ReflectionSyncPayload): Promise<{ remoteRevision: string }>;
  pull(): Promise<ReflectionSyncPayload>;
};
```

## 서버 저장 원칙

- 서버의 1차 테이블은 `Reflection`이다.
- 서버 저장 전 로컬 백업을 유지한다.
- 같은 `reflection.id`가 있을 때는 `updatedAt`이 최신인 항목을 우선한다.
- 삭제 동기화는 별도 `deletedAt` 필드가 생기기 전까지 자동 삭제하지 않는다.

## 권장 백엔드 선택지

### Supabase

- 장점: Postgres, Row Level Security, OAuth provider 관리가 쉽다.
- 적합한 이유: `Reflection` JSONB 저장과 사용자별 조회가 단순하다.
- 추천도: 높음.

### Firebase

- 장점: Google 로그인과 문서 저장이 빠르다.
- 단점: Kakao 연동은 별도 처리가 필요하고 데이터 쿼리 설계를 주의해야 한다.
- 추천도: 중간.

### 직접 백엔드

- 장점: Kakao/Google 정책과 데이터 모델을 완전히 통제할 수 있다.
- 단점: 인증, 토큰, 배포, 보안 작업이 커진다.
- 추천도: MVP 이후.

## 다음 구현 순서

1. 백엔드 후보를 하나 고른다. MVP는 Supabase를 기본 후보로 둔다.
2. `users`와 `reflections` 저장 구조를 만든다.
3. OAuth 로그인 후 로컬 `Reflection`을 서버에 push한다.
4. 로그인 사용자는 앱 시작 시 서버 데이터를 pull하고 로컬과 병합한다.
5. 저장 상태 UI를 `임시 저장 / 백업됨 / 계정 저장됨 / 동기화 실패`로 나눈다.

## 아직 하지 않는 것

- 친구 공유 링크 발행
- 실시간 그룹 동기화
- 서버 삭제 동기화
