import { ref } from 'vue';
import { api } from '../lib/api';
import type { VocCreateRequest, VocEntry, VocType } from '@recoverse/shared';

export type { VocType } from '@recoverse/shared';

export const VOC_OPTIONS = [
  { type: 'idea', label: '기능 제안' },
  { type: 'bug', label: '불편/오류' },
  { type: 'impression', label: '인상/소감' },
  { type: 'other', label: '기타 의견' },
] as const;

export type VocDraft = {
  readonly type: VocType;
  readonly message: string;
  readonly authorName: string;
  readonly contact: string;
};

const entries = ref<VocEntry[]>([]);

export function useVoc() {
  return {
    entries,
    async add(draft: VocDraft): Promise<boolean> {
      const message = draft.message.trim();
      if (!message) return false;
      const payload: VocCreateRequest = {
        type: draft.type,
        message,
        authorName: draft.authorName.trim() || undefined,
        contact: draft.contact.trim() || undefined,
        pagePath: window.location.pathname,
      };
      try {
        const response = await api.submitVoc(payload);
        entries.value = [response.entry, ...entries.value];
        return true;
      } catch (error) {
        if (error instanceof Error) return false;
        return false;
      }
    },
  };
}
