import {
  type AppLanguage,
  type Galaxy,
  type GalaxyData,
  type GalaxyLog,
  type GalaxyMember,
  type GalaxyPrompt,
  type GalaxyTheme,
  loadGalaxyData,
  saveGalaxyData,
} from "./recoverseStore";

type CreateGalaxyInput = {
  title: string;
  description: string;
  theme: GalaxyTheme;
  language: AppLanguage;
};

function uuid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const defaultPrompts: Record<AppLanguage, string[]> = {
  ko: ["함께 오래 기억하고 싶은 순간은?", "다음에 다시 만나면 묻고 싶은 것은?"],
  en: ["What moment do we want to remember together?", "What should we ask next time?"],
};

export function createGalaxy(input: CreateGalaxyInput): GalaxyData {
  const title = input.title.trim();
  if (!title) {
    throw new Error(input.language === "ko" ? "은하 이름을 입력해 주세요." : "Enter a galaxy name.");
  }

  const now = new Date().toISOString();
  const galaxyId = uuid();
  const galaxy: Galaxy = {
    id: galaxyId,
    title,
    description: input.description.trim() || undefined,
    theme: input.theme,
    createdAt: now,
    updatedAt: now,
  };
  const member: GalaxyMember = {
    id: uuid(),
    galaxyId,
    displayName: input.language === "ko" ? "나" : "Me",
    colorTone: "toneGold",
    joinedAt: now,
  };
  const prompts: GalaxyPrompt[] = defaultPrompts[input.language].map((questionText, order) => ({
    id: uuid(),
    galaxyId,
    questionText,
    order,
    createdAt: now,
    updatedAt: now,
  }));

  const previous = loadGalaxyData();
  const next: GalaxyData = {
    galaxies: [galaxy, ...previous.galaxies],
    members: [member, ...previous.members],
    prompts: [...prompts, ...previous.prompts],
    logs: previous.logs,
  };

  saveGalaxyData(next);
  return next;
}

export function updateGalaxy(
  galaxyId: string,
  patch: Pick<Galaxy, "title" | "description" | "theme">,
  language: AppLanguage
): GalaxyData {
  const title = patch.title.trim();
  if (!title) {
    throw new Error(language === "ko" ? "은하 이름을 입력해 주세요." : "Enter a galaxy name.");
  }

  const previous = loadGalaxyData();
  const now = new Date().toISOString();
  const next: GalaxyData = {
    ...previous,
    galaxies: previous.galaxies.map((galaxy) =>
      galaxy.id === galaxyId
        ? {
            ...galaxy,
            title,
            description: (patch.description ?? "").trim() || undefined,
            theme: patch.theme,
            updatedAt: now,
          }
        : galaxy
    ),
  };

  saveGalaxyData(next);
  return next;
}

export function deleteGalaxy(galaxyId: string): GalaxyData {
  const previous = loadGalaxyData();
  const memberIds = new Set(
    previous.members.filter((member) => member.galaxyId === galaxyId).map((member) => member.id)
  );
  const promptIds = new Set(
    previous.prompts.filter((prompt) => prompt.galaxyId === galaxyId).map((prompt) => prompt.id)
  );
  const next: GalaxyData = {
    galaxies: previous.galaxies.filter((galaxy) => galaxy.id !== galaxyId),
    members: previous.members.filter((member) => member.galaxyId !== galaxyId),
    prompts: previous.prompts.filter((prompt) => prompt.galaxyId !== galaxyId),
    logs: previous.logs.filter(
      (log) =>
        log.galaxyId !== galaxyId && !memberIds.has(log.memberId) && !promptIds.has(log.promptId)
    ),
  };

  saveGalaxyData(next);
  return next;
}

