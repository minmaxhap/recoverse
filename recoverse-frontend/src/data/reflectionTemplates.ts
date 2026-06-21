import type {
  QuestionGroup,
  ReflectionQuestionSetMode,
  ReflectionTemplate,
  ReflectionTemplateGroup,
  ReflectionTemplateQuestion,
} from "../types/reflection";

const commonHint = "단어만 적어도 괜찮아요. 나중에 이어 쓸 수 있어요.";

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
    hint: commonHint,
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
    label: "한 해 회고",
    periodPlaceholder: "2025년",
    groups: [
      {
        id: "year_scene",
        label: "이 시기의 장면",
        questions: [
          q("year_place", "year_scene", "올해 가장 기억에 남는 장소는?", "scene", [
            "light",
            "deep",
            "share",
            "compare",
          ]),
          q("year_food", "year_scene", "올해 가장 좋아한 음식이나 카페는?", "scene", [
            "light",
            "deep",
            "share",
            "compare",
          ]),
          q("year_song", "year_scene", "올해의 노래는?", "taste", [
            "deep",
            "share",
            "compare",
          ]),
          q("year_scene_best_day", "year_scene", "올해 가장 좋았던 하루는?", "scene", [
            "deep",
            "share",
          ]),
        ],
      },
      {
        id: "year_people",
        label: "이 시기의 사람",
        questions: [
          q("year_thankful_person", "year_people", "올해 고마웠던 사람은?", "people", [
            "light",
            "deep",
            "share",
            "compare",
          ]),
          q("year_new_connection", "year_people", "올해 새로 만난 인연은?", "people", [
            "deep",
            "share",
          ]),
        ],
      },
      {
        id: "year_taste",
        label: "이 시기의 취향",
        questions: [
          q("year_content", "year_taste", "올해 가장 좋아한 콘텐츠는?", "taste", [
            "light",
            "deep",
            "share",
            "compare",
          ]),
          q("year_phrase", "year_taste", "올해 가장 많이 한 말은?", "taste", [
            "deep",
            "compare",
          ]),
        ],
      },
      {
        id: "year_change",
        label: "이 시기의 변화",
        questions: [
          q("year_changed", "year_change", "올해 가장 달라진 것은?", "change", [
            "light",
            "deep",
            "compare",
          ]),
          q("year_achievement", "year_change", "올해의 성취를 한 가지 꼽는다면?", "change", [
            "light",
            "deep",
            "share",
            "compare",
          ]),
          q("year_difficult", "year_change", "올해 가장 어려웠던 순간은?", "change", [
            "deep",
          ], "private"),
        ],
      },
      {
        id: "year_self",
        label: "이 시기의 나",
        questions: [
          q("year_thought", "year_self", "올해 가장 많이 한 생각은?", "self", [
            "light",
            "deep",
            "compare",
          ]),
          q("year_bright_day", "year_self", "내 마음이 가장 밝았던 날은?", "self", [
            "light",
            "deep",
            "share",
          ]),
          q("year_one_word", "year_self", "올해를 한 마디로 표현하면?", "self", [
            "light",
            "deep",
            "share",
            "compare",
          ]),
        ],
      },
      {
        id: "year_future",
        label: "나중의 나에게",
        questions: [
          q("year_next_me", "year_future", "1년 뒤의 나에게 하고 싶은 말은?", "future", [
            "light",
            "deep",
            "compare",
          ], "private"),
          q("year_jan_first", "year_future", "1월 1일의 나에게 하고 싶은 말은?", "future", [
            "deep",
            "compare",
          ], "private"),
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
        label: "이 여행의 장면",
        questions: [
          q("travel_landscape", "travel_scene", "가장 기억에 남는 풍경은?", "scene", [
            "light",
            "deep",
            "share",
          ]),
          q("travel_best_food", "travel_scene", "먹은 것 중 최고는?", "scene", [
            "light",
            "deep",
            "share",
          ]),
          q("travel_place_return", "travel_scene", "다시 가고 싶은 장소는?", "scene", [
            "deep",
            "share",
          ]),
        ],
      },
      {
        id: "travel_feeling",
        label: "이 여행의 감정",
        questions: [
          q("travel_happy", "travel_feeling", "가장 기뻤던 순간은?", "self", [
            "light",
            "deep",
            "share",
          ]),
          q("travel_unexpected", "travel_feeling", "예상 밖이었던 것은?", "change", [
            "light",
            "deep",
            "share",
          ]),
        ],
      },
      {
        id: "travel_self",
        label: "이 여행의 나",
        questions: [
          q("travel_changed", "travel_self", "이 여행에서 달라진 것은?", "change", [
            "light",
            "deep",
            "compare",
          ]),
          q("travel_next", "travel_self", "다음에 또 간다면 꼭 하고 싶은 것은?", "future", [
            "deep",
            "share",
          ]),
        ],
      },
    ],
  },
  {
    id: "template_period",
    type: "half_year",
    label: "시기 회고",
    periodPlaceholder: "2025 상반기",
    groups: [
      {
        id: "period_scene",
        label: "이 시기의 장면",
        questions: [
          q("period_scene", "period_scene", "이 시기 가장 선명한 장면은?", "scene", [
            "light",
            "deep",
            "share",
            "compare",
          ]),
          q("period_place", "period_scene", "이 시기에 자주 머문 장소는?", "scene", [
            "deep",
            "compare",
          ]),
        ],
      },
      {
        id: "period_self",
        label: "이 시기의 나",
        questions: [
          q("period_self_word", "period_self", "이 시기의 나는 어떤 사람이었나요?", "self", [
            "light",
            "deep",
            "compare",
          ]),
          q("period_thought", "period_self", "이 시기 가장 많이 한 생각은?", "self", [
            "light",
            "deep",
            "compare",
          ]),
          q("period_changed", "period_self", "이 시기 달라진 것은?", "change", [
            "light",
            "deep",
            "share",
            "compare",
          ]),
        ],
      },
      {
        id: "period_future",
        label: "나중의 나에게",
        questions: [
          q("period_future_message", "period_future", "나중의 나에게 남기고 싶은 말은?", "future", [
            "light",
            "deep",
            "compare",
          ], "private"),
        ],
      },
    ],
  },
  {
    id: "template_life_chapter",
    type: "life_chapter",
    label: "나이 회고",
    periodPlaceholder: "20대",
    groups: [
      {
        id: "life_self",
        label: "이 나이의 나",
        questions: [
          q("life_self_word", "life_self", "이 시기의 나는 어떤 사람이었나요?", "self", [
            "light",
            "deep",
            "compare",
          ]),
          q("life_choice", "life_self", "이 시기 가장 큰 선택은 무엇이었나요?", "change", [
            "light",
            "deep",
            "share",
          ]),
        ],
      },
      {
        id: "life_continues",
        label: "지금도 이어지는 것",
        questions: [
          q("life_people", "life_continues", "오래 남은 관계는 무엇인가요?", "people", [
            "light",
            "deep",
            "share",
          ]),
          q("life_taste", "life_continues", "지금까지 이어지는 취향은 무엇인가요?", "taste", [
            "deep",
            "share",
          ]),
        ],
      },
      {
        id: "life_release",
        label: "놓아줘도 되는 것",
        questions: [
          q("life_release", "life_release", "후회하지만 이제 받아들이는 것은?", "change", [
            "light",
            "deep",
          ], "private"),
        ],
      },
      {
        id: "life_future",
        label: "다음 시기의 나에게",
        questions: [
          q("life_next_message", "life_future", "다음 시기의 나에게 남기는 말은?", "future", [
            "light",
            "deep",
            "compare",
          ], "private"),
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
