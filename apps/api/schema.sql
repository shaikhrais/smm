DROP TABLE IF EXISTS businesses;
CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

DROP TABLE IF EXISTS brands;
CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS social_accounts;
CREATE TABLE social_accounts (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  handle TEXT,
  status TEXT DEFAULT 'connected',
  last_sync TEXT,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  content TEXT,
  media_urls TEXT, -- JSON string
  scheduled_date TEXT,
  status TEXT,
  platforms TEXT, -- JSON string
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS analytics_stats;
CREATE TABLE analytics_stats (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  date TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS conversations;
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  last_message TEXT,
  unread_count INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'me' or 'them'
  content TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

DROP TABLE IF EXISTS oauth_tokens;
CREATE TABLE oauth_tokens (
  id TEXT PRIMARY KEY,
  social_account_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TEXT,
  scope TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (social_account_id) REFERENCES social_accounts(id) ON DELETE CASCADE
);

