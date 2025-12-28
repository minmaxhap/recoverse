# Recoverse (MVP)

종이 회고를 **한 사이트에서 모아 보기**,  
**질문 기준으로 연도별 답 비교**까지 할 수 있는 로컬 아카이브 MVP.

- Tech: Vue 3 + TypeScript + Vite
- Storage: LocalStorage (서버 없음)
- Backup: JSON export/import

---

## Features

### 1) 연도 아카이브 (노트북 UI)
- 노트북(데스크톱) 전용 **3열 레이아웃**
  - 좌: 연도 리스트
  - 중: 해당 연도의 질문 리스트
  - 우: 상세 보기 + 인라인 수정 폼

### 2) 질문별 연도 비교
- 같은 질문을 기준으로 연도별 답을 타임라인 카드로 표시
- 비교 화면에서 특정 연도 답을 바로 수정 화면으로 점프

### 3) 빠른 입력
- 질문 추천(입력된 질문 기반 question bank)
- 로컬 저장

### 4) 연도 생성(작년 질문 복제)
- 선택한 연도에 대해 `(선택연도-1)`의 질문들을 한 번에 복제
- 답은 빈칸으로 생성
- 이미 존재하는 질문은 자동 건너뜀(중복 생성 방지)

### 5) 백업/복원
- JSON 내보내기: 로컬 데이터를 파일로 백업
- JSON 가져오기: 백업 파일로 데이터 복원

---

## Project Setup

### Install
```bash
npm install
```
### Run (dev)
```bash
npm run dev
```
### Build
```bash
npm run build
npm run preview
```

### Data Model

ReviewEntry

type ReviewEntry = {
  id: string;
  year: number;      // ex) 2016~2024
  q: string;         // question text
  a: string;         // answer text
  createdAt: string; // ISO
};


### Storage key:

localStorage["recoverse_v1_entries"]

### Backup format:
{
  "schema": "recoverse_v1",
  "exportedAt": "2025-12-28T00:00:00.000Z",
  "entries": [ ... ]
}

### Folder Structure
src/
  App.vue                 # 노트북 UI(연도/질문/상세) + 비교/입력 탭
  lib/
    recoverseStore.ts     # LocalStorage CRUD + 질문은행 + 타임라인 + 백업/복원 + 작년 복제

### Notes / Decisions

서버 없이(LocalStorage) MVP를 먼저 완성한다.

질문은 텍스트 기반으로 저장한다.
질문이 연도별로 겹치거나 달라도 그대로 수용한다.

노트북 UI를 우선한다. (모바일 최적화는 추후)

### Troubleshooting
1) 데이터가 날아간 것 같아요

LocalStorage 기반이라 브라우저 데이터 삭제/시크릿 모드에서 데이터가 유지되지 않는다.
중요한 데이터는 반드시 JSON 내보내기로 백업한다.

2) JSON 가져오기가 실패해요

백업 파일 형식이 깨졌거나, entries 배열이 없으면 실패한다.
에러 메시지가 화면 상단에 표시된다.

### Roadmap
- 빈 답만 모아보기 / 진행률 표시
- 질문 정규화(유사 질문 묶기)
- 모바일 UI 버전