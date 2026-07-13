<template>
  <div class="publishScene" aria-hidden="true">
    <div class="coverStack">
      <span class="coverSheet sheetOne" />
      <span class="coverSheet sheetTwo" />
      <div class="issueCover">
        <span class="coverKicker">RECOVERSE</span>
        <strong>{{ year }}</strong>
        <span>{{ kindLabel }}</span>
      </div>
    </div>
    <div class="shelfRail">
      <span class="shelfSpine muted" />
      <span class="shelfSpine active" />
      <span class="shelfSpine muted narrow" />
    </div>
  </div>
  <div class="pressLine" />
</template>

<script setup lang="ts">
defineProps<{
  year: string;
  kindLabel: string;
}>();
</script>

<style scoped>
.publishScene {
  position: relative;
  width: min(220px, 68vw);
  height: 184px;
  display: grid;
  place-items: start center;
  opacity: 0;
  animation: sceneFade 0.35s ease 0.12s both;
}

.coverStack {
  position: relative;
  z-index: 1;
  width: 128px;
  height: 150px;
  transform-origin: 50% 100%;
  animation: shelveIssue 1.08s cubic-bezier(0.2, 0.86, 0.28, 1) 0.2s both;
}

.coverSheet,
.issueCover {
  position: absolute;
  inset: 0;
  background: var(--paper-card);
  border: 1px solid var(--ink);
}

.coverSheet {
  opacity: 0;
  transform-origin: 50% 100%;
}

.sheetOne {
  animation: gatherSheetOne 0.58s ease 0.2s both;
}

.sheetTwo {
  border-color: var(--hairline);
  animation: gatherSheetTwo 0.58s ease 0.28s both;
}

.issueCover {
  display: grid;
  align-content: space-between;
  justify-items: start;
  padding: 14px 12px;
  text-align: left;
  background: linear-gradient(180deg, var(--paper-card), var(--paper));
  overflow: hidden;
}

.issueCover::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 7px;
  background: var(--vermilion);
}

.issueCover::after {
  content: '';
  position: absolute;
  right: 12px;
  bottom: 16px;
  width: 52px;
  height: 2px;
  background: var(--vermilion);
  transform: scaleX(0);
  transform-origin: left;
  animation: printLine 0.42s ease 0.6s both;
}

.coverKicker {
  margin-left: 7px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: var(--dim);
}

.issueCover strong {
  margin-left: 7px;
  font-family: var(--font-display);
  font-size: 34px;
  line-height: 1;
}

.issueCover span:last-child {
  margin-left: 7px;
  font-size: 12px;
  font-weight: 800;
  color: var(--dim-strong);
}

.shelfRail {
  position: absolute;
  z-index: 0;
  right: 0;
  bottom: 0;
  left: 0;
  height: 42px;
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 6px;
  padding-bottom: 7px;
  border-top: 3px solid var(--ink);
  border-bottom: 1px solid var(--hairline);
  opacity: 0;
  animation: fadeUp 0.36s ease 0.42s both;
}

.shelfSpine {
  display: block;
  width: 15px;
  height: 28px;
  border: 1px solid var(--ink);
  background: var(--paper-card);
}

.shelfSpine.active {
  width: 18px;
  height: 32px;
  background: var(--vermilion);
}

.shelfSpine.narrow {
  width: 10px;
  height: 24px;
}

.shelfSpine.muted {
  border-color: var(--hairline);
}

.pressLine {
  width: 120px;
  height: 2px;
  background: var(--vermilion);
  transform: scaleX(0);
  transform-origin: center;
  animation: printLine 0.5s ease 0.9s both;
}

@keyframes sceneFade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gatherSheetOne {
  from {
    opacity: 0;
    transform: translate(-24px, 10px) rotate(-8deg);
  }
  to {
    opacity: 1;
    transform: translate(-8px, 7px) rotate(-3deg);
  }
}

@keyframes gatherSheetTwo {
  from {
    opacity: 0;
    transform: translate(22px, 12px) rotate(7deg);
  }
  to {
    opacity: 1;
    transform: translate(8px, 4px) rotate(2deg);
  }
}

@keyframes shelveIssue {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.96);
  }
  42%,
  72% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 1;
    transform: translateY(28px) scale(0.78);
  }
}

@keyframes printLine {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
