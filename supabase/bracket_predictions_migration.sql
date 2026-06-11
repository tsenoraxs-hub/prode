-- ============================================================
--  PRODE MUNDIAL 2026 — Migración: Predicciones de Bracket y Premios
--  Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── Predicciones de posición en cada grupo (A-L) ──────────────────────────
CREATE TABLE IF NOT EXISTS bracket_group_predictions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  world_group  TEXT        NOT NULL,   -- 'A', 'B', ... 'L'
  position     INTEGER     NOT NULL,   -- 1, 2, 3, 4
  team         TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, world_group, position)
);

-- ── Predicciones de eliminatoria (R32 → Final) ────────────────────────────
CREATE TABLE IF NOT EXISTS bracket_knockout_predictions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  round        TEXT        NOT NULL,   -- 'R32','R16','QF','SF','F','3rd'
  match_index  INTEGER     NOT NULL,   -- índice dentro de la ronda
  winner       TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, round, match_index)
);

-- ── Predicciones de premios individuales ─────────────────────────────────
-- award_key: 'golden_ball' | 'golden_boot' | 'best_young' | 'best_goalkeeper' | 'fair_play'
CREATE TABLE IF NOT EXISTS award_predictions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  award_key    TEXT        NOT NULL,
  value        TEXT        NOT NULL,   -- nombre del jugador o equipo
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, award_key)
);

-- ── Resultados reales de grupos (admin completa al finalizar fase) ─────────
CREATE TABLE IF NOT EXISTS bracket_group_results (
  world_group  TEXT        NOT NULL,  -- 'A', 'B', ... 'L'
  position     INTEGER     NOT NULL,  -- 1, 2, 3, 4
  team         TEXT        NOT NULL,
  PRIMARY KEY (world_group, position)
);

-- ── Resultados reales de premios (admin completa al finalizar torneo) ──────
CREATE TABLE IF NOT EXISTS award_results (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  award_key    TEXT        NOT NULL UNIQUE,
  value        TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Disable RLS (mismo esquema que el resto del proyecto) ─────────────────
ALTER TABLE bracket_group_predictions    DISABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_knockout_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE award_predictions            DISABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_group_results        DISABLE ROW LEVEL SECURITY;
ALTER TABLE award_results                DISABLE ROW LEVEL SECURITY;

-- ============================================================
--  SISTEMA DE PUNTOS (referencia)
-- ============================================================
--
--  PARTIDOS
--    +3  Resultado exacto (marcador clavado)
--    +1  Tendencia correcta (quién gana o empate, marcador errado)
--
--  BRACKET — FASE DE GRUPOS (por cada equipo en top-2)
--    +3  1° o 2° lugar exacto
--    +1  Equipo en top-2 pero posición incorrecta
--
--  BRACKET — ELIMINATORIA (ganador correcto por ronda)
--    +2  Ronda de 32
--    +3  Octavos de final
--    +4  Cuartos de final
--    +5  Semis
--    +4  3er lugar
--    +6  Subcampeón
--   +10  Campeón
--
--  PREMIOS INDIVIDUALES
--    +5  Balón de Oro (mejor jugador)
--    +5  Bota de Oro (goleador)
--    +3  Mejor jugador joven
--    +3  Guante de Oro (mejor portero)
--    +2  Premio Fair Play (equipo)
-- ============================================================
