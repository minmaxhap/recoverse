export const VOC_TYPES = ['idea', 'bug', 'impression', 'other'] as const;
export type VocType = (typeof VOC_TYPES)[number];

export const VOC_STATUSES = ['new', 'read', 'planned', 'done', 'archived'] as const;
export type VocStatus = (typeof VOC_STATUSES)[number];

export interface VocCreateRequest {
  type: VocType;
  message: string;
  authorName?: string;
  contact?: string;
  pagePath?: string;
}

export interface VocEntry {
  id: string;
  type: VocType;
  message: string;
  authorName: string | null;
  contact: string | null;
  pagePath: string;
  status: VocStatus;
  createdAt: string;
  updatedAt: string;
  userAgent: string | null;
}

export interface VocListResponse {
  entries: VocEntry[];
}
