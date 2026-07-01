import type {
  QuestionGroup,
  ReflectionQuestionSetMode,
  ReflectionTemplate,
  ReflectionTemplateGroup,
  ReflectionTemplateQuestion,
} from "../types/reflection";

const commonHint = "짧게 적어도 괜찮아요. 나중에 다시 읽을 때 장면이 떠오를 만큼만 남겨보세요.";

const questionHints: Record<string, string> = {
  year_place: "사진첩을 넘기듯 올해 자주 갔거나 오래 머문 장소 하나를 떠올려보세요.",
  year_food: "누구와 먹었는지, 그때의 분위기까지 한 줄로 붙이면 기억이 더 선명해져요.",
  year_song: "많이 들은 이유나 그 노래가 붙어 있는 계절을 함께 적어보세요.",
  year_scene_best_day: "날짜가 정확하지 않아도 좋아요. 그날의 빛, 사람, 기분 중 하나부터 시작하세요.",
  year_thankful_person: "큰 사건보다 마음이 놓였던 말이나 행동을 떠올려보세요.",
  year_new_connection: "새 친구, 동료, 동네 가게처럼 올해 새로 생긴 관계를 적어보세요.",
  year_content: "영화, 책, 유튜브, 게임처럼 자주 꺼내 본 콘텐츠와 좋아한 이유를 적어보세요.",
  year_phrase: "자주 말했거나 주변에서 반복해서 들었던 말을 떠올려보세요.",
  year_changed: "습관, 관계, 하루 리듬처럼 작지만 이전과 달라진 것을 적어보세요.",
  year_achievement: "남에게 설명하기 큰 성취가 아니어도 좋아요. 내가 해냈다고 느낀 일을 고르세요.",
  year_difficult: "아직 정리되지 않았다면 사건 이름만 적어도 충분해요.",
  year_thought: "올해 머릿속을 자주 맴돈 걱정, 질문, 다짐 중 하나를 적어보세요.",
  year_bright_day: "웃음이 쉬웠던 시간이나 마음이 가벼워졌던 장면부터 적어보세요.",
  year_one_word: "정답보다 별명이 좋아요. 올해에 붙이고 싶은 단어 하나를 골라보세요.",
  year_next_me: "응원, 부탁, 경고 중 지금의 내가 1년 뒤에 넣고 싶은 말을 남겨보세요.",
  year_jan_first: "올해를 시작하던 나에게 알려주고 싶은 것 한 가지를 적어보세요.",
  travel_first_scene: "공항, 이동, 숙소, 골목처럼 제일 먼저 떠오르는 화면을 그대로 묘사해보세요.",
  travel_sense: "맛, 소리, 햇빛, 냄새처럼 몸이 먼저 기억하는 감각을 적어보세요.",
  travel_unexpected: "계획과 달랐지만 기억에 남은 일, 의외로 좋았던 시간을 떠올려보세요.",
  travel_main_emotion: "즐거움, 설렘, 외로움처럼 가장 오래 남은 감정 하나부터 적어보세요.",
  travel_after_feeling: "돌아온 뒤 계속 남아 있던 여운, 아쉬움, 다시 가고 싶은 마음을 적어보세요.",
  travel_people: "같이 간 사람뿐 아니라 여행 중 스친 사람이나 대화도 좋아요.",
  travel_meaning: "그때의 나에게 필요했던 것, 전환점, 작은 해방감을 붙여보세요.",
  period_scene: "그 시기를 대표하는 하루나 장소 하나를 골라 짧게 남겨보세요.",
  period_place: "집, 회사, 학교, 산책길처럼 오래 머문 공간과 그 이유를 적어보세요.",
  period_self_word: "그 시기의 나에게 붙일 별명이나 상태를 적어보세요.",
  period_thought: "자주 떠오른 고민, 기대, 질문을 한 문장으로 남겨보세요.",
  period_changed: "생활 패턴, 마음가짐, 관계처럼 전후가 달라진 지점을 적어보세요.",
  period_future_message: "그 시기를 지나온 나에게 남기고 싶은 격려나 메모를 적어보세요.",
  life_self_word: "그 나이의 나를 한 사람처럼 소개한다면 어떤 모습이었는지 적어보세요.",
  life_choice: "큰 결정이 아니어도 좋아요. 방향을 바꾼 작은 선택을 떠올려보세요.",
  life_people: "오래 곁에 남았거나 지금의 나에게 영향을 준 관계를 떠올려보세요.",
  life_taste: "음악, 취미, 일하는 방식처럼 지금까지 남은 취향의 시작을 적어보세요.",
  life_release: "후회하지만 이제는 조금 다르게 볼 수 있는 마음을 적어보세요.",
  life_next_message: "다음 챕터의 내가 잊지 않았으면 하는 태도나 약속을 남겨보세요.",
};

