-- ============================================================
--  PRODE MUNDIAL 2026 — Seed de partidos
--  Horarios confirmados en CEST (UTC+2) → almacenados en UTC
--  Ejecutar en Supabase SQL Editor
--  Usa INSERT ... ON CONFLICT DO NOTHING (seguro de re-ejecutar)
-- ============================================================

-- Limpiar partidos existentes (comentar si no se desea)
-- TRUNCATE matches CASCADE;

INSERT INTO matches (team_a, team_b, match_date, status)
VALUES

-- ══════════════════════════════════════════════════════════════
--  FASE DE GRUPOS — Ronda 1 (Jornada 1)
-- ══════════════════════════════════════════════════════════════

-- Grupo A
('México',       'Sudáfrica',      '2026-06-11 19:00:00+00', 'pending'),  -- 21:00 CEST ✓ confirmado
('Corea del Sur','Rep. Checa',     '2026-06-12 02:00:00+00', 'pending'),  -- 04:00 CEST ✓ confirmado

-- Grupo B
('Canadá',       'Bosnia y Herz.', '2026-06-12 19:00:00+00', 'pending'),  -- 21:00 CEST ✓ confirmado
('Qatar',        'Suiza',          '2026-06-13 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo C
('Haití',        'Escocia',        '2026-06-13 19:00:00+00', 'pending'),  -- 21:00 CEST
('Brasil',       'Marruecos',      '2026-06-14 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo D
('USA',          'Paraguay',       '2026-06-13 01:00:00+00', 'pending'),  -- 03:00 CEST ✓ confirmado
('Australia',    'Turquía',        '2026-06-14 19:00:00+00', 'pending'),  -- 21:00 CEST

-- Grupo E
('C. de Marfil', 'Ecuador',        '2026-06-14 16:00:00+00', 'pending'),  -- 18:00 CEST
('Alemania',     'Curazao',        '2026-06-15 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo F
('Países Bajos', 'Japón',          '2026-06-14 22:00:00+00', 'pending'),  -- 00:00 CEST (+1)
('Suecia',       'Túnez',          '2026-06-15 19:00:00+00', 'pending'),  -- 21:00 CEST

-- Grupo G
('Arabia Saudita','Uruguay',       '2026-06-15 02:00:00+00', 'pending'),  -- 04:00 CEST
('España',       'Cabo Verde',     '2026-06-15 16:00:00+00', 'pending'),  -- 18:00 CEST ✓ confirmado

-- Grupo H
('Irán',         'Nueva Zelanda',  '2026-06-15 22:00:00+00', 'pending'),  -- 00:00 CEST (+1)
('Bélgica',      'Egipto',         '2026-06-16 19:00:00+00', 'pending'),  -- 21:00 CEST

-- Grupo I
('Francia',      'Irak',           '2026-06-16 16:00:00+00', 'pending'),  -- 18:00 CEST
('Noruega',      'Senegal',        '2026-06-17 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo J
('Argentina',    'Argelia',        '2026-06-16 22:00:00+00', 'pending'),  -- 00:00 CEST (+1)
('Austria',      'Jordania',       '2026-06-17 19:00:00+00', 'pending'),  -- 21:00 CEST

-- Grupo K
('Ghana',        'Panamá',         '2026-06-17 16:00:00+00', 'pending'),  -- 18:00 CEST
('Inglaterra',   'Croacia',        '2026-06-18 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo L
('Portugal',     'RD Congo',       '2026-06-17 22:00:00+00', 'pending'),  -- 00:00 CEST (+1)
('Uzbekistán',   'Colombia',       '2026-06-18 19:00:00+00', 'pending'),  -- 21:00 CEST

-- ══════════════════════════════════════════════════════════════
--  FASE DE GRUPOS — Ronda 2 (Jornada 2)
-- ══════════════════════════════════════════════════════════════

-- Grupo A
('México',       'Corea del Sur',  '2026-06-18 16:00:00+00', 'pending'),  -- 18:00 CEST
('Sudáfrica',    'Rep. Checa',     '2026-06-19 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo B
('Canadá',       'Qatar',          '2026-06-18 22:00:00+00', 'pending'),  -- 00:00 CEST (+1)
('Bosnia y Herz.','Suiza',         '2026-06-19 19:00:00+00', 'pending'),  -- 21:00 CEST

-- Grupo C
('Haití',        'Brasil',         '2026-06-19 16:00:00+00', 'pending'),  -- 18:00 CEST
('Escocia',      'Marruecos',      '2026-06-20 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo D
('USA',          'Australia',      '2026-06-19 22:00:00+00', 'pending'),  -- 00:00 CEST (+1)
('Paraguay',     'Turquía',        '2026-06-20 19:00:00+00', 'pending'),  -- 21:00 CEST

-- Grupo E
('C. de Marfil', 'Alemania',       '2026-06-20 16:00:00+00', 'pending'),  -- 18:00 CEST
('Ecuador',      'Curazao',        '2026-06-21 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo F
('Países Bajos', 'Suecia',         '2026-06-20 22:00:00+00', 'pending'),  -- 00:00 CEST (+1)
('Japón',        'Túnez',          '2026-06-21 19:00:00+00', 'pending'),  -- 21:00 CEST

-- Grupo G
('España',       'Arabia Saudita', '2026-06-21 16:00:00+00', 'pending'),  -- 18:00 CEST ✓ confirmado
('Cabo Verde',   'Uruguay',        '2026-06-22 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo H
('Irán',         'Bélgica',        '2026-06-21 22:00:00+00', 'pending'),  -- 00:00 CEST (+1)
('Nueva Zelanda','Egipto',         '2026-06-22 19:00:00+00', 'pending'),  -- 21:00 CEST

-- Grupo I
('Francia',      'Noruega',        '2026-06-22 16:00:00+00', 'pending'),  -- 18:00 CEST
('Irak',         'Senegal',        '2026-06-23 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo J
('Argentina',    'Austria',        '2026-06-22 22:00:00+00', 'pending'),  -- 00:00 CEST (+1)
('Argelia',      'Jordania',       '2026-06-23 19:00:00+00', 'pending'),  -- 21:00 CEST

-- Grupo K
('Ghana',        'Inglaterra',     '2026-06-23 16:00:00+00', 'pending'),  -- 18:00 CEST
('Panamá',       'Croacia',        '2026-06-24 02:00:00+00', 'pending'),  -- 04:00 CEST

-- Grupo L
('Portugal',     'Uzbekistán',     '2026-06-23 22:00:00+00', 'pending'),  -- 00:00 CEST (+1)
('RD Congo',     'Colombia',       '2026-06-24 19:00:00+00', 'pending'),  -- 21:00 CEST

-- ══════════════════════════════════════════════════════════════
--  FASE DE GRUPOS — Ronda 3 (Jornada 3 — simultánea por grupo)
-- ══════════════════════════════════════════════════════════════

-- Grupo A (simultáneos)
('México',       'Rep. Checa',     '2026-06-25 16:00:00+00', 'pending'),  -- 18:00 CEST
('Sudáfrica',    'Corea del Sur',  '2026-06-25 16:00:00+00', 'pending'),  -- 18:00 CEST

-- Grupo B (simultáneos)
('Canadá',       'Suiza',          '2026-06-25 20:00:00+00', 'pending'),  -- 22:00 CEST
('Bosnia y Herz.','Qatar',         '2026-06-25 20:00:00+00', 'pending'),  -- 22:00 CEST

-- Grupo C (simultáneos)
('Haití',        'Marruecos',      '2026-06-26 16:00:00+00', 'pending'),  -- 18:00 CEST
('Escocia',      'Brasil',         '2026-06-26 16:00:00+00', 'pending'),  -- 18:00 CEST

-- Grupo D (simultáneos)
('USA',          'Turquía',        '2026-06-26 20:00:00+00', 'pending'),  -- 22:00 CEST
('Paraguay',     'Australia',      '2026-06-26 20:00:00+00', 'pending'),  -- 22:00 CEST

-- Grupo E (simultáneos)
('C. de Marfil', 'Curazao',        '2026-06-27 16:00:00+00', 'pending'),  -- 18:00 CEST
('Ecuador',      'Alemania',       '2026-06-27 16:00:00+00', 'pending'),  -- 18:00 CEST

-- Grupo F (simultáneos)
('Países Bajos', 'Túnez',          '2026-06-27 20:00:00+00', 'pending'),  -- 22:00 CEST
('Japón',        'Suecia',         '2026-06-27 20:00:00+00', 'pending'),  -- 22:00 CEST

-- Grupo G (simultáneos)
('Uruguay',      'España',         '2026-06-27 00:00:00+00', 'pending'),  -- 02:00 CEST ✓ confirmado
('Cabo Verde',   'Arabia Saudita', '2026-06-28 16:00:00+00', 'pending'),  -- 18:00 CEST

-- Grupo H (simultáneos)
('Irán',         'Egipto',         '2026-06-28 20:00:00+00', 'pending'),  -- 22:00 CEST
('Nueva Zelanda','Bélgica',        '2026-06-28 20:00:00+00', 'pending'),  -- 22:00 CEST

-- Grupo I (simultáneos)
('Francia',      'Senegal',        '2026-06-29 16:00:00+00', 'pending'),  -- 18:00 CEST
('Irak',         'Noruega',        '2026-06-29 16:00:00+00', 'pending'),  -- 18:00 CEST

-- Grupo J (simultáneos)
('Argentina',    'Jordania',       '2026-06-29 20:00:00+00', 'pending'),  -- 22:00 CEST
('Argelia',      'Austria',        '2026-06-29 20:00:00+00', 'pending'),  -- 22:00 CEST

-- Grupo K (simultáneos)
('Ghana',        'Croacia',        '2026-06-30 16:00:00+00', 'pending'),  -- 18:00 CEST
('Panamá',       'Inglaterra',     '2026-06-30 16:00:00+00', 'pending'),  -- 18:00 CEST

-- Grupo L (simultáneos)
('Portugal',     'Colombia',       '2026-06-30 20:00:00+00', 'pending'),  -- 22:00 CEST
('RD Congo',     'Uzbekistán',     '2026-06-30 20:00:00+00', 'pending'),  -- 22:00 CEST

-- ══════════════════════════════════════════════════════════════
--  RONDA DE 32 (seeding FIFA 2026)
-- ══════════════════════════════════════════════════════════════

('1°A',  '2°B',  '2026-07-03 16:00:00+00', 'pending'),
('1°C',  '2°D',  '2026-07-03 20:00:00+00', 'pending'),
('1°E',  '2°F',  '2026-07-04 16:00:00+00', 'pending'),
('1°G',  '2°H',  '2026-07-04 20:00:00+00', 'pending'),
('1°I',  '2°J',  '2026-07-05 16:00:00+00', 'pending'),
('1°K',  '2°L',  '2026-07-05 20:00:00+00', 'pending'),
('3°ABC','3°DEF','2026-07-06 16:00:00+00', 'pending'),
('3°GHI','3°JKL','2026-07-06 20:00:00+00', 'pending'),
('1°B',  '2°A',  '2026-07-07 16:00:00+00', 'pending'),
('1°D',  '2°C',  '2026-07-07 20:00:00+00', 'pending'),
('1°F',  '2°E',  '2026-07-08 16:00:00+00', 'pending'),
('1°H',  '2°G',  '2026-07-08 20:00:00+00', 'pending'),
('1°J',  '2°I',  '2026-07-09 16:00:00+00', 'pending'),
('1°L',  '2°K',  '2026-07-09 20:00:00+00', 'pending'),
('3°ABCD','3°EFGH','2026-07-10 16:00:00+00', 'pending'),
('3°IJKL','TBD', '2026-07-10 20:00:00+00', 'pending'),

-- ══════════════════════════════════════════════════════════════
--  OCTAVOS DE FINAL
-- ══════════════════════════════════════════════════════════════

('TBD R32', 'TBD R32', '2026-07-14 16:00:00+00', 'pending'),
('TBD R32', 'TBD R32', '2026-07-14 20:00:00+00', 'pending'),
('TBD R32', 'TBD R32', '2026-07-15 16:00:00+00', 'pending'),
('TBD R32', 'TBD R32', '2026-07-15 20:00:00+00', 'pending'),
('TBD R32', 'TBD R32', '2026-07-16 16:00:00+00', 'pending'),
('TBD R32', 'TBD R32', '2026-07-16 20:00:00+00', 'pending'),
('TBD R32', 'TBD R32', '2026-07-17 16:00:00+00', 'pending'),
('TBD R32', 'TBD R32', '2026-07-17 20:00:00+00', 'pending'),

-- ══════════════════════════════════════════════════════════════
--  CUARTOS DE FINAL
-- ══════════════════════════════════════════════════════════════

('TBD Octavos', 'TBD Octavos', '2026-07-21 16:00:00+00', 'pending'),
('TBD Octavos', 'TBD Octavos', '2026-07-21 20:00:00+00', 'pending'),
('TBD Octavos', 'TBD Octavos', '2026-07-22 16:00:00+00', 'pending'),
('TBD Octavos', 'TBD Octavos', '2026-07-22 20:00:00+00', 'pending'),

-- ══════════════════════════════════════════════════════════════
--  SEMIFINALES
-- ══════════════════════════════════════════════════════════════

('TBD Cuartos', 'TBD Cuartos', '2026-07-25 20:00:00+00', 'pending'),
('TBD Cuartos', 'TBD Cuartos', '2026-07-26 20:00:00+00', 'pending'),

-- ══════════════════════════════════════════════════════════════
--  TERCER PUESTO Y FINAL
-- ══════════════════════════════════════════════════════════════

('TBD Semis', 'TBD Semis', '2026-07-29 20:00:00+00', 'pending'),
('TBD Semis', 'TBD Semis', '2026-07-30 20:00:00+00', 'pending')

ON CONFLICT DO NOTHING;

-- ============================================================
--  NOTAS
--  • Horarios CEST (UTC+2) → UTC: restar 2 horas
--  • 7 partidos con horario confirmado marcados con ✓
--  • Ronda 3 de grupos: partidos simultáneos dentro de cada grupo
--  • Fases finales: fechas estimadas oficiales FIFA 2026
--  • Los TBD se actualizarán desde el panel admin
-- ============================================================
