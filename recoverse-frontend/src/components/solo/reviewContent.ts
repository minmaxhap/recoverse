export const REVIEW_LENS_IDS = [
  'diary',
  'content',
  'doodle',
  'meal',
  'spending',
  'experience',
  'people',
  'work',
  'conversation',
  'place',
  'photo',
  'routine',
] as const;

export type ReviewLensId = (typeof REVIEW_LENS_IDS)[number];

export const REVIEW_SCOPE_TYPES = [
  'today',
  'recent',
  'week',
  'month',
  'year',
  'trip',
  'project',
  'relationship',
  'custom',
] as const;

export type ReviewScopeType = (typeof REVIEW_SCOPE_TYPES)[number];
export type SoloMode = 'quick' | 'review' | 'free';

export type ReviewLensDefinition = {
  readonly id: ReviewLensId;
  readonly title: string;
  readonly promise: string;
  readonly sourceHints: readonly string[];
  readonly selectionPrompt: string;
  readonly reflectionPrompt: string;
};

export type ReviewItemDraft = {
  readonly id: string;
  readonly label: string;
  readonly note: string;
};

export type ReviewDraft = {
  readonly phase: 'lens' | 'context' | 'items' | 'complete';
  readonly lensId: ReviewLensId | '';
  readonly scopeType: ReviewScopeType;
  readonly scopeLabel: string;
  readonly items: readonly ReviewItemDraft[];
};

export const REVIEW_SCOPES = [
  { id: 'recent', label: '요즘' },
  { id: 'today', label: '오늘' },
  { id: 'week', label: '이번 주' },
  { id: 'month', label: '이번 달' },
  { id: 'year', label: '올해' },
  { id: 'trip', label: '여행' },
  { id: 'project', label: '프로젝트' },
  { id: 'relationship', label: '관계' },
  { id: 'custom', label: '직접 정하기' },
] as const satisfies readonly { readonly id: ReviewScopeType; readonly label: string }[];

export const REVIEW_LENSES = [
  {
    id: 'diary', title: '일기', promise: '예전에 쓴 문장을 지금의 눈으로 다시 봐요.',
    sourceHints: ['최근 일기와 메모를 직접 펼쳐보세요.'],
    selectionPrompt: '다시 읽고 싶은 문장이나 기록', reflectionPrompt: '지금 보니 무엇이 달라 보이나요?',
  },
  {
    id: 'content', title: '콘텐츠', promise: '보고 들은 것 중 아직 남아 있는 장면을 골라요.',
    sourceHints: ['최근 본 책, 영상, 음악 목록을 직접 살펴보세요.'],
    selectionPrompt: '기억에 남은 작품이나 장면', reflectionPrompt: '무엇이 마음에 붙잡혀 있나요?',
  },
  {
    id: 'doodle', title: '메모·낙서', promise: '무심코 남긴 흔적에서 반복되는 관심을 찾아요.',
    sourceHints: ['종이 메모와 메모 앱의 끄적임을 직접 펼쳐보세요.'],
    selectionPrompt: '눈에 걸리는 낙서나 메모', reflectionPrompt: '어떤 모양이나 생각이 반복되나요?',
  },
  {
    id: 'meal', title: '식사', promise: '먹은 것과 그때의 기분을 장면으로 남겨요.',
    sourceHints: ['최근 식사, 간식, 함께 먹은 사람을 떠올려보세요.'],
    selectionPrompt: '기억나는 끼니나 맛', reflectionPrompt: '맛과 상황에서 무엇이 남았나요?',
  },
  {
    id: 'spending', title: '소비', promise: '산 것보다 만족과 아쉬움이 생긴 조건을 봐요.',
    sourceHints: ['결제 내역, 주문 기록, 장바구니를 직접 열어보세요.'],
    selectionPrompt: '만족하거나 아쉬웠던 지출', reflectionPrompt: '어떤 점이 기대와 같거나 달랐나요?',
  },
  {
    id: 'experience', title: '경험', promise: '해본 일에서 예상과 실제의 차이를 꺼내요.',
    sourceHints: ['최근 다녀온 행사와 처음 해본 일을 떠올려보세요.'],
    selectionPrompt: '다시 떠오르는 경험', reflectionPrompt: '예상과 실제는 어떻게 달랐나요?',
  },
  {
    id: 'people', title: '사람', promise: '누군가를 평가하지 않고 만남의 조건을 살펴봐요.',
    sourceHints: ['최근 만난 사람과 함께 있었던 장면을 떠올려보세요.'],
    selectionPrompt: '기억에 남은 만남', reflectionPrompt: '편안함이나 거리감은 어디서 생겼나요?',
  },
  {
    id: 'work', title: '업무', promise: '잘 풀린 일과 막힌 일의 조건을 구체적으로 봐요.',
    sourceHints: ['캘린더, 이슈, 커밋, 메일, 업무 메모를 직접 살펴보세요.'],
    selectionPrompt: '남아 있는 업무 장면', reflectionPrompt: '무엇이 잘 작동하거나 막히게 했나요?',
  },
  {
    id: 'conversation', title: '대화', promise: '남은 말과 침묵을 한 장면씩 돌아봐요.',
    sourceHints: ['메신저, 문자, 대화 뒤 적은 메모를 직접 살펴보세요.'],
    selectionPrompt: '남아 있는 말이나 반응', reflectionPrompt: '그 장면이 왜 아직 남아 있나요?',
  },
  {
    id: 'place', title: '장소', promise: '머문 곳이 몸과 기분을 어떻게 바꿨는지 봐요.',
    sourceHints: ['사진, 지도 기록, 예약 내역, 영수증을 직접 살펴보세요.'],
    selectionPrompt: '다시 가고 싶거나 피하고 싶은 장소', reflectionPrompt: '그곳에서 무엇이 달라졌나요?',
  },
  {
    id: 'photo', title: '사진', promise: '프레임 안팎에 남은 장면을 골라요.',
    sourceHints: ['사진첩, 스크린샷, 공유받은 사진을 직접 펼쳐보세요.'],
    selectionPrompt: '다시 보고 싶은 사진', reflectionPrompt: '사진 밖에서 함께 기억나는 것은 무엇인가요?',
  },
  {
    id: 'routine', title: '루틴', promise: '이어진 날과 끊긴 날의 조건을 비교해요.',
    sourceHints: ['최근 반복한 하루와 멈춘 습관을 떠올려보세요.'],
    selectionPrompt: '잘 이어졌거나 끊긴 반복', reflectionPrompt: '이어지거나 끊기게 한 조건은 무엇인가요?',
  },
] as const satisfies readonly ReviewLensDefinition[];

export function createEmptyReviewDraft(): ReviewDraft {
  return {
    phase: 'lens',
    lensId: '',
    scopeType: 'recent',
    scopeLabel: '',
    items: [{ id: crypto.randomUUID(), label: '', note: '' }],
  };
}

export function scopeDisplayName(scopeType: ReviewScopeType, scopeLabel: string): string {
  if (scopeType === 'custom' && scopeLabel.trim()) return scopeLabel.trim();
  return REVIEW_SCOPES.find((scope) => scope.id === scopeType)?.label ?? '요즘';
}