export function addGalaxyMember(
  galaxyId: string,
  displayName: string,
  language: AppLanguage
): GalaxyData {
  const name = displayName.trim();
  if (!name) {
    throw new Error(language === "ko" ? "멤버 이름을 입력해 주세요." : "Enter a member name.");
  }

  const previous = loadGalaxyData();
  const tones = ["toneGold", "toneTeal", "toneLavender"];
  const memberCount = previous.members.filter((member) => member.galaxyId === galaxyId).length;
  const member: GalaxyMember = {
    id: uuid(),
    galaxyId,
    displayName: name,
    colorTone: tones[memberCount % tones.length],
    joinedAt: new Date().toISOString(),
  };
  const next = {
    ...previous,
    members: [...previous.members, member],
  };

  saveGalaxyData(next);
  return next;
}

export function updateGalaxyMember(
  memberId: string,
  displayName: string,
  language: AppLanguage
): GalaxyData {
  const name = displayName.trim();
  if (!name) {
    throw new Error(language === "ko" ? "멤버 이름을 입력해 주세요." : "Enter a member name.");
  }

  const previous = loadGalaxyData();
  const next = {
    ...previous,
    members: previous.members.map((member) =>
      member.id === memberId ? { ...member, displayName: name } : member
    ),
  };

  saveGalaxyData(next);
  return next;
}

export function deleteGalaxyMember(memberId: string): GalaxyData {
  const previous = loadGalaxyData();
  const next = {
    ...previous,
    members: previous.members.filter((member) => member.id !== memberId),
    logs: previous.logs.filter((log) => log.memberId !== memberId),
  };

  saveGalaxyData(next);
  return next;
}

export function addGalaxyPrompt(
  galaxyId: string,
  questionText: string,
  language: AppLanguage
): GalaxyData {
  const question = questionText.trim();
  if (!question) {
    throw new Error(language === "ko" ? "공통 질문을 입력해 주세요." : "Enter a shared question.");
  }

  const previous = loadGalaxyData();
  const now = new Date().toISOString();
  const order = previous.prompts.filter((prompt) => prompt.galaxyId === galaxyId).length;
  const prompt: GalaxyPrompt = {
    id: uuid(),
    galaxyId,
    questionText: question,
    order,
    createdAt: now,
    updatedAt: now,
  };
  const next = {
    ...previous,
    prompts: [...previous.prompts, prompt],
  };

  saveGalaxyData(next);
  return next;
}

export function updateGalaxyPrompt(
  promptId: string,
  questionText: string,
  language: AppLanguage
): GalaxyData {
  const question = questionText.trim();
  if (!question) {
    throw new Error(language === "ko" ? "공통 질문을 입력해 주세요." : "Enter a shared question.");
  }

  const previous = loadGalaxyData();
  const now = new Date().toISOString();
  const next = {
    ...previous,
    prompts: previous.prompts.map((prompt) =>
      prompt.id === promptId ? { ...prompt, questionText: question, updatedAt: now } : prompt
    ),
  };

  saveGalaxyData(next);
  return next;
}

export function deleteGalaxyPrompt(promptId: string): GalaxyData {
  const previous = loadGalaxyData();
  const next = {
    ...previous,
    prompts: previous.prompts.filter((prompt) => prompt.id !== promptId),
    logs: previous.logs.filter((log) => log.promptId !== promptId),
  };

  saveGalaxyData(next);
  return next;
}

export function saveGalaxyLog(
  galaxyId: string,
  promptId: string,
  memberId: string,
  answersText: string
): GalaxyData {
  const answers = answersText
    .split("\n")
    .map((answer) => answer.trim())
    .filter((answer) => answer.length > 0);
  const previous = loadGalaxyData();
  const now = new Date().toISOString();
  const existing = previous.logs.find(
    (log) => log.galaxyId === galaxyId && log.promptId === promptId && log.memberId === memberId
  );
  const nextLog: GalaxyLog = {
    id: existing?.id ?? uuid(),
    galaxyId,
    promptId,
    memberId,
    answers,
    updatedAt: now,
  };
  const next = {
    ...previous,
    logs: existing
      ? previous.logs.map((log) => (log.id === existing.id ? nextLog : log))
      : [...previous.logs, nextLog],
  };

  saveGalaxyData(next);
  return next;
}
