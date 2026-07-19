<template>
  <div class="vocRoot">
    <button
      type="button"
      class="vocIcon"
      aria-label="편집부에 의견 남기기"
      :aria-expanded="open"
      @click="open = true"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 7.5h15v10h-15z" />
        <path d="m5.2 8 6.8 5 6.8-5" />
      </svg>
      <span>의견</span>
    </button>

    <div v-if="open" class="vocOverlay" role="presentation" @click.self="close">
      <section class="vocDialog" role="dialog" aria-modal="true" aria-labelledby="vocTitle">
        <div class="vocHead">
          <span class="eyebrow red">LETTER TO EDITOR</span>
          <button type="button" class="closeBtn" aria-label="닫기" @click="close">×</button>
        </div>
        <h2 id="vocTitle">편집부에 의견 남기기</h2>
        <p class="fineprint">Recoverse를 쓰며 떠오른 생각, 불편했던 점, 더 좋아질 수 있는 장면을 남겨주세요.</p>

        <form class="vocForm" @submit.prevent="submit">
          <label class="fieldGroup">
            <span class="fieldLabel">종류</span>
            <select v-model="type" class="field selectField">
              <option v-for="option in VOC_OPTIONS" :key="option.type" :value="option.type">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="fieldGroup">
            <span class="fieldLabel">내용</span>
            <textarea
              v-model="message"
              class="field area short"
              placeholder="이런 점이 있으면 더 좋겠어요"
              :aria-invalid="Boolean(error)"
            />
          </label>

          <div class="vocPair">
            <label class="fieldGroup">
              <span class="fieldLabel">이름 선택</span>
              <input v-model="authorName" class="field" placeholder="익명 가능" />
            </label>
            <label class="fieldGroup">
              <span class="fieldLabel">연락처 선택</span>
              <input v-model="contact" class="field" placeholder="필요한 경우만" />
            </label>
          </div>

          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <p v-if="sent" class="inlineNotice" role="status">편집부에 접수됐어요. 고마워요.</p>
          <button type="submit" class="cta">보내기</button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useVoc, VOC_OPTIONS, type VocType } from '../composables/useVoc';

const voc = useVoc();
const open = ref(false);
const type = ref<VocType>('idea');
const message = ref('');
const authorName = ref('');
const contact = ref('');
const error = ref('');
const sent = ref(false);

function close(): void {
  open.value = false;
}

async function submit(): Promise<void> {
  error.value = '';
  sent.value = false;
  if (!message.value.trim()) {
    error.value = '내용을 입력해주세요.';
    return;
  }

  const ok = await voc.add({
    type: type.value,
    message: message.value,
    authorName: authorName.value,
    contact: contact.value,
  });
  if (!ok) {
    error.value = '지금은 저장하지 못했어요. 잠시 뒤 다시 시도해주세요.';
    return;
  }

  message.value = '';
  authorName.value = '';
  contact.value = '';
  type.value = 'idea';
  sent.value = true;
}
</script>

<style scoped>
.vocRoot {
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.vocIcon {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 8px;
  background: var(--paper);
  border: 1px solid var(--ink);
  color: var(--ink);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.vocIcon:hover {
  background: var(--ink);
  color: var(--paper);
}

.vocIcon:active {
  transform: translate(1px, 1px);
}

.vocIcon svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linejoin: miter;
}

.vocOverlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  align-items: start;
  justify-items: center;
  padding: 74px 18px 24px;
  background: color-mix(in srgb, var(--paper) 86%, transparent);
}

.vocDialog {
  width: min(calc(100vw - 36px), 470px);
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  display: grid;
  gap: 10px;
  padding: 18px;
  background: var(--paper-card);
  border: 1px solid var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
  animation: rise 0.22s ease both;
}

.vocHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.closeBtn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  background: none;
  border: 1px solid var(--hairline);
  color: var(--ink);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.closeBtn:hover {
  border-color: var(--vermilion);
  color: var(--vermilion);
}

.vocDialog h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1.35;
}

.vocForm {
  display: grid;
  gap: 12px;
  margin-top: 8px;
}

.vocPair {
  display: grid;
  gap: 10px;
}

.vocPair .field {
  font-size: 14px;
}

@media (min-width: 720px) {
  .vocPair {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
