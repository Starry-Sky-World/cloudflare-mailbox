-- ============================================
-- 分类表
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    parent_id TEXT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📁',
    color TEXT DEFAULT '#666666',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 默认分类（系统保留，不可删除）
INSERT OR IGNORE INTO categories (id, parent_id, name, icon, sort_order)
VALUES ('default', NULL, '默认', '📥', 999999);

-- ============================================
-- 邮件表
-- ============================================
CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    message_id TEXT UNIQUE,
    from_address TEXT NOT NULL,
    from_name TEXT,
    to_address TEXT NOT NULL,
    reply_to TEXT,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    category_id TEXT DEFAULT 'default',
    matched_node_id TEXT,
    matched_node_name TEXT,
    is_read INTEGER DEFAULT 0,
    is_starred INTEGER DEFAULT 0,
    received_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET DEFAULT
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(category_id);
CREATE INDEX IF NOT EXISTS idx_emails_to_address ON emails(to_address);
CREATE INDEX IF NOT EXISTS idx_emails_from_address ON emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);

-- ============================================
-- 全文搜索 (FTS5)
-- ============================================
CREATE VIRTUAL TABLE IF NOT EXISTS emails_fts USING fts5(
    subject,
    body_text,
    from_address,
    from_name,
    content='emails',
    content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS emails_ai AFTER INSERT ON emails BEGIN
    INSERT INTO emails_fts(rowid, subject, body_text, from_address, from_name)
    VALUES (NEW.rowid, NEW.subject, NEW.body_text, NEW.from_address, NEW.from_name);
END;

CREATE TRIGGER IF NOT EXISTS emails_ad AFTER DELETE ON emails BEGIN
    INSERT INTO emails_fts(emails_fts, rowid, subject, body_text, from_address, from_name)
    VALUES ('delete', OLD.rowid, OLD.subject, OLD.body_text, OLD.from_address, OLD.from_name);
END;
