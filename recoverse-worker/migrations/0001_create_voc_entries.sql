CREATE TABLE IF NOT EXISTS voc_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('idea', 'bug', 'impression', 'other')),
  message TEXT NOT NULL,
  author_name TEXT,
  contact TEXT,
  page_path TEXT NOT NULL DEFAULT 'home',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'planned', 'done', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_voc_entries_created_at ON voc_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voc_entries_status ON voc_entries(status);
CREATE INDEX IF NOT EXISTS idx_voc_entries_type ON voc_entries(type);
