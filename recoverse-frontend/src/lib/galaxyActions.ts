import {
  type AppLanguage,
  type Galaxy,
  type GalaxyData,
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
