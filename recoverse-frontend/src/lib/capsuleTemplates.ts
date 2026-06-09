import type { LocalizedCapsuleTemplate } from "../types/recoverse";

export const capsuleTemplates: LocalizedCapsuleTemplate[] = [
  {
    id: "template_year",
    title: {
      ko: "연도 회고",
      en: "Year Retrospective",
    },
    type: "year",
    questions: {
      ko: [
        "이 시기에 가장 오래 기억하고 싶은 순간은?",
        "이 시기의 나는 무엇이 달라졌나요?",
        "나에 대해 새롭게 알게 된 것은?",
        "앞으로도 가져가고 싶은 마음은?",
      ],
      en: [
        "What moment do I want to remember most?",
        "What changed me during this time?",
        "What did I learn about myself?",
        "What do I want to carry forward?",
      ],
    },
  },
  {
    id: "template_life_stage",
    title: {
      ko: "시기 회고",
      en: "Life Stage Retrospective",
    },
    type: "life_stage",
    questions: {
      ko: [
        "이 시기의 나는 어떤 사람이었나요?",
        "그때 가장 소중하게 여겼던 것은?",
        "그때는 몰랐지만 지금은 알게 된 것은?",
        "지금의 내가 그때의 나에게 해주고 싶은 말은?",
      ],
      en: [
        "What kind of person was I during this time?",
        "What did I care about most?",
        "What did I not understand yet?",
        "What would I tell myself now?",
      ],
    },
  },
  {
    id: "template_travel",
    title: {
      ko: "여행 회고",
      en: "Travel Retrospective",
    },
    type: "travel",
    questions: {
      ko: [
        "아직도 선명하게 떠오르는 장면은?",
        "이 여행을 의미 있게 만든 사람이나 순간은?",
        "그 장소는 나에게 어떤 감정을 남겼나요?",
        "다시 돌아가고 싶은 순간이 있다면?",
      ],
      en: [
        "What scene do I still remember clearly?",
        "Who or what made this trip meaningful?",
        "What did this place make me feel?",
        "What would I revisit from this journey?",
      ],
    },
  },
  {
    id: "template_project",
    title: {
      ko: "프로젝트 회고",
      en: "Project Retrospective",
    },
    type: "project",
    questions: {
      ko: [
        "이 프로젝트를 시작할 때 기대했던 것은?",
        "예상보다 어려웠던 점은?",
        "가장 자랑스러운 순간은?",
        "다음에는 다르게 해보고 싶은 것은?",
      ],
      en: [
        "What was the original hope for this project?",
        "What was harder than expected?",
        "What am I proud of?",
        "What would I do differently next time?",
      ],
    },
  },
];
