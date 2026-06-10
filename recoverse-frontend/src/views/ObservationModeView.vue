<template>
  <section class="observationView">
    <header class="readOnlyHeader">
      <div class="copy">
        <span class="modeBadge">관측 모드</span>
        <h2>{{ snapshot.title }}</h2>
        <p>{{ snapshot.description }}</p>
      </div>
      <div class="inviteMeta">
        <span>읽기 전용</span>
        <strong>{{ publishedDate }}</strong>
      </div>
    </header>

    <section class="snapshotSurface">
      <div class="planetPreview" aria-hidden="true">
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
            <p v-else>공유된 탐사 로그가 없습니다.</p>
          </div>
        </article>
      </div>
    </section>

    <aside class="permissionNotice">
      <h3>이 초대장은 원본과 분리된 스냅샷입니다</h3>
      <p>
        관측자는 편집, 삭제, 댓글, 좋아요를 할 수 없습니다. 원본 행성이 바뀌어도 이 화면은 공유
        시점의 기록만 보여줍니다.
      </p>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ObservationSnapshot } from "../types/recoverseFuture";

const snapshot: ObservationSnapshot = {
  id: "snapshot-2025-year",
  sourceType: "planet",
  sourceId: "capsule-2025",
  title: "2025 연말 회고 행성",
  description: "공유 시점에 선택한 탐사 기록만 읽기 전용으로 묶은 관측 초대장.",
  accessMode: "read_only",
  createdAt: "2025-12-28T00:00:00.000Z",
  publishedAt: "2025-12-31T00:00:00.000Z",
  records: [
    {
      id: "record-proud",
      title: "올해 가장 자랑스러운 순간은?",
      logs: ["처음으로 오래 미뤄 둔 프로젝트를 끝까지 마쳤다."],
      order: 0,
    },
    {
      id: "record-lesson",
      title: "다음 해의 나에게 남기고 싶은 말은?",
      logs: ["조급해하지 말고, 이미 쌓아 둔 작은 루틴을 믿기."],
      order: 1,
    },
  ],
};

const sortedRecords = computed(() => {
  return [...snapshot.records].sort((a, b) => a.order - b.order);
});

const publishedDate = computed(() => {
  return new Date(snapshot.publishedAt ?? snapshot.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

.copy {
  display: grid;
  gap: 6px;
}

.modeBadge {
  width: fit-content;
  border: 1px solid rgba(96, 208, 168, 0.36);
  border-radius: 999px;
  background: rgba(96, 208, 168, 0.1);
  color: #0f8b68;
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

  .planetPreview {
    min-height: 140px;
  }
}
</style>
