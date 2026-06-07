-- ============================================================
--  PRODE MUNDIAL - Schema SQL para Supabase
-- ============================================================

-- Tabla de usuarios (login por nombre + PIN sin email)
CREATE TABLE IF NOT EXISTS users (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  pin         TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Grupos / Ligas privadas
CREATE TABLE IF NOT EXISTS groups (
  id           UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT  NOT NULL,
  invite_code  TEXT  NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Miembros de cada grupo con puntos acumulados
CREATE TABLE IF NOT EXISTS group_members (
  group_id      UUID    REFERENCES groups(id) ON DELETE CASCADE,
  user_id       UUID    REFERENCES users(id)  ON DELETE CASCADE,
  total_points  INTEGER DEFAULT 0,
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Partidos
CREATE TABLE IF NOT EXISTS matches (
  id            UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  team_a        TEXT  NOT NULL,
  team_b        TEXT  NOT NULL,
  match_date    TIMESTAMPTZ NOT NULL,
  real_score_a  INTEGER,
  real_score_b  INTEGER,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'finished')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Predicciones (una por usuario por partido, sin importar el grupo)
CREATE TABLE IF NOT EXISTS predictions (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID    REFERENCES users(id)   ON DELETE CASCADE,
  match_id      UUID    REFERENCES matches(id) ON DELETE CASCADE,
  pred_score_a  INTEGER NOT NULL,
  pred_score_b  INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

-- ============================================================
-- Desactivar RLS (auth basada en PIN sin Supabase Auth)
-- ============================================================
ALTER TABLE users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups        DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches       DISABLE ROW LEVEL SECURITY;
ALTER TABLE predictions   DISABLE ROW LEVEL SECURITY;

-- Los partidos oficiales están en supabase/seed.sql
-- Ejecutar: schema.sql primero, luego seed.sql
