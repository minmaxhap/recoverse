# Recoverse Mobile Design Bible

이 문서는 Recoverse의 새 모바일 디자인 기준이다. 기존 우주/갤럭시 메타포를 폐기하고, **Story Book x Time Capsule** 방향으로 제품 언어를 통일한다. 구현 전환은 루트의 [DESIGN.md](./DESIGN.md)를 단일 토큰 소스로 삼는다.

## 1. 디자인 원칙

- **책의 구조**: 홈, 앨범, 상세는 책장과 페이지처럼 연결된다. 목록은 로그가 아니라 목차처럼 읽힌다.
- **타임캡슐 감성**: 작성 완료와 저장은 단순 성공 상태가 아니라 봉인되는 순간이다. 편지, 봉투, 왁스 실링, 스탬프가 핵심 은유다.
- **따뜻한 무드**: 크림과 종이색을 기본으로 하되 세이지, 스카이, 블러시, 왁스, 에스프레소를 함께 사용한다.
- **쉽고 빠른 시작**: 첫 행동은 30초 회고다. 감성적인 화면이어도 시작 CTA와 작성 경로는 명확해야 한다.

## 2. 핵심 컨셉

```text
오래된 책 속 한 페이지처럼,
나에게 보내는 편지를 기록하고
시간이 지난 뒤 다시 열어보는 경험
```

대표 문장:

```text
30초면 충분해요.
질문에 답하다 보면 오늘 하루도, 여행도, 연말도 하나의 추억이 됩니다.
```

피해야 할 방향:

- 우주, 행성, 갤럭시, 네온 중심의 시각 정체성
- 통계 대시보드처럼 보이는 홈
- 기능 설명이 먼저 보이는 온보딩
- SNS 피드, 댓글, 좋아요 중심 UI
- 과한 3D, 게임 HUD, 강한 그라데이션

## 3. 컬러 토큰

| 역할 | 토큰 | 값 | 사용처 |
| --- | --- | --- | --- |
| Surface/Base | `--surface-base` | `#FBF4EC` | 전체 배경 |
| Surface/Paper | `--surface-paper` | `#FFFDF8` | 앱 화면, 편지지 |
| Surface/Parchment | `--surface-parchment` | `#EFE6D6` | 카드, 앨범 타일 |
| Surface/Sage | `--surface-sage` | `#DDE5D8` | 선택 상태, 회고 패널 |
| Surface/Blue | `--surface-blue` | `#D9E4E6` | 여행, 사진, 정보 보조 |
| Surface/Blush | `--surface-blush` | `#EAD7CF` | 감정 강조 |
| Text/Primary | `--text-primary` | `#2F261F` | 제목, 본문 |
| Text/Secondary | `--text-secondary` | `#75695F` | 설명, 보조 정보 |
| Text/Tertiary | `--text-tertiary` | `#A99A8B` | 비활성, 메타 |
| Border/Subtle | `--border-subtle` | `#E5D9C8` | 종이 경계선 |
| Border/Strong | `--border-strong` | `#CABCA8` | 입력, 선택 |
| Accent/Espresso | `--accent-espresso` | `#3A312B` | 주 CTA, 브랜드 잉크 |
| Accent/Sage | `--accent-sage` | `#6F7F6B` | 작성, 선택, 활성 |
| Accent/Wax | `--accent-wax` | `#8E4E38` | 완료, 봉인, 경고 |
| Accent/Sky | `--accent-sky` | `#7598A1` | 여행, 정보 |

규칙:

- 에스프레소는 주 행동에만 사용한다.
- 왁스 컬러는 완료와 봉인 맥락에 우선 배정한다.
- 세이지는 선택과 회고 상태를 표현한다.
- 회색 테두리와 차가운 블랙 그림자는 사용하지 않는다.

## 4. 타이포그래피

| 레벨 | 크기 | 굵기 | 행간 | 사용처 |
| --- | --- | --- | --- | --- |
| Display | 40px | 600 | 1.18 | Splash, 주요 브랜드 문장 |
| H1 | 32px | 600 | 1.22 | 화면 제목 |
| H2 | 24px | 600 | 1.32 | 섹션 제목 |
| H3 | 19px | 600 | 1.45 | 카드 제목 |
| Body/Large | 17px | 400 | 1.7 | 감성 설명 |
| Body | 15px | 400 | 1.65 | 기본 본문 |
| Body/Small | 13px | 400 | 1.55 | 메타, 설정 행 |
| Caption | 11px | 600 | 1.35 | 라벨, 오버라인 |

폰트 스택:

- 제목/회고 문장: `"Noto Serif KR", "Batang", Georgia, serif`
- 본문/UI: `"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`
- 코드/토큰: `"SFMono-Regular", "Cascadia Mono", Consolas, monospace`

규칙:

- 한글 제목은 `word-break: keep-all`을 기본으로 한다.
- 제목이 4줄 이상 밀리면 크기를 줄인다.
- 본문은 모바일에서 13px 아래로 내리지 않는다.

