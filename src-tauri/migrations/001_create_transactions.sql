CREATE TABLE IF NOT EXISTS transactions (
  id         TEXT PRIMARY KEY NOT NULL,
  date       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('revenue', 'expense')),
  amount     INTEGER NOT NULL CHECK(amount != 0),
  category   TEXT NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transaction_date_type ON transactions(date, type);
CREATE INDEX IF NOT EXISTS idx_transaction_category ON transactions(category);

CREATE TABLE IF NOT EXISTS app_metadata (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO app_metadata (key, value) VALUES ('schema_version', '1');
