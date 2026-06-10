<template>
  <section class="observationView">
    <header class="readOnlyHeader">
      <div class="copy">
        <span class="modeBadge">{{ labels.mode }}</span>
        <h2>{{ snapshot?.title ?? labels.emptyTitle }}</h2>
        <p>{{ snapshot?.description || labels.emptyDescription }}</p>
      </div>
      <div class="headerActions">
        <button class="ghostAction" type="button" @click="$emit('back')">
          {{ labels.back }}
        </button>
        <div v-if="snapshot" class="inviteMeta">
          <span>{{ labels.readOnly }}</span>
          <strong>{{ publishedDate }}</strong>
        </div>
      </div>
    </header>

    <div v-if="!snapshot" class="permissionNotice">
      <h3>{{ labels.emptyTitle }}</h3>
      <p>{{ labels.noSnapshot }}</p>
    </div>

    <template v-else>
      <section class="snapshotSurface">
        <div class="planetPreview" :class="snapshot.sourceType" aria-hidden="true">
          <span class="planet"></span>
          <span class="halo"></span>
        </div>

        <div class="recordList">
          <article v-for="record in sortedRecords" :key="record.id" class="recordCard">
            <span class="recordIndex">{{ record.order + 1 }}</span>
            <div class="recordBody">
              <h3>{{ record.title }}</h3>
              <ol v-if="record.logs.length">
                <li v-for="(log, index) in record.logs" :key="index">
                  {{ log }}
                </li>
              </ol>
              <p v-else>{{ labels.noLogs }}</p>
            </div>
          </article>
        </div>
      </section>

      <aside class="permissionNotice">
        <h3>{{ labels.noticeTitle }}</h3>
        <p>{{ labels.noticeDescription }}</p>
      </aside>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ObservationSnapshot } from "../types/recoverseFuture";

const props = defineProps<{
  snapshot: ObservationSnapshot | null;
  labels: {
    mode: string;
    emptyTitle: string;
    emptyDescription: string;
    noSnapshot: string;
    back: string;
    readOnly: string;
    noLogs: string;
    noticeTitle: string;
    noticeDescription: string;
  };
}>();

defineEmits<{
  back: [];
}>();

const sortedRecords = computed(() => {
  return [...(props.snapshot?.records ?? [])].sort((a, b) => a.order - b.order);
});

const publishedDate = computed(() => {
  if (!props.snapshot) return "";
  return new Date(props.snapshot.publishedAt ?? props.snapshot.createdAt).toLocaleDateString(
    "ko-KR",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
});
</script>

<style scoped>
.observationView {
  display: grid;
  gap: 16px;
  padding: 16px;
  color: var(--color-ink);
}

.readOnlyHeader,
.snapshotSurface,
.permissionNotice {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
}

.readOnlyHeader {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 18px;
}

.copy,
.headerActions {
  display: grid;
  gap: 8px;
}

.headerActions {
  justify-items: end;
}

.modeBadge {
  width: fit-content;
  border: 1px solid rgba(96, 208, 168, 0.36);
  border-radius: 999px;
  background: rgba(96, 208, 168, 0.1);
  color: #60d0a8;
  font-size: 12px;
  font-weight: 900;
  padding: 5px 9px;
}

h2,
h3,
p,
ol {
  margin: 0;
}

h2 {
  font-size: 26px;
  line-height: 1.15;
}

h3 {
  font-size: 16px;
}

p,
li {
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.6;
}

.ghostAction {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-paper);
  color: var(--color-ink);
  font: inherit;
  padding: 9px 12px;
  cursor: pointer;
}

.inviteMeta {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  padding: 10px 12px;
  display: grid;
  gap: 3px;
  min-width: 128px;
}

.inviteMeta span {
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 800;
}

.inviteMeta strong {
  font-size: 13px;
}

.snapshotSurface {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 16px;
  padding: 18px;
}

.planetPreview {
  position: relative;
  min-height: 180px;
}

.planet,
.halo {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 999px;
  transform: translate(-50%, -50%);
}

.halo {
  width: 148px;
  height: 148px;
  border: 1px solid rgba(244, 197, 106, 0.28);
  box-shadow: 0 0 40px rgba(244, 197, 106, 0.12);
}

.planet {
  width: 96px;
  height: 96px;
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 249, 234, 0.9), transparent 17%),
    linear-gradient(145deg, #f4c56a, #f2a27e 58%, #6d5a8d);
  box-shadow: 0 0 42px rgba(244, 197, 106, 0.32);
}

.planetPreview.galaxy .halo {
  border-color: rgba(96, 208, 168, 0.3);
}

.planetPreview.galaxy .planet {
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 249, 234, 0.9), transparent 17%),
    linear-gradient(145deg, #60d0a8, #6d5a8d 62%, #1d2438);
  box-shadow: 0 0 42px rgba(96, 208, 168, 0.32);
}

.recordList {
  display: grid;
  gap: 10px;
}

.recordCard {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  background: var(--color-paper);
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  padding: 12px;
}

.recordIndex {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 900;
}

.recordBody {
  display: grid;
  gap: 8px;
}

ol {
  padding-left: 18px;
}

.permissionNotice {
  padding: 16px;
  display: grid;
  gap: 6px;
}

@media (max-width: 720px) {
  .readOnlyHeader,
  .snapshotSurface {
    grid-template-columns: 1fr;
  }

  .headerActions {
    justify-items: start;
  }

  .planetPreview {
    min-height: 140px;
  }
}
</style>
