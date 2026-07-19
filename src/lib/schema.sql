CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  type TEXT NOT NULL CHECK(type IN ('habit', 'priority')),
  weight INTEGER NOT NULL DEFAULT 2 CHECK(weight BETWEEN 1 AND 4),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  completed_on TEXT NOT NULL,
  xp_earned INTEGER NOT NULL,
  streak_at_completion INTEGER NOT NULL DEFAULT 0,
  UNIQUE(task_id, completed_on)
);

CREATE TABLE IF NOT EXISTS streaks (
  task_id INTEGER PRIMARY KEY REFERENCES tasks(id),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_on TEXT
);

CREATE TABLE IF NOT EXISTS xp_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  logged_at TEXT DEFAULT (datetime('now'))
);
