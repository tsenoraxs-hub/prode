-- ============================================================
--  PRODE MUNDIAL - Migración: Predicciones de Bracket
--  Ejecutar en Supabase SQL Editor
-- ============================================================

-- Predicciones de posición en cada grupo (A-L)
CREATE TABLE IF NOT EXISTS bracket_group_predictions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  world_group  TEXT        NOT NULL,   -- 'A', 'B', ... 'L'
  position     INTEGER     NOT NULL,   -- 1, 2, 3, 4
  team         TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, world_group, position)
);

-- Predicciones de eliminatoria (R32 → Final)
CREATE TABLE IF NOT EXISTS bracket_knockout_predictions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  round        TEXT        NOT NULL,   -- 'R32','R16','QF','SF','F','3rd'
  match_index  INTEGER     NOT NULL,   -- índice dentro de la ronda
  winner       TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, round, match_index)
);

ALTER TABLE bracket_group_predictions    DISABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_knockout_predictions DISABLE ROW LEVEL SECURITY;
