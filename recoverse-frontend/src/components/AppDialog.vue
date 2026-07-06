<template>
  <Teleport to="body">
    <Transition name="dialogFade">
      <div v-if="dialogState.visible" class="dialogOverlay" @click.self="onCancel">
        <div
          class="dialogPanel"
          role="alertdialog"
          aria-modal="true"
          :aria-label="dialogState.title || dialogState.message"
        >
          <span class="dialogRibbon" aria-hidden="true"></span>
          <h2 v-if="dialogState.title">{{ dialogState.title }}</h2>
          <p class="dialogMessage">{{ dialogState.message }}</p>

          <div v-if="dialogState.kind === 'prompt'" class="dialogInputRow">
            <input
              ref="inputRef"
              v-model="dialogState.inputValue"
              :readonly="dialogState.readonly"
              :placeholder="dialogState.inputPlaceholder"
              @keydown.enter="onAccept"
              @focus="onInputFocus"
            />
            <button
              v-if="dialogState.readonly"
              type="button"
              class="dialogCopyButton"
              @click="onCopy"
            >
              {{ copyLabel }}
            </button>
          </div>

          <div class="dialogActions">
            <button
              v-if="dialogState.kind === 'confirm' || (dialogState.kind === 'prompt' && !dialogState.readonly)"
              type="button"
              class="dialogCancel"
              @click="onCancel"
            >
              {{ dialogState.cancelLabel }}
            </button>
            <button
              ref="acceptRef"
              type="button"
              class="dialogAccept"
              :class="{ danger: dialogState.danger }"
              @click="onAccept"
            >
              {{ dialogState.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { dialogState, resolveDialogAccept, resolveDialogCancel } from "../composables/useAppDialog";

const inputRef = ref<HTMLInputElement | null>(null);
const acceptRef = ref<HTMLButtonElement | null>(null);
const copyLabel = ref("복사하기");

watch(
  () => dialogState.visible,
  (visible) => {
    if (!visible) return;
    copyLabel.value = "복사하기";
    nextTick(() => {
      if (dialogState.kind === "prompt") {
        inputRef.value?.focus();
        inputRef.value?.select();
      } else {
        acceptRef.value?.focus();
      }
    });
  }
);

function onInputFocus() {
  if (dialogState.readonly) inputRef.value?.select();
}

async function onCopy() {
  try {
    await navigator.clipboard?.writeText(dialogState.inputValue);
    copyLabel.value = "복사됨";
  } catch {
    inputRef.value?.select();
  }
}

function onAccept() {
  resolveDialogAccept();
}

function onCancel() {
  resolveDialogCancel();
}

function onKeydown(event: KeyboardEvent) {
  if (!dialogState.visible) return;
  if (event.key === "Escape") onCancel();
}

window.addEventListener("keydown", onKeydown);
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style scoped>
.dialogOverlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(25, 31, 40, 0.4);
  backdrop-filter: blur(2px);
}

.dialogPanel {
  position: relative;
  width: min(380px, 100%);
  padding: 24px 20px 20px;
  border: 0;
  border-radius: var(--radius-panel);
  background: var(--surface-paper);
  box-shadow: var(--shadow-lifted);
  display: grid;
  gap: 12px;
}

.dialogRibbon {
  display: none;
}

.dialogPanel h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: var(--leading-tight);
  color: var(--text-primary);
  word-break: keep-all;
}

.dialogMessage {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: var(--leading-body);
  word-break: keep-all;
  white-space: pre-line;
}

.dialogInputRow {
  display: flex;
  gap: 8px;
}

.dialogInputRow input {
  flex: 1;
  min-width: 0;
  border: 0;
  border-radius: 12px;
  background: var(--surface-parchment);
  color: var(--text-primary);
  padding: 12px 14px;
  font-size: 13px;
}

.dialogInputRow input:focus-visible {
  outline: none;
  box-shadow: var(--glow-lamp) !important;
}

.dialogCopyButton {
  flex-shrink: 0;
  border: 0;
  border-radius: 12px;
  background: var(--surface-parchment);
  color: var(--text-primary);
  padding: 0 14px;
  font-size: 13px;
  font-weight: var(--label-weight);
}

.dialogCopyButton:hover, .dialogCopyButton:focus-visible {
  background: #E8EBEE;
}

.dialogActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
}

.dialogCancel, .dialogAccept {
  min-height: 40px;
  border-radius: var(--radius-pill);
  padding: 9px 16px;
  font-weight: var(--heading-weight);
  letter-spacing: 0;
}

.dialogCancel {
  border: 0;
  background: var(--surface-parchment);
  color: var(--text-secondary);
}

.dialogCancel:hover, .dialogCancel:focus-visible {
  color: var(--text-primary);
  background: #E8EBEE;
}

.dialogAccept {
  border: 0;
  background: var(--accent-espresso);
  color: var(--color-primary-contrast);
}

.dialogAccept.danger {
  background: var(--color-danger);
  color: #fff;
}

.dialogFade-enter-active, .dialogFade-leave-active {
  transition: opacity 160ms ease;
}
.dialogFade-enter-active .dialogPanel, .dialogFade-leave-active .dialogPanel {
  transition: transform 160ms ease, opacity 160ms ease;
}
.dialogFade-enter-from, .dialogFade-leave-to {
  opacity: 0;
}
.dialogFade-enter-from .dialogPanel, .dialogFade-leave-to .dialogPanel {
  transform: translateY(6px) scale(0.98);
  opacity: 0;
}
</style>
