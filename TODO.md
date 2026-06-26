# Recoverse TODO

이 문서는 다음에 할 일과 보류한 결정만 추적한다. 끝낸 작업은 `git log`를 참고한다.

## 작업 규칙

- 한 번에 하나의 단계만 진행한다.
- 각 단계는 테스트 가능한 상태로 마감하고 커밋한다.
- 코드 변경 전에 현재 UX 흐름과 데이터 경계를 먼저 확인한다.
- 기존 `recoverse_reflections_v1` 백업과 가져오기 호환성을 깨지 않는다.
- 결정이 필요한 제품 범위만 사용자에게 묻고, 구현 세부는 코드베이스 패턴에 맞춰 진행한다.

## 현재 완료된 기반

- 회고 작성/감상/다시 보기/공유의 단일 흐름
- 같은 유형·기간 중복 생성 방지와 이어쓰기 진입
- URL 해시 기반 읽기 전용 공유
- 회고 백업/가져오기 (`recoverse_reflections_v1`)
- 언어(ko/en)와 테마(우주/편지방/지도) 전환
- 모바일 키보드 대응, 접근성 focus ring, 샘플 회고 미리보기
- Capsule/Galaxy/Observation 잔재 정리와 dead code 제거

## 다음 작업 후보

별도 결정이 필요하므로 진행 전 우선순위를 확인한다.

- [ ] 로그인 (Google / Kakao). 자세한 계약은 [ACCOUNT_STORAGE_PLAN.ko.md](./ACCOUNT_STORAGE_PLAN.ko.md).
- [ ] 계정 기반 클라우드 저장과 멀티 디바이스 동기화
- [ ] 서버 저장 기반 공유 링크 발행 (현재는 URL 해시만 지원)
- [ ] 접근 권한/비밀번호가 있는 공유 링크
- [ ] PDF 내보내기
- [ ] 실시간 그룹 협업 (`mode: with_friends`)
- [ ] 이미지/첨부파일 업로드
- [ ] Three.js 기반 3D 우주 화면

## 기본 검증 명령

프론트엔드 변경 후 기본적으로 아래를 실행한다.

```powershell
cd recoverse-frontend
node tests\recoverseStore.test.mjs
node node_modules\vue-tsc\bin\vue-tsc.js -b
node node_modules\vite\bin\vite.js build
```
