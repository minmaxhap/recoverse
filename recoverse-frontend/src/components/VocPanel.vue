<template>
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
        placeholder="불편했던 장면이나 떠오른 생각을 적어주세요"
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
    <p v-if="sent" class="inlineNotice" role="status">편집부에 접수되었어요. 고마워요.</p>
    <button type="submit" class="cta">편지 보내기</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useVoc, VOC_OPTIONS, type VocType } from '../composables/useVoc';

const voc = useVoc();
const type = ref<VocType>('idea');
const message = ref('');
const authorName = ref('');
const contact = ref('');
const error = ref('');
const sent = ref(false);

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
.vocForm {
  display: grid;
  gap: 12px;
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
