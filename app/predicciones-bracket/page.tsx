'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ChevronUp, ChevronDown, Save, Trophy, Loader2, CheckCircle2 } from 'lucide-react'

// ─── Grupos del Mundial 2026 ───────────────────────────────────────────────
const GROUPS: { id: string; teams: string[] }[] = [
  { id: 'A', teams: ['México', 'Sudáfrica', 'Corea del Sur', 'Rep. Checa'] },
  { id: 'B', teams: ['Canadá', 'Bosnia y Herz.', 'Qatar', 'Suiza'] },
  { id: 'C', teams: ['Haití', 'Escocia', 'Brasil', 'Marruecos'] },
  { id: 'D', teams: ['USA', 'Paraguay', 'Australia', 'Turquía'] },
  { id: 'E', teams: ['C. de Marfil', 'Ecuador', 'Alemania', 'Curazao'] },
  { id: 'F', teams: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  { id: 'G', teams: ['Arabia Saudita', 'Uruguay', 'España', 'Cabo Verde'] },
  { id: 'H', teams: ['Irán', 'Nueva Zelanda', 'Bélgica', 'Egipto'] },
  { id: 'I', teams: ['Francia', 'Irak', 'Noruega', 'Senegal'] },
  { id: 'J', teams: ['Argentina', 'Argelia', 'Austria', 'Jordania'] },
  { id: 'K', teams: ['Ghana', 'Panamá', 'Inglaterra', 'Croacia'] },
  { id: 'L', teams: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'] },
]

// Nombres de equipos normalizados (bracket usa nombres completos, seed a veces difiere)
const TEAM_NORMALIZE: Record<string, string> = {
  'Rep. Checa': 'República Checa',
  'Bosnia y Herz.': 'Bosnia y Herzegovina',
  'C. de Marfil': 'Costa de Marfil',
}

const normalize = (t: string) => TEAM_NORMALIZE[t] ?? t

// Partidos del grupo inferidos de los equipos
const GROUP_MATCHES: Record<string, [string, string][]> = {}
for (const g of GROUPS) {
  const t = g.teams
  GROUP_MATCHES[g.id] = [
    [t[0], t[1]], [t[2], t[3]],
    [t[0], t[2]], [t[1], t[3]],
    [t[0], t[3]], [t[1], t[2]],
  ]
}

// ─── Bracket 2026: Ronda de 32 (formato FIFA) ─────────────────────────────
// Cada slot: [grupo, posición, 'top'|'bot'] donde bot = 3er lugar
const R32_STRUCTURE: { a: string; b: string }[] = [
  { a: '1A', b: '2B' },
  { a: '1C', b: '2D' },
  { a: '1E', b: '2F' },
  { a: '1G', b: '2H' },
  { a: '1I', b: '2J' },
  { a: '1K', b: '2L' },
  { a: '3A/B/C', b: '3D/E/F' },
  { a: '3G/H/I', b: '3J/K/L' },
  { a: '1B', b: '2A' },
  { a: '1D', b: '2C' },
  { a: '1F', b: '2E' },
  { a: '1H', b: '2G' },
  { a: '1J', b: '2I' },
  { a: '1L', b: '2K' },
  { a: '3A/B/C/D', b: '3E/F/G/H' },
  { a: '3I/J/K/L', b: '...' },
]

const ROUND_KEYS = ['R32', 'R16', 'QF', 'SF', 'F'] as const
type RoundKey = typeof ROUND_KEYS[number]

const ROUND_LABELS: Record<RoundKey | '3rd', string> = {
  R32: 'Ronda de 32',
  R16: 'Octavos',
  QF: 'Cuartos',
  SF: 'Semis',
  F: 'Final',
  '3rd': '3er Lugar',
}

const ROUND_SIZES: Record<RoundKey, number> = { R32: 16, R16: 8, QF: 4, SF: 2, F: 1 }

const GROUP_COLORS: Record<string, string> = {
  A: 'from-red-500 to-red-700',
  B: 'from-blue-500 to-blue-700',
  C: 'from-yellow-500 to-yellow-700',
  D: 'from-purple-500 to-purple-700',
  E: 'from-pink-500 to-pink-700',
  F: 'from-cyan-500 to-cyan-700',
  G: 'from-orange-500 to-orange-700',
  H: 'from-teal-500 to-teal-700',
  I: 'from-lime-500 to-lime-700',
  J: 'from-indigo-500 to-indigo-700',
  K: 'from-rose-500 to-rose-700',
  L: 'from-emerald-500 to-emerald-700',
}

// ─── Tipos ────────────────────────────────────────────────────────────────
type Match = {
  id: string
  team_a: string
  team_b: string
  real_score_a: number | null
  real_score_b: number | null
  status: 'pending' | 'finished'
}

// Posiciones reales por grupo calculadas de los resultados
type GroupStanding = {
  team: string
  pts: number
  gf: number
  gc: number
  gd: number
  played: number
}

// Predicciones de grupos: groupId → ordered array of 4 teams
type GroupPreds = Record<string, string[]>
// Predicciones de bracket: round → match_index → winner team
type KnockoutPreds = Record<string, Record<number, string>>

// ─── Cálculo de tabla real ─────────────────────────────────────────────────
function calcStandings(groupId: string, matches: Match[]): GroupStanding[] {
  const teams = GROUPS.find(g => g.id === groupId)!.teams
  const standings: Record<string, GroupStanding> = {}
  for (const t of teams) {
    standings[normalize(t)] = { team: t, pts: 0, gf: 0, gc: 0, gd: 0, played: 0 }
    standings[t] = standings[normalize(t)] // alias
  }

  for (const m of matches) {
    if (m.status !== 'finished' || m.real_score_a === null || m.real_score_b === null) continue
    const a = m.team_a
    const b = m.team_b
    const sa = m.real_score_a
    const sb = m.real_score_b
    if (!standings[a] || !standings[b]) continue
    standings[a].played++; standings[b].played++
    standings[a].gf += sa; standings[a].gc += sb; standings[a].gd += sa - sb
    standings[b].gf += sb; standings[b].gc += sa; standings[b].gd += sb - sa
    if (sa > sb) { standings[a].pts += 3 }
    else if (sa < sb) { standings[b].pts += 3 }
    else { standings[a].pts += 1; standings[b].pts += 1 }
  }

  // Deduplicate (normalize created alias keys)
  const unique = teams.map(t => standings[normalize(t)] ?? standings[t])
  return unique.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
}

// ─── Resolver slot de bracket a nombre de equipo ──────────────────────────
function resolveSlot(
  slot: string,
  groupPreds: GroupPreds,
): string {
  if (!slot.includes('/') && /^\d/.test(slot)) {
    const pos = parseInt(slot[0]) - 1
    const gId = slot[1]
    const pred = groupPreds[gId]
    if (pred && pred[pos]) return pred[pos]
    return slot
  }
  if (slot.startsWith('3')) return slot // terceros — TBD
  return slot
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function PrediccionesBracketPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<'grupos' | 'llaves'>('grupos')
  const [matches, setMatches] = useState<Match[]>([])
  const [groupPreds, setGroupPreds] = useState<GroupPreds>({})
  const [knockoutPreds, setKnockoutPreds] = useState<KnockoutPreds>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Inicializar predicciones de grupo con orden default ────────────────
  const initGroupPreds = useCallback((existing: GroupPreds) => {
    const init: GroupPreds = {}
    for (const g of GROUPS) {
      init[g.id] = existing[g.id] ?? [...g.teams]
    }
    setGroupPreds(init)
  }, [])

  // ── Cargar datos ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = localStorage.getItem('userId')
    if (!id) { router.replace('/'); return }
    setUserId(id)

    ;(async () => {
      const [matchRes, gPredRes, kPredRes] = await Promise.all([
        supabase.from('matches').select('*'),
        supabase.from('bracket_group_predictions').select('*').eq('user_id', id),
        supabase.from('bracket_knockout_predictions').select('*').eq('user_id', id),
      ])

      setMatches(matchRes.data || [])

      // Reconstruir groupPreds desde DB
      const existingGroup: GroupPreds = {}
      if (gPredRes.data && gPredRes.data.length > 0) {
        for (const row of gPredRes.data) {
          if (!existingGroup[row.world_group]) existingGroup[row.world_group] = ['', '', '', '']
          existingGroup[row.world_group][row.position - 1] = row.team
        }
      }
      initGroupPreds(existingGroup)

      // Reconstruir knockoutPreds desde DB
      const existingKnockout: KnockoutPreds = {}
      if (kPredRes.data) {
        for (const row of kPredRes.data) {
          if (!existingKnockout[row.round]) existingKnockout[row.round] = {}
          existingKnockout[row.round][row.match_index] = row.winner
        }
      }
      setKnockoutPreds(existingKnockout)
      setLoading(false)
    })()
  }, [router, initGroupPreds])

  // ── Mover equipo en predicción de grupo ───────────────────────────────
  const moveTeam = (gId: string, idx: number, dir: -1 | 1) => {
    setGroupPreds(prev => {
      const arr = [...(prev[gId] ?? [])]
      const target = idx + dir
      if (target < 0 || target >= arr.length) return prev
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return { ...prev, [gId]: arr }
    })
    setSaved(false)
  }

  // ── Seleccionar ganador en llave ──────────────────────────────────────
  const pickWinner = (round: string, matchIdx: number, team: string) => {
    setKnockoutPreds(prev => ({
      ...prev,
      [round]: { ...(prev[round] ?? {}), [matchIdx]: team },
    }))
    setSaved(false)

    // Propagar: si el ganador avanza a la siguiente ronda, limpiar esa selección
    const rounds = [...ROUND_KEYS, '3rd'] as string[]
    const nextRoundIdx = rounds.indexOf(round) + 1
    if (nextRoundIdx < rounds.length) {
      const nextRound = rounds[nextRoundIdx]
      const nextMatchIdx = Math.floor(matchIdx / 2)
      setKnockoutPreds(prev => {
        const nextRoundPreds = { ...(prev[nextRound] ?? {}) }
        delete nextRoundPreds[nextMatchIdx]
        return { ...prev, [nextRound]: nextRoundPreds }
      })
    }
  }

  // ── Guardar todo ──────────────────────────────────────────────────────
  const saveAll = async () => {
    if (!userId) return
    setSaving(true)

    // Upsert group predictions
    const groupRows = []
    for (const [gId, teams] of Object.entries(groupPreds)) {
      for (let i = 0; i < teams.length; i++) {
        if (teams[i]) {
          groupRows.push({ user_id: userId, world_group: gId, position: i + 1, team: teams[i] })
        }
      }
    }

    // Upsert knockout predictions
    const knockoutRows = []
    for (const [round, matches] of Object.entries(knockoutPreds)) {
      for (const [idx, winner] of Object.entries(matches)) {
        if (winner) {
          knockoutRows.push({ user_id: userId, round, match_index: Number(idx), winner })
        }
      }
    }

    await Promise.all([
      groupRows.length > 0
        ? supabase.from('bracket_group_predictions')
            .upsert(groupRows, { onConflict: 'user_id,world_group,position' })
        : Promise.resolve(),
      knockoutRows.length > 0
        ? supabase.from('bracket_knockout_predictions')
            .upsert(knockoutRows, { onConflict: 'user_id,round,match_index' })
        : Promise.resolve(),
    ])

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // ── Resolver slot para bracket display ───────────────────────────────
  const getSlotTeam = (slot: string, round: string, matchIdx: number): string => {
    if (round === 'R32') return resolveSlot(slot, groupPreds)
    // Para rondas siguientes, el equipo viene del ganador de la ronda anterior
    const prevRound = ROUND_KEYS[ROUND_KEYS.indexOf(round as RoundKey) - 1]
    const prevMatchIdx = matchIdx * 2 + (slot === 'b' ? 1 : 0)
    return knockoutPreds[prevRound]?.[prevMatchIdx] ?? '?'
  }

  // ─── Render ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="animate-bounceBall text-5xl">⚽</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-slate-900">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 animate-slideInLeft">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="p-2.5 glass rounded-xl text-white hover:bg-white/10 transition-all press">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-white">Mis Predicciones 🏆</h1>
              <p className="text-green-300 text-xs">Ordená grupos y armá tu bracket</p>
            </div>
          </div>
          <button
            onClick={saveAll}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all press ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-white text-green-800 hover:bg-green-50'
            }`}
          >
            {saving
              ? <Loader2 size={15} className="animate-spin" />
              : saved
              ? <CheckCircle2 size={15} />
              : <Save size={15} />}
            {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4 max-w-4xl mx-auto">
        <div className="glass rounded-2xl p-1 flex border border-white/10">
          {(['grupos', 'llaves'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                tab === t
                  ? 'bg-white text-green-800 shadow'
                  : 'text-green-300 hover:text-white'
              }`}
            >
              {t === 'grupos' ? '📋 Grupos' : '🏆 Llaves'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Grupos ── */}
      {tab === 'grupos' && (
        <div className="px-4 pb-24 max-w-4xl mx-auto">
          <p className="text-green-400/70 text-xs text-center mb-4">
            Arrastrá los equipos con las flechas para predecir el orden final de cada grupo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GROUPS.map(g => {
              const realStandings = calcStandings(g.id, matches)
              const pred = groupPreds[g.id] ?? g.teams

              return (
                <div key={g.id} className="glass rounded-2xl overflow-hidden border border-white/10 animate-fadeInUp">
                  {/* Group header */}
                  <div className={`bg-gradient-to-r ${GROUP_COLORS[g.id]} px-4 py-2.5 flex items-center justify-between`}>
                    <span className="text-white font-black text-base">Grupo {g.id}</span>
                    {/* Show real pts if any match played */}
                    {realStandings.some(s => s.played > 0) && (
                      <span className="text-white/70 text-xs">resultados reales →</span>
                    )}
                  </div>

                  {/* Teams list */}
                  <div className="p-3 space-y-1.5">
                    {pred.map((team, ti) => {
                      const real = realStandings.find(
                        s => s.team === team || normalize(s.team) === normalize(team)
                      )
                      const hasReal = real && real.played > 0

                      return (
                        <div
                          key={team}
                          className={`flex items-center gap-2 px-2 py-2 rounded-xl border transition-colors ${
                            ti === 0
                              ? 'bg-yellow-500/20 border-yellow-500/30'
                              : ti === 1
                              ? 'bg-gray-400/10 border-white/10'
                              : 'bg-white/5 border-transparent'
                          }`}
                        >
                          {/* Position badge */}
                          <span className={`text-xs font-black w-5 text-center ${
                            ti === 0 ? 'text-yellow-400' : ti === 1 ? 'text-gray-300' : 'text-white/30'
                          }`}>
                            {ti + 1}
                          </span>

                          {/* Team name */}
                          <span className="text-white text-xs font-semibold flex-1 truncate">{team}</span>

                          {/* Real stats */}
                          {hasReal && (
                            <span className="text-green-400 text-xs font-mono tabular-nums">
                              {real!.pts}pts {real!.gd > 0 ? '+' : ''}{real!.gd}
                            </span>
                          )}

                          {/* Arrows */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveTeam(g.id, ti, -1)}
                              disabled={ti === 0}
                              className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 transition-colors"
                            >
                              <ChevronUp size={13} className="text-white" />
                            </button>
                            <button
                              onClick={() => moveTeam(g.id, ti, 1)}
                              disabled={ti === pred.length - 1}
                              className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 transition-colors"
                            >
                              <ChevronDown size={13} className="text-white" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Real standings compare (if any played) */}
                  {realStandings.some(s => s.played > 0) && (
                    <div className="px-3 pb-3">
                      <div className="bg-white/5 rounded-xl px-3 py-2">
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                          Tabla real actual
                        </p>
                        {realStandings.map((s, i) => (
                          <div key={s.team} className="flex items-center gap-2 py-0.5">
                            <span className={`text-[10px] font-black w-3 ${i < 2 ? 'text-green-400' : 'text-white/30'}`}>
                              {i + 1}
                            </span>
                            <span className="text-white/70 text-[11px] flex-1 truncate">{s.team}</span>
                            <span className="text-green-400 text-[10px] font-mono">{s.pts}p</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tab Llaves ── */}
      {tab === 'llaves' && (
        <KnockoutBracket
          groupPreds={groupPreds}
          knockoutPreds={knockoutPreds}
          onPick={pickWinner}
        />
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pt-8 pb-6 px-4 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <button
            onClick={saveAll}
            disabled={saving || saved}
            className={`press w-full py-3.5 rounded-2xl font-black text-base transition-all shadow-xl flex items-center justify-center gap-2 ${
              saved
                ? 'bg-green-500 text-white shadow-green-500/30'
                : 'bg-white text-green-800 hover:bg-green-50 shadow-black/30'
            }`}
          >
            {saving
              ? <><Loader2 size={18} className="animate-spin" /> Guardando…</>
              : saved
              ? <><CheckCircle2 size={18} /> ¡Predicciones guardadas!</>
              : <><Save size={18} /> Guardar predicciones</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente bracket eliminatoria ──────────────────────────────────────
function KnockoutBracket({
  groupPreds,
  knockoutPreds,
  onPick,
}: {
  groupPreds: GroupPreds
  knockoutPreds: KnockoutPreds
  onPick: (round: string, matchIdx: number, team: string) => void
}) {
  // Resolver los 16 slots del R32
  const r32Teams = R32_STRUCTURE.map(m => ({
    a: resolveSlot(m.a, groupPreds),
    b: resolveSlot(m.b, groupPreds),
  }))

  // Para cada ronda siguiente, los equipos vienen del ganador de la ronda anterior
  const getTeam = (round: RoundKey, matchIdx: number, side: 'a' | 'b'): string => {
    if (round === 'R32') {
      return side === 'a' ? r32Teams[matchIdx].a : r32Teams[matchIdx].b
    }
    const prevRound = ROUND_KEYS[ROUND_KEYS.indexOf(round) - 1]
    const prevMatchIdx = matchIdx * 2 + (side === 'b' ? 1 : 0)
    return knockoutPreds[prevRound]?.[prevMatchIdx] ?? '?'
  }

  const getSFLoser = (matchIdx: number): string => {
    const winner = knockoutPreds['SF']?.[matchIdx]
    const teamA = getTeam('SF', matchIdx, 'a')
    const teamB = getTeam('SF', matchIdx, 'b')
    if (!winner) return '?'
    return winner === teamA ? teamB : teamA
  }

  return (
    <div className="pb-28">
      {/* Scroll horizontal bracket */}
      <div className="overflow-x-auto px-4 pb-4">
        <div className="flex gap-4 min-w-max py-2">
          {ROUND_KEYS.map(round => {
            const count = ROUND_SIZES[round]
            return (
              <div key={round} className="flex flex-col animate-fadeInUp">
                {/* Round label */}
                <div className="mb-3 flex justify-center">
                  <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                    round === 'F'
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black'
                      : 'glass text-green-300 border border-white/10'
                  }`}>
                    {ROUND_LABELS[round]}
                  </span>
                </div>

                {/* Match slots */}
                <div
                  className="flex flex-col justify-around gap-3"
                  style={{ minHeight: `${count * 72}px` }}
                >
                  {Array.from({ length: count }).map((_, mIdx) => {
                    const teamA = getTeam(round, mIdx, 'a')
                    const teamB = getTeam(round, mIdx, 'b')
                    const winner = knockoutPreds[round]?.[mIdx]
                    const isFinal = round === 'F'

                    return (
                      <BracketMatch
                        key={mIdx}
                        teamA={teamA}
                        teamB={teamB}
                        winner={winner}
                        isFinal={isFinal}
                        onPickA={() => { if (teamA !== '?') onPick(round, mIdx, teamA) }}
                        onPickB={() => { if (teamB !== '?') onPick(round, mIdx, teamB) }}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* 3er puesto */}
          <div className="flex flex-col animate-fadeInUp">
            <div className="mb-3 flex justify-center">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full glass text-green-300 border border-white/10">
                3er Lugar
              </span>
            </div>
            <div className="flex flex-col justify-around gap-3" style={{ minHeight: '72px' }}>
              {(() => {
                const teamA = getSFLoser(0)
                const teamB = getSFLoser(1)
                const winner = knockoutPreds['3rd']?.[0]
                return (
                  <BracketMatch
                    teamA={teamA}
                    teamB={teamB}
                    winner={winner}
                    isFinal={false}
                    onPickA={() => { if (teamA !== '?') onPick('3rd', 0, teamA) }}
                    onPickB={() => { if (teamB !== '?') onPick('3rd', 0, teamB) }}
                  />
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Champion display */}
      {knockoutPreds['F']?.[0] && (
        <div className="px-4 mt-2 max-w-sm mx-auto animate-popIn">
          <div className="glass rounded-3xl p-6 border border-yellow-400/30 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-yellow-400 font-black text-xl">{knockoutPreds['F'][0]}</p>
            <p className="text-white/50 text-xs mt-1">Tu campeón del Mundial 2026</p>
          </div>
        </div>
      )}

      <p className="text-white/30 text-xs text-center mt-6 px-4">
        Tocá un equipo para elegirlo ganador · Los cambios en grupos actualizan automáticamente las llaves
      </p>
    </div>
  )
}

// ─── Slot individual del bracket ──────────────────────────────────────────
function BracketMatch({
  teamA, teamB, winner, isFinal, onPickA, onPickB,
}: {
  teamA: string; teamB: string; winner?: string
  isFinal: boolean
  onPickA: () => void; onPickB: () => void
}) {
  const isUnknown = (t: string) => t === '?' || t.includes('/')

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border w-36 ${
      isFinal ? 'border-yellow-400/40' : 'border-white/10'
    }`}>
      {[{ team: teamA, pick: onPickA }, { team: teamB, pick: onPickB }].map(({ team, pick }, si) => {
        const isWinner = winner === team
        const isLoser = winner && !isWinner && !isUnknown(team)
        const unknown = isUnknown(team)

        return (
          <button
            key={si}
            onClick={pick}
            disabled={unknown}
            className={`px-2.5 py-2 text-left transition-all ${
              si === 0
                ? `border-b ${isFinal ? 'border-yellow-400/20' : 'border-white/5'}`
                : ''
            } ${
              isWinner
                ? 'bg-green-500/30'
                : isLoser
                ? 'bg-white/3 opacity-40'
                : unknown
                ? 'bg-white/5'
                : 'bg-white/10 hover:bg-white/20 active:bg-white/30'
            }`}
          >
            <p className={`text-xs font-bold truncate ${
              isWinner ? 'text-green-300' : unknown ? 'text-white/20 italic' : 'text-white'
            }`}>
              {isWinner && '✓ '}{team}
            </p>
          </button>
        )
      })}
    </div>
  )
}
