# Recoverse 재설계 계획

## 목표

Recoverse를 새로 설계하되 기존 사용자의 회고 데이터는 깨지지 않게 유지한다.
첫 기준은 “더 큰 기능”이 아니라 “흐름을 다시 만들 수 있는 경계”다.

## 잠긴 데이터 경계

아래 계약은 재설계 중에도 유지한다.

| 경계 | 계약 |
| --- | --- |
| 로컬 저장 | `recoverse_reflections_v1` 키와 `Reflection[]` 구조 |
| 백업/가져오기 | `recoverse_reflections_v1` 백업 스키마와 병합 규칙 |
| 공유 링크 | `#share=` URL 해시와 `recoverse_shared_reflection_v1` 스냅샷 |
| 설정 | `recoverse_language`, `recoverse_theme` |
| 계정 저장 준비 | `recoverse_account_sync_v1` 페이로드 |

## 설계 원칙

- 새 의존성은 실제 병목이 생길 때만 추가한다.
- `App.vue`는 화면 조립과 전역 액션만 맡기고, 순수 판단 로직은 `src/lib`로 뺀다.
- `src/lib`와 `src/data`는 Vue, DOM, 컴포넌트에 의존하지 않는다.
- 사용자 흐름은 `홈 -> 작성 -> 상세 -> 다시 보기 -> 공유/설정`의 단일 축을 유지한다.
- 각 단계는 테스트 가능한 작은 커밋으로 끝낸다.

## 단계

### 0단계: 경계 고정

- 완료: 데이터 저장/백업/공유/동기화 준비 모듈을 기존 테스트로 보호한다.
- 완료: 앱 내비게이션 모드와 하단 탭 판단을 `src/lib/appNavigation.ts`로 분리한다.

### 1단계: 앱 셸 재구성

- `App.vue`의 책임을 화면 조립, 전역 저장 액션, 공유 액션으로 줄인다.
- 히스토리와 해시 공유 처리를 순수 헬퍼로 분리한다.
- 상단/하단 내비게이션은 `AppShell` 후보로 묶되, 컴포넌트 추가는 중복이 줄 때만 한다.

### 2단계: 작성 흐름 재구성

- 새 회고 wizard, 질문 작성, 검토/완료를 하나의 작성 흐름으로 정리한다.
- 대표 문장과 대표 감정이 홈/상세/다시 보기에서 같은 의미로 쓰이게 한다.
- 기존 `Reflection` 구조를 그대로 저장한다.

### 3단계: 홈과 다시 보기 재구성

- 홈은 기억 오브젝트와 미리보기 중심으로 유지한다.
- 다시 보기는 기억 목록, 같은 질문 타임라인, 공유 진입을 분리한다.
- 시각화는 CSS 우선으로 유지하고 Three.js는 별도 제품 결정 전까지 보류한다.

### 4단계: 저장 확장 준비

- Google/Kakao 저장 유도 문구와 `recoverse_account_sync_v1` 페이로드를 연결한다.
- 실제 OAuth와 서버 저장은 별도 백엔드 계약이 생긴 뒤 진행한다.

## 검증 기준

프론트엔드 변경 후 기본 검증은 항상 아래 세 가지다.

```powershell
cd recoverse-frontend
node tests\recoverseStore.test.mjs
node node_modules\vue-tsc\bin\vue-tsc.js -b
node node_modules\vite\bin\vite.js build
```

동작 변경이 있는 화면 작업은 브라우저에서 최소한 빈 홈, 샘플 회고, 작성, 상세, 다시 보기, 공유 해시를 확인한다.
