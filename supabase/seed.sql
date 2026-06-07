-- ============================================================
--  PRODE MUNDIAL 2026 - Partidos Oficiales Fase de Grupos
--  Jornadas 1, 2 y parte de la Jornada 3
--  Ejecutar DESPUÉS de schema.sql
--
--  Grupos deducidos del cruce de emparejamientos:
--  A: México · Sudáfrica · Corea del Sur · República Checa
--  B: Canadá · Bosnia y Herzegovina · Qatar · Suiza
--  C: Haití · Escocia · Brasil · Marruecos
--  D: USA · Paraguay · Australia · Turquía
--  E: Costa de Marfil · Ecuador · Alemania · Curazao
--  F: Países Bajos · Japón · Suecia · Túnez
--
--  Jornada 3: los dos partidos del mismo grupo son SIMULTÁNEOS
--  (condición esencial del reglamento FIFA para evitar acuerdos)
-- ============================================================

-- Limpiar partidos de ejemplo previos (cascada a predictions)
DELETE FROM matches;

-- ============================================================
--  JORNADA 1
-- ============================================================

-- 11 Jun  (2 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('México',        'Sudáfrica',       '2026-06-11 15:00:00+00', 'pending'),  -- A
  ('Corea del Sur', 'República Checa', '2026-06-11 21:00:00+00', 'pending');  -- A

-- 12 Jun  (2 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Canadá', 'Bosnia y Herzegovina', '2026-06-12 15:00:00+00', 'pending'),   -- B
  ('USA',    'Paraguay',             '2026-06-12 21:00:00+00', 'pending');   -- D

-- 13 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Haití',     'Escocia',   '2026-06-13 13:00:00+00', 'pending'),  -- C
  ('Australia', 'Turquía',   '2026-06-13 16:00:00+00', 'pending'),  -- D
  ('Brasil',    'Marruecos', '2026-06-13 19:00:00+00', 'pending'),  -- C
  ('Qatar',     'Suiza',     '2026-06-13 22:00:00+00', 'pending');  -- B

-- 14 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Costa de Marfil', 'Ecuador',      '2026-06-14 13:00:00+00', 'pending'),  -- E
  ('Alemania',        'Curazao',      '2026-06-14 16:00:00+00', 'pending'),  -- E
  ('Países Bajos',    'Japón',        '2026-06-14 19:00:00+00', 'pending'),  -- F
  ('Suecia',          'Túnez',        '2026-06-14 22:00:00+00', 'pending');  -- F

-- 15 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Arabia Saudita', 'Uruguay',       '2026-06-15 13:00:00+00', 'pending'),  -- G
  ('España',         'Cabo Verde',    '2026-06-15 16:00:00+00', 'pending'),  -- G
  ('Irán',           'Nueva Zelanda', '2026-06-15 19:00:00+00', 'pending'),  -- H
  ('Bélgica',        'Egipto',        '2026-06-15 22:00:00+00', 'pending');  -- H

-- 16 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Francia',   'Senegal',  '2026-06-16 13:00:00+00', 'pending'),  -- I
  ('Irak',      'Noruega',  '2026-06-16 16:00:00+00', 'pending'),  -- I
  ('Argentina', 'Argelia',  '2026-06-16 19:00:00+00', 'pending'),  -- J
  ('Austria',   'Jordania', '2026-06-16 22:00:00+00', 'pending');  -- J

-- 17 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Ghana',      'Panamá',   '2026-06-17 13:00:00+00', 'pending'),  -- K
  ('Inglaterra', 'Croacia',  '2026-06-17 16:00:00+00', 'pending'),  -- K
  ('Portugal',   'RD Congo', '2026-06-17 19:00:00+00', 'pending'),  -- L
  ('Uzbekistán', 'Colombia', '2026-06-17 22:00:00+00', 'pending');  -- L

-- ============================================================
--  JORNADA 2
-- ============================================================

-- 18 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('República Checa', 'Sudáfrica',            '2026-06-18 13:00:00+00', 'pending'),  -- A
  ('Suiza',           'Bosnia y Herzegovina', '2026-06-18 16:00:00+00', 'pending'),  -- B
  ('Canadá',          'Qatar',               '2026-06-18 19:00:00+00', 'pending'),  -- B
  ('México',          'Corea del Sur',        '2026-06-18 22:00:00+00', 'pending');  -- A

-- 19 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Brasil',  'Haití',    '2026-06-19 13:00:00+00', 'pending'),   -- C
  ('Escocia', 'Marruecos','2026-06-19 16:00:00+00', 'pending'),   -- C
  ('Turquía', 'Paraguay', '2026-06-19 19:00:00+00', 'pending'),   -- D
  ('USA',     'Australia','2026-06-19 22:00:00+00', 'pending');   -- D

-- 20 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Alemania',     'Costa de Marfil', '2026-06-20 13:00:00+00', 'pending'),  -- E
  ('Ecuador',      'Curazao',         '2026-06-20 16:00:00+00', 'pending'),  -- E
  ('Países Bajos', 'Suecia',          '2026-06-20 19:00:00+00', 'pending'),  -- F
  ('Túnez',        'Japón',           '2026-06-20 22:00:00+00', 'pending');  -- F

-- 21 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Uruguay',      'Cabo Verde',    '2026-06-21 13:00:00+00', 'pending'),  -- G
  ('España',       'Arabia Saudita','2026-06-21 16:00:00+00', 'pending'),  -- G
  ('Bélgica',      'Irán',          '2026-06-21 19:00:00+00', 'pending'),  -- H
  ('Nueva Zelanda','Egipto',         '2026-06-21 22:00:00+00', 'pending');  -- H

-- 22 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Noruega',   'Senegal', '2026-06-22 13:00:00+00', 'pending'),  -- I
  ('Francia',   'Irak',    '2026-06-22 16:00:00+00', 'pending'),  -- I
  ('Argentina', 'Austria', '2026-06-22 19:00:00+00', 'pending'),  -- J
  ('Jordania',  'Argelia', '2026-06-22 22:00:00+00', 'pending');  -- J

-- 23 Jun  (4 partidos)
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Inglaterra', 'Ghana',      '2026-06-23 13:00:00+00', 'pending'),  -- K
  ('Panamá',     'Croacia',    '2026-06-23 16:00:00+00', 'pending'),  -- K
  ('Portugal',   'Uzbekistán', '2026-06-23 19:00:00+00', 'pending'),  -- L
  ('Colombia',   'RD Congo',   '2026-06-23 22:00:00+00', 'pending');  -- L

-- ============================================================
--  JORNADA 3 - Ronda Final de Grupos
--  ★ SIMULTÁNEOS: los dos partidos del mismo grupo arrancan
--    exactamente a la misma hora (obligación reglamentaria FIFA)
-- ============================================================

-- 24 Jun — Grupos A, B y C
-- Grupo B: 14:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Suiza',                'Canadá',  '2026-06-24 14:00:00+00', 'pending'),
  ('Bosnia y Herzegovina', 'Qatar',   '2026-06-24 14:00:00+00', 'pending');

-- Grupo C: 18:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Escocia',   'Brasil',    '2026-06-24 18:00:00+00', 'pending'),
  ('Marruecos', 'Haití',     '2026-06-24 18:00:00+00', 'pending');

-- Grupo A: 22:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('República Checa', 'México',        '2026-06-24 22:00:00+00', 'pending'),
  ('Sudáfrica',       'Corea del Sur', '2026-06-24 22:00:00+00', 'pending');

-- 25 Jun — Grupos D, E y F
-- Grupo D: 14:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Turquía',  'USA',       '2026-06-25 14:00:00+00', 'pending'),
  ('Paraguay', 'Australia', '2026-06-25 14:00:00+00', 'pending');

-- Grupo E: 18:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Curazao', 'Costa de Marfil', '2026-06-25 18:00:00+00', 'pending'),
  ('Ecuador', 'Alemania',        '2026-06-25 18:00:00+00', 'pending');

-- Grupo F: 22:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Japón',  'Suecia',        '2026-06-25 22:00:00+00', 'pending'),
  ('Túnez',  'Países Bajos',  '2026-06-25 22:00:00+00', 'pending');

-- 26 Jun — Grupos G, H e I
-- Grupo G: 14:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Arabia Saudita', 'Cabo Verde', '2026-06-26 14:00:00+00', 'pending'),
  ('Uruguay',        'España',     '2026-06-26 14:00:00+00', 'pending');

-- Grupo H: 18:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Irán',          'Egipto',   '2026-06-26 18:00:00+00', 'pending'),
  ('Nueva Zelanda', 'Bélgica',  '2026-06-26 18:00:00+00', 'pending');

-- Grupo I: 22:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Francia',  'Noruega', '2026-06-26 22:00:00+00', 'pending'),
  ('Senegal',  'Irak',    '2026-06-26 22:00:00+00', 'pending');

-- 27 Jun — Grupos J, K y L
-- Grupo J: 14:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Argentina', 'Jordania', '2026-06-27 14:00:00+00', 'pending'),
  ('Argelia',   'Austria',  '2026-06-27 14:00:00+00', 'pending');

-- Grupo K: 18:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Ghana',   'Croacia',     '2026-06-27 18:00:00+00', 'pending'),
  ('Panamá',  'Inglaterra',  '2026-06-27 18:00:00+00', 'pending');

-- Grupo L: 22:00 UTC  ──────────────────────────────────────
INSERT INTO matches (team_a, team_b, match_date, status) VALUES
  ('Portugal', 'Colombia',   '2026-06-27 22:00:00+00', 'pending'),
  ('RD Congo', 'Uzbekistán', '2026-06-27 22:00:00+00', 'pending');

-- ============================================================
--  Total: 72 partidos (Jornadas 1, 2 y 3 completas)
-- ============================================================