## 5. 여백과 레이아웃

기준 단위는 4px이다.

| 토큰 | 값 | 사용처 |
| --- | --- | --- |
| `--space-1` | 4px | 아이콘과 라벨 |
| `--space-2` | 8px | 칩, 짧은 그룹 |
| `--space-3` | 12px | 입력, 리스트 행 |
| `--space-4` | 16px | 카드 기본 패딩 |
| `--space-5` | 20px | 모바일 섹션 |
| `--space-6` | 24px | 화면 좌우 안전 여백 |
| `--space-8` | 32px | 큰 그룹 간격 |
| `--space-10` | 40px | 문서 섹션 |
| `--space-12` | 48px | 주요 화면 전환 |
| `--space-16` | 64px | 히어로, 큰 문서 리듬 |

모바일 기준:

- 기준 아트보드: 390 x 844
- 화면 좌우 여백: 20-24px
- 하단 탭 높이: 68-76px
- 버튼 최소 터치 영역: 44px
- 카드 radius: 8-22px

## 6. 컴포넌트

### Phone Frame

- 상태바, 상단 브랜드, 화면 콘텐츠, 선택적 하단 탭으로 구성한다.
- 모든 화면 제목은 실제 텍스트로 둔다.
- 프레임 내부 콘텐츠가 잘리면 화면 설계를 수정한다.

### Button

- Primary: 에스프레소 배경, 종이색 텍스트, 48px 이상 높이.
- Secondary: 종이 배경, 따뜻한 테두리.
- Floating/Sage: 작성 또는 선택 강조용.
- 상태: hover, active, focus, disabled, loading.

### Memory Card

- overline, 회고 문장, 선택적 스탬프/사진 조각으로 구성한다.
- 카드마다 고정된 높이 또는 명확한 aspect-ratio를 가진다.
- 카드 내용은 이미지가 아니라 실제 텍스트로 렌더링한다.

### Letter Input

- 질문, 편지지 입력 영역, 글자 수/자동 저장 메타로 구성한다.
- 줄이 있는 종이 질감을 사용할 수 있지만 대비를 해치지 않는다.

### Bottom Navigation

- 기본 항목: 나의 책고, 작성하기, 둘러보기 또는 앨범, 작성, 설정.
- 활성 상태는 색상만이 아니라 배경 또는 위치 변화로도 구분한다.

### Seal Badge

- 완료, 저장, 비공개 봉인 상태에 사용한다.
- 완료 화면의 중심 브랜드 모션이다.

## 7. 아이콘과 일러스트 스타일

아이콘:

- 1.5-1.75px 선 두께
- 둥근 stroke linecap
- 책, 펜, 봉투, 별, 사람, 달력, 지도, 설정, 자물쇠, 알림을 기본 세트로 한다.
- 이모지는 사용하지 않는다.

일러스트:

- 책, 편지, 봉투, 우표, 왁스 실링, 사진 조각만 사용한다.
- 장면은 작고 촉감 있게, 제품 정서보다 커지지 않는다.
- 배경 장식용 오브젝트가 CTA나 입력을 가리면 실패다.

## 8. 모션

| 타입 | 시간 | easing | 사용처 |
| --- | --- | --- | --- |
| Micro | 120ms | `cubic-bezier(0.2, 0, 0, 1)` | 버튼 press, toggle |
| Standard | 220ms | `cubic-bezier(0.16, 1, 0.3, 1)` | 카드 hover, 탭 전환 |
| Emphasis | 520ms | `cubic-bezier(0.19, 1, 0.22, 1)` | Splash, 완료 seal |
| Stagger | 80ms delay | Emphasis easing | 앨범/질문 등장 |

규칙:

- `transform`, `opacity`, 짧은 `filter`만 애니메이션한다.
- `width`, `height`, `top`, `left`, `margin`, `padding`은 애니메이션하지 않는다.
- `prefers-reduced-motion`에서는 이동을 제거하고 opacity 중심으로 유지한다.

## 9. 핵심 화면 세트

구현 목표 화면은 다음 12개다.

1. Splash
2. Home
3. 회고 시작
4. 질문 작성
5. 작성 완료
6. 회고 앨범
7. 회고 상세
8. 연말 회고
9. 여행 회고
10. 친구 비교
11. 설정
12. 디자인 시스템

## 10. 구현 전환 규칙

- `HomeUniverseView`의 우주 메타포는 Home/회고 앨범 방향으로 교체한다.
- 기존 `Reflection` 데이터 구조와 `recoverse_reflections_v1` 저장 키는 유지한다.
- 테마는 당장 여러 개를 유지하기보다 새 기본 테마 `book-capsule`을 먼저 완성한다.
- 계정 저장, 백업, 공유 계약은 변경하지 않는다.
- UI 구현 전에 [DESIGN.md](./DESIGN.md)와 이 문서의 토큰을 CSS 변수로 먼저 정리한다.
