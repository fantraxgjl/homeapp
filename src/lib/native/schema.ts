/**
 * SQL DDL for the standalone iOS SQLite database.
 * Tables mirror the Prisma schema — same columns, snake_case naming.
 * Run once on first launch via db.ts initializeTables().
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS app_config (
  id          TEXT PRIMARY KEY DEFAULT 'singleton',
  pin_hash    TEXT,
  ha_base_url TEXT,
  ha_token    TEXT,
  weather_lat REAL,
  weather_lon REAL,
  kiosk_mode  INTEGER NOT NULL DEFAULT 0,
  anthropic_key TEXT
);

INSERT OR IGNORE INTO app_config (id) VALUES ('singleton');

CREATE TABLE IF NOT EXISTS family_members (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'CHILD',
  color        TEXT NOT NULL DEFAULT '#6366f1',
  avatar_emoji TEXT NOT NULL DEFAULT '👤',
  calendar_id  TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chores (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  icon_name  TEXT NOT NULL DEFAULT 'star',
  points     INTEGER NOT NULL DEFAULT 10,
  recurrence TEXT NOT NULL DEFAULT 'DAILY',
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chore_assignments (
  id            TEXT PRIMARY KEY,
  chore_id      TEXT NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  member_id     TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  day_of_week   INTEGER,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chore_completions (
  id            TEXT PRIMARY KEY,
  chore_id      TEXT NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  member_id     TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  completed_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  cuisine        TEXT,
  meal_type      TEXT,
  servings       INTEGER,
  cook_time      INTEGER,
  source_url     TEXT,
  image_url      TEXT,
  allergens      TEXT,
  nutrition_info TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredients (
  id         TEXT PRIMARY KEY,
  recipe_id  TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  quantity   TEXT,
  unit       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id          TEXT PRIMARY KEY,
  recipe_id   TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id         TEXT PRIMARY KEY,
  week_start TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_days (
  id          TEXT PRIMARY KEY,
  plan_id     TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meals (
  id          TEXT PRIMARY KEY,
  day_id      TEXT NOT NULL REFERENCES meal_days(id) ON DELETE CASCADE,
  meal_type   TEXT NOT NULL DEFAULT 'DINNER',
  title       TEXT NOT NULL,
  emoji       TEXT,
  image_url   TEXT,
  recipe_url  TEXT,
  recipe_id   TEXT REFERENCES recipes(id) ON DELETE SET NULL,
  servings    INTEGER,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Other',
  quantity   TEXT,
  is_checked INTEGER NOT NULL DEFAULT 0,
  meal_id    TEXT REFERENCES meals(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  content    TEXT NOT NULL,
  author_id  TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  color      TEXT NOT NULL DEFAULT '#fef08a',
  is_pinned  INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chore_assignments_chore  ON chore_assignments(chore_id);
CREATE INDEX IF NOT EXISTS idx_chore_assignments_member ON chore_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_date   ON chore_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_meal_days_plan           ON meal_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_meals_day                ON meals(day_id);
CREATE INDEX IF NOT EXISTS idx_messages_pinned          ON messages(is_pinned, created_at);
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe       ON ingredients(recipe_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe      ON recipe_steps(recipe_id, step_number);
`;
