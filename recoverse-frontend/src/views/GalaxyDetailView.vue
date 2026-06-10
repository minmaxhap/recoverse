<template>
  <section class="galaxyView">
    <header class="galaxyHero">
      <div class="heroCopy">
        <span class="eyebrow">그룹 은하</span>
        <h2>{{ galaxy.title }}</h2>
        <p>{{ galaxy.description }}</p>
      </div>
      <div class="galaxyVisual" aria-hidden="true">
        <span class="orbit orbitA"></span>
        <span class="orbit orbitB"></span>
        <span class="core"></span>
        <span
          v-for="member in members"
          :key="member.id"
          class="memberMoon"
          :class="member.colorTone"
        ></span>
      </div>
    </header>

    <section class="memberSection">
      <div class="sectionHead">
        <span class="eyebrow">멤버 행성</span>
        <h3>함께 남기는 기억</h3>
      </div>
      <div class="memberGrid">
        <article v-for="member in members" :key="member.id" class="memberCard">
          <span class="memberPlanet" :class="member.colorTone"></span>
          <div>
            <h4>{{ member.displayName }}</h4>
            <p>{{ formatJoinedAt(member.joinedAt) }} 합류</p>
          </div>
        </article>
      </div>
    </section>

    <section class="promptSection">
      <div class="sectionHead">
        <span class="eyebrow">공통 탐사 기록</span>
        <h3>같은 질문, 다른 로그</h3>
      </div>

      <div class="promptList">
        <article v-for="prompt in prompts" :key="prompt.id" class="promptCard">
          <h4>{{ prompt.questionText }}</h4>
          <div class="logMatrix">
            <div v-for="member in members" :key="member.id" class="logCell">
              <span>{{ member.displayName }}</span>
              <p>{{ logFor(prompt.id, member.id) }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { Galaxy, GalaxyLog, GalaxyMember, GalaxyPrompt } from "../types/recoverseFuture";

const galaxy: Galaxy = {
  id: "draft-galaxy-2025",
  title: "2025 연말 회고 은하",
  description: "친구들과 같은 질문을 두고 서로 다른 한 해의 궤도를 남기는 그룹 회고 공간.",
  theme: "year",
  createdAt: "2025-12-01T00:00:00.000Z",
  updatedAt: "2025-12-01T00:00:00.000Z",
};

const members: GalaxyMember[] = [
  {
    id: "member-me",
    galaxyId: galaxy.id,
    displayName: "나",
    colorTone: "toneGold",
    joinedAt: "2025-12-01T00:00:00.000Z",
  },
  {
    id: "member-friend",
    galaxyId: galaxy.id,
    displayName: "이민",
    colorTone: "toneTeal",
    joinedAt: "2025-12-02T00:00:00.000Z",
  },
  {
    id: "member-team",
    galaxyId: galaxy.id,
    displayName: "지우",
    colorTone: "toneLavender",
    joinedAt: "2025-12-03T00:00:00.000Z",
  },
];

const prompts: GalaxyPrompt[] = [
  {
    id: "prompt-proud",
    galaxyId: galaxy.id,
    questionText: "올해 가장 오래 기억하고 싶은 순간은?",
    order: 0,
    createdAt: galaxy.createdAt,
    updatedAt: galaxy.updatedAt,
  },
  {
    id: "prompt-change",
    galaxyId: galaxy.id,
    questionText: "작년의 나와 가장 달라진 점은?",
    order: 1,
    createdAt: galaxy.createdAt,
    updatedAt: galaxy.updatedAt,
  },
];

const logs: GalaxyLog[] = [
  {
    id: "log-1",
    galaxyId: galaxy.id,
    promptId: "prompt-proud",
    memberId: "member-me",
    answers: ["처음으로 오래 미뤄 둔 일을 끝까지 해냈다."],
    updatedAt: galaxy.updatedAt,
  },
  {
    id: "log-2",
    galaxyId: galaxy.id,
    promptId: "prompt-proud",
    memberId: "member-friend",
    answers: ["함께 여행을 준비하던 밤들이 오래 남았다."],
    updatedAt: galaxy.updatedAt,
  },
  {
    id: "log-3",
    galaxyId: galaxy.id,
    promptId: "prompt-change",
    memberId: "member-team",
    answers: ["혼자 해결하려 하기보다 더 자주 도움을 요청하게 됐다."],
    updatedAt: galaxy.updatedAt,
  },
];

function logFor(promptId: string, memberId: string) {
  return logs.find((log) => log.promptId === promptId && log.memberId === memberId)?.answers[0] ?? "아직 기록 전";
}

function formatJoinedAt(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}
</script>

<style scoped>
.galaxyView {
  display: grid;
  gap: 16px;
  padding: 16px;
  color: var(--color-ink);
}

.galaxyHero,
.memberSection,
.promptSection {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
  overflow: hidden;
}

.galaxyHero {
  min-height: 260px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 16px;
  align-items: center;
  padding: 18px;
}

.heroCopy,
.sectionHead {
  display: grid;
  gap: 6px;
}

.eyebrow {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

h2,
h3,
h4,
p {
  margin: 0;
}

h2 {
  font-size: 26px;
  line-height: 1.15;
}

h3 {
  font-size: 17px;
}

h4 {
  font-size: 14px;
}

p {
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.55;
}

.galaxyVisual {
  position: relative;
  min-height: 200px;
}

.orbit,
.core,
.memberMoon {
  position: absolute;
  border-radius: 999px;
}

.orbit {
  left: 50%;
  top: 50%;
  border: 1px solid rgba(96, 208, 168, 0.28);
  transform: translate(-50%, -50%);
}

.orbitA {
  width: 190px;
  height: 112px;
  transform: translate(-50%, -50%) rotate(-18deg);
}

.orbitB {
  width: 150px;
  height: 150px;
  border-color: rgba(185, 167, 232, 0.24);
}

.core {
  left: 50%;
  top: 50%;
  width: 62px;
  height: 62px;
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 249, 234, 0.9), transparent 17%),
    linear-gradient(145deg, #60d0a8, #6d5a8d 62%, #1d2438);
  box-shadow: 0 0 42px rgba(96, 208, 168, 0.36);
  transform: translate(-50%, -50%);
}

.memberMoon {
  width: 24px;
  height: 24px;
}

.galaxyVisual .toneGold {
  left: 18%;
  top: 46%;
}

.galaxyVisual .toneTeal {
  right: 16%;
  top: 28%;
}

.galaxyVisual .toneLavender {
  right: 28%;
  bottom: 18%;
}

.toneGold {
  background: linear-gradient(145deg, #f4c56a, #f2a27e);
}

.toneTeal {
  background: linear-gradient(145deg, #60d0a8, #1d2438);
}

.toneLavender {
  background: linear-gradient(145deg, #b9a7e8, #6d5a8d);
}

.memberSection,
.promptSection {
  padding: 16px;
  display: grid;
  gap: 14px;
}

.memberGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.memberCard {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.memberPlanet {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  border-radius: 999px;
}

.promptList {
  display: grid;
  gap: 12px;
}

.promptCard {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 12px;
}

.logMatrix {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.logCell {
  border-radius: 12px;
  background: var(--color-paper);
  padding: 10px;
  display: grid;
  gap: 6px;
}

.logCell span {
  color: var(--color-ink);
  font-size: 12px;
  font-weight: 900;
}

@media (max-width: 720px) {
  .galaxyHero,
  .memberGrid,
  .logMatrix {
    grid-template-columns: 1fr;
  }

  .galaxyHero {
    min-height: auto;
  }
}
</style>