function q(
  id: string,
  groupId: string,
  text: string,
  topic: ReflectionTemplateQuestion["topic"],
  modes: ReflectionQuestionSetMode[],
  visibility: ReflectionTemplateQuestion["visibility"] = "public"
): ReflectionTemplateQuestion {
  return {
    id,
    groupId,
    text,
    hint: questionHints[id] ?? commonHint,
    isRepeatable: modes.includes("compare"),
    visibility,
    topic,
    modes,
  };
}

export const reflectionTemplates: ReflectionTemplate[] = [
  {
    id: "template_year",
    type: "year",
    label: "연말 회고",
    periodPlaceholder: "2026년",
    groups: [
      {
        id: "year_scene",
        label: "올해의 장면",
        questions: [
          q("year_place", "year_scene", "올해 가장 기억에 남는 장소는?", "scene", ["light", "deep", "share", "compare"]),
          q("year_food", "year_scene", "올해 가장 좋았던 음식이나 카페는?", "scene", ["light", "deep", "share", "compare"]),
          q("year_song", "year_scene", "올해의 노래는?", "taste", ["deep", "share", "compare"]),
          q("year_scene_best_day", "year_scene", "올해 가장 좋았던 하루는?", "scene", ["deep", "share"]),
        ],
      },
      {
        id: "year_people",
        label: "올해의 사람",
        questions: [
          q("year_thankful_person", "year_people", "올해 고마웠던 사람은?", "people", ["light", "deep", "share", "compare"]),
          q("year_new_connection", "year_people", "올해 새로 만난 인연은?", "people", ["deep", "share"]),
        ],
      },
      {
        id: "year_taste",
        label: "올해의 취향",
        questions: [
          q("year_content", "year_taste", "올해 가장 좋아한 콘텐츠는?", "taste", ["light", "deep", "share", "compare"]),
          q("year_phrase", "year_taste", "올해 가장 많이 한 말은?", "taste", ["deep", "compare"]),
        ],
      },
      {
        id: "year_change",
        label: "올해의 변화",
        questions: [
          q("year_changed", "year_change", "올해 가장 달라진 것은?", "change", ["light", "deep", "compare"]),
          q("year_achievement", "year_change", "올해 해냈다고 느끼는 일은?", "change", ["light", "deep", "share", "compare"]),
          q("year_difficult", "year_change", "올해 가장 어려웠던 시간은?", "change", ["deep"], "private"),
        ],
      },
      {
        id: "year_self",
        label: "올해의 나",
        questions: [
          q("year_thought", "year_self", "올해 가장 많이 한 생각은?", "self", ["light", "deep", "compare"]),
          q("year_bright_day", "year_self", "내 마음이 가장 밝았던 날은?", "self", ["light", "deep", "share"]),
          q("year_one_word", "year_self", "올해를 한 단어로 표현한다면?", "self", ["light", "deep", "share", "compare"]),
        ],
      },
      {
        id: "year_future",
        label: "나중의 나에게",
        questions: [
          q("year_next_me", "year_future", "1년 뒤의 나에게 남기고 싶은 말은?", "future", ["light", "deep", "compare"], "private"),
          q("year_jan_first", "year_future", "1월 1일의 나에게 말해주고 싶은 것은?", "future", ["deep", "compare"], "private"),
        ],
      },
    ],
  },
  {
    id: "template_travel",
    type: "travel",
    label: "여행 회고",
    periodPlaceholder: "제주 여행",
    groups: [
      {
        id: "travel_scene",
        label: "여행의 장면",
        questions: [
          q("travel_first_scene", "travel_scene", "그 여행에서 가장 먼저 떠오르는 장면은?", "scene", ["light", "deep", "share", "compare"]),
          q("travel_sense", "travel_scene", "계속 생각나는 맛, 소리, 햇빛이 있다면?", "taste", ["light", "deep", "share", "compare"]),
          q("travel_unexpected", "travel_scene", "예상과 달랐던 시간은?", "change", ["light", "deep", "share", "compare"]),
        ],
      },
      {
        id: "travel_feeling",
        label: "여행의 감정",
        questions: [
          q("travel_main_emotion", "travel_feeling", "그때 가장 많이 머문 감정은?", "self", ["light", "deep", "share", "compare"]),
          q("travel_after_feeling", "travel_feeling", "그 여행이 끝난 뒤 남은 마음은?", "self", ["light", "deep", "share", "compare"]),
        ],
      },
      {
        id: "travel_self",
        label: "여행의 의미",
        questions: [
          q("travel_people", "travel_self", "같이 있던 사람이나 떠오르는 얼굴은?", "people", ["light", "deep", "share", "compare"]),
          q("travel_meaning", "travel_self", "지금 다시 돌아본다면 어떤 의미였나요?", "future", ["light", "deep", "share", "compare"]),
        ],
      },
    ],
  },
  {
    id: "template_period",
    type: "half_year",
    label: "시기 회고",
    periodPlaceholder: "2026 상반기",
    groups: [
      {
        id: "period_scene",
        label: "그 시기의 장면",
        questions: [
          q("period_scene", "period_scene", "그 시기를 가장 잘 보여주는 장면은?", "scene", ["light", "deep", "share", "compare"]),
          q("period_place", "period_scene", "그 시기에 자주 머문 장소는?", "scene", ["deep", "compare"]),
        ],
      },
      {
        id: "period_self",
        label: "그 시기의 나",
        questions: [
          q("period_self_word", "period_self", "그 시기의 나는 어떤 사람이었나요?", "self", ["light", "deep", "compare"]),
          q("period_thought", "period_self", "그 시기에 가장 많이 한 생각은?", "self", ["light", "deep", "compare"]),
          q("period_changed", "period_self", "그 시기에 달라진 것은?", "change", ["light", "deep", "share", "compare"]),
        ],
      },
      {
        id: "period_future",
        label: "나중의 나에게",
        questions: [
          q("period_future_message", "period_future", "나중의 나에게 남기고 싶은 말은?", "future", ["light", "deep", "compare"], "private"),
        ],
      },
    ],
  },
  {
    id: "template_life_chapter",
    type: "life_chapter",
    label: "인생 챕터 회고",
    periodPlaceholder: "20대",
    groups: [
      {
        id: "life_self",
        label: "그때의 나",
        questions: [
          q("life_self_word", "life_self", "그 시기의 나는 어떤 사람이었나요?", "self", ["light", "deep", "compare"]),
          q("life_choice", "life_self", "그 시기 가장 큰 선택은 무엇이었나요?", "change", ["light", "deep", "share"]),
        ],
      },
      {
        id: "life_continues",
        label: "지금도 이어지는 것",
        questions: [
          q("life_people", "life_continues", "오래 남은 관계는 무엇인가요?", "people", ["light", "deep", "share"]),
          q("life_taste", "life_continues", "지금까지 이어지는 취향은 무엇인가요?", "taste", ["deep", "share"]),
        ],
      },
      {
        id: "life_release",
        label: "놓아줘도 되는 것",
        questions: [
          q("life_release", "life_release", "후회하지만 이제 받아들인 것은?", "change", ["light", "deep"], "private"),
        ],
      },
      {
        id: "life_future",
        label: "다음 챕터의 나에게",
        questions: [
          q("life_next_message", "life_future", "다음 챕터의 나에게 남길 말은?", "future", ["light", "deep", "compare"], "private"),
        ],
      },
    ],
  },
];

export function getReflectionTemplate(templateId: string): ReflectionTemplate | null {
  return reflectionTemplates.find((template) => template.id === templateId) ?? null;
}

export function buildQuestionGroupsForMode(
  template: ReflectionTemplate,
  mode: ReflectionQuestionSetMode
): QuestionGroup[] {
  const groups = template.groups
    .map((group: ReflectionTemplateGroup) => ({
      id: group.id,
      label: group.label,
      questions: group.questions
        .filter((question) => mode === "deep" || question.modes.includes(mode))
        .map(({ modes: _modes, topic: _topic, ...question }) => ({ ...question })),
    }))
    .filter((group) => group.questions.length > 0);

  return groups;
}

export function getTemplateQuestionCount(
  template: ReflectionTemplate,
  mode: ReflectionQuestionSetMode
): number {
  return buildQuestionGroupsForMode(template, mode).reduce(
    (sum, group) => sum + group.questions.length,
    0
  );
}