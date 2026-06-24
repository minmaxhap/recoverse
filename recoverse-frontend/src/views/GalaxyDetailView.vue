<template>
  <section class="galaxyView">
    <header class="galaxyHero">
      <div class="heroCopy">
        <span class="eyebrow">{{ labels.eyebrow }}</span>
        <h2>{{ galaxy?.title ?? labels.emptyTitle }}</h2>
        <p>{{ galaxy?.description || labels.emptyDescription }}</p>
      </div>
      <div class="heroActions">
        <button v-if="galaxy" class="ghostAction" type="button" @click="$emit('create-observation')">
          {{ labels.createObservation }}
        </button>
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

    <div v-if="!galaxy" class="emptyState">
      {{ labels.noGalaxy }}
    </div>

    <template v-else>
      <section class="editSection">
        <div class="sectionHead">
          <span class="eyebrow">{{ labels.galaxySettings }}</span>
          <h3>{{ labels.galaxyInfo }}</h3>
        </div>
        <div class="formGrid">
          <label class="wide">
            <span>{{ labels.title }}</span>
            <input v-model="galaxyForm.title" />
          </label>
          <label class="wide">
            <span>{{ labels.description }}</span>
            <input v-model="galaxyForm.description" />
          </label>
          <label>
            <span>{{ labels.theme }}</span>
            <select v-model="galaxyForm.theme">
              <option v-for="theme in galaxyThemes" :key="theme" :value="theme">
                {{ labels.themeLabels[theme] }}
              </option>
            </select>
          </label>
        </div>
        <div class="actionRow">
          <button class="primaryAction" type="button" @click="$emit('save-galaxy')">
            {{ labels.saveGalaxy }}
          </button>
        </div>
      </section>

      <section class="memberSection">
        <div class="sectionHead">
          <span class="eyebrow">{{ labels.memberEyebrow }}</span>
          <h3>{{ labels.memberTitle }}</h3>
        </div>

        <div class="inlineForm">
          <input v-model="memberForm.displayName" :placeholder="labels.memberPlaceholder" />
          <button class="primaryAction" type="button" @click="$emit('add-member')">
            {{ labels.addMember }}
          </button>
        </div>

        <div class="memberGrid">
          <article v-for="member in members" :key="member.id" class="memberCard">
            <span class="memberPlanet" :class="member.colorTone"></span>
            <div>
              <input
                :value="member.displayName"
                @change="
                  $emit('update-member', {
                    memberId: member.id,
                    displayName: ($event.target as HTMLInputElement).value,
                  })
                "
              />
              <p>{{ formatJoinedAt(member.joinedAt) }} {{ labels.joined }}</p>
            </div>
            <button class="smallDanger" type="button" @click="$emit('delete-member', member.id)">
              {{ labels.delete }}
            </button>
          </article>
        </div>
      </section>

      <section class="promptSection">
        <div class="sectionHead">
          <span class="eyebrow">{{ labels.promptEyebrow }}</span>
          <h3>{{ labels.promptTitle }}</h3>
        </div>

        <div class="inlineForm">
          <input v-model="promptForm.questionText" :placeholder="labels.promptPlaceholder" />
          <button class="primaryAction" type="button" @click="$emit('add-prompt')">
            {{ labels.addPrompt }}
          </button>
        </div>

        <div class="promptList">
          <article v-for="prompt in sortedPrompts" :key="prompt.id" class="promptCard">
            <div class="promptHead">
              <input
                :value="prompt.questionText"
                @change="
                  $emit('update-prompt', {
                    promptId: prompt.id,
                    questionText: ($event.target as HTMLInputElement).value,
                  })
                "
              />
              <button class="smallDanger" type="button" @click="$emit('delete-prompt', prompt.id)">
                {{ labels.delete }}
              </button>
            </div>

            <div class="logMatrix">
              <div v-for="member in members" :key="member.id" class="logCell">
                <span>{{ member.displayName }}</span>
                <textarea
                  v-model="logDrafts[logKey(prompt.id, member.id)]"
                  :placeholder="labels.logPlaceholder"
                  rows="3"
                ></textarea>
                <button
                  class="smallAction"
                  type="button"
                  @click="
                    $emit('save-log', {
                      promptId: prompt.id,
                      memberId: member.id,
                    })
                  "
                >
                  {{ labels.saveLog }}
                </button>
              </div>
            </div>
          </article>

          <div v-if="sortedPrompts.length === 0" class="emptyState">
            {{ labels.noPrompts }}
          </div>
        </div>
      </section>

      <details class="dangerZone">
        <summary>{{ labels.deleteGalaxy }}</summary>
        <button class="dangerAction" type="button" @click="$emit('delete-galaxy')">
          {{ labels.deleteGalaxy }}
        </button>
      </details>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  Galaxy,
  GalaxyLog,
  GalaxyMember,
  GalaxyPrompt,
  GalaxyTheme,
} from "../types/recoverseFuture";

type GalaxyFormState = {
  title: string;
  description: string;
  theme: GalaxyTheme;
};

type MemberFormState = {
  displayName: string;
};

type PromptFormState = {
  questionText: string;
};

const galaxyThemes: GalaxyTheme[] = [
  "year",
  "trip",
  "project",
  "relationship",
  "career",
  "custom",
];

const props = defineProps<{
  galaxy: Galaxy | null;
  members: GalaxyMember[];
  prompts: GalaxyPrompt[];
  logs: GalaxyLog[];
  galaxyForm: GalaxyFormState;
  memberForm: MemberFormState;
  promptForm: PromptFormState;
  logDrafts: Record<string, string>;
  labels: {
    eyebrow: string;
    emptyTitle: string;
    emptyDescription: string;
    noGalaxy: string;
    backHome: string;
    createObservation: string;
    deleteGalaxy: string;
    galaxySettings: string;
    galaxyInfo: string;
    title: string;
    description: string;
    theme: string;
    themeLabels: Record<GalaxyTheme, string>;
    saveGalaxy: string;
    memberEyebrow: string;
    memberTitle: string;
    memberPlaceholder: string;
    addMember: string;
    joined: string;
    promptEyebrow: string;
    promptTitle: string;
    promptPlaceholder: string;
    addPrompt: string;
    logPlaceholder: string;
    saveLog: string;
    noPrompts: string;
    delete: string;
  };
}>();

defineEmits<{
  "back-home": [];
  "create-observation": [];
  "save-galaxy": [];
  "delete-galaxy": [];
  "add-member": [];
  "update-member": [payload: { memberId: string; displayName: string }];
  "delete-member": [memberId: string];
  "add-prompt": [];
  "update-prompt": [payload: { promptId: string; questionText: string }];
  "delete-prompt": [promptId: string];
  "save-log": [payload: { promptId: string; memberId: string }];
}>();

const sortedPrompts = computed(() => {
  return [...props.prompts].sort((a, b) => a.order - b.order);
});

function logKey(promptId: string, memberId: string) {
  return `${promptId}:${memberId}`;
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
.editSection,
.memberSection,
.promptSection,
.dangerZone,
.emptyState {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
  overflow: hidden;
}

.galaxyHero {
  min-height: 260px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 220px;
  gap: 16px;
  align-items: center;
  padding: 18px;
}

.heroCopy,
.sectionHead {
  display: grid;
  gap: 6px;
}

.heroActions,
.actionRow,
.inlineForm,
.promptHead {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.eyebrow {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

h2,
h3,
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

.editSection,
.memberSection,
.promptSection,
.dangerZone,
.emptyState {
  padding: 16px;
  display: grid;
  gap: 14px;
}

.dangerZone {
  border-color: rgba(224, 85, 85, 0.25);
  background: rgba(224, 85, 85, 0.04);
}

.dangerZone summary {
  color: #ff9f9f;
  cursor: pointer;
  font-size: 12px;
  font-weight: 900;
}

.dangerZone .dangerAction {
  width: fit-content;
}

.formGrid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 10px;
}

.formGrid label {
  display: grid;
  gap: 6px;
}

.formGrid label span {
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 800;
}

.wide {
  grid-column: 1 / -1;
}

input,
select,
textarea {
  min-width: 0;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255, 249, 234, 0.96);
  color: #15111f;
  font: inherit;
  padding: 10px 12px;
}

textarea {
  resize: vertical;
}

button {
  font: inherit;
  border-radius: 999px;
  padding: 9px 12px;
  cursor: pointer;
}

.primaryAction,
.smallAction {
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.ghostAction {
  border: 1px solid var(--color-border);
  background: var(--color-paper);
  color: var(--color-ink);
}

.dangerAction,
.smallDanger {
  border: 1px solid var(--color-danger);
  background: transparent;
  color: var(--color-danger);
}

.smallAction,
.smallDanger {
  border-radius: 12px;
  padding: 7px 9px;
  font-size: 12px;
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
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
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

.promptHead {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
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
  .formGrid,
  .memberGrid,
  .logMatrix {
    grid-template-columns: 1fr;
  }

  .galaxyHero {
    min-height: auto;
  }

  .promptHead,
  .memberCard {
    grid-template-columns: 1fr;
  }
}
</style>
