'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Share2, Trophy, Target, BookOpen, Lock, CheckCircle2,
  Loader2, ChevronUp, ChevronDown, Save, Star, GitBranch,
} from 'lucide-react'

// ─── Mundial 2026 data ────────────────────────────────────────────────────────
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

const TEAM_NORMALIZE: Record<string, string> = {
  'Rep. Checa': 'República Checa',
  'Bosnia y Herz.': 'Bosnia y Herzegovina',
  'C. de Marfil': 'Costa de Marfil',
}
const normalize = (t: string) => TEAM_NORMALIZE[t] ?? t

const R32_STRUCTURE: { a: string; b: string }[] = [
  { a: '1A', b: '2B' }, { a: '1C', b: '2D' }, { a: '1E', b: '2F' },
  { a: '1G', b: '2H' }, { a: '1I', b: '2J' }, { a: '1K', b: '2L' },
  { a: '3A/B/C', b: '3D/E/F' }, { a: '3G/H/I', b: '3J/K/L' },
  { a: '1B', b: '2A' }, { a: '1D', b: '2C' }, { a: '1F', b: '2E' },
  { a: '1H', b: '2G' }, { a: '1J', b: '2I' }, { a: '1L', b: '2K' },
  { a: '3A/B/C/D', b: '3E/F/G/H' }, { a: '3I/J/K/L', b: '...' },
]

const ROUND_KEYS = ['R32', 'R16', 'QF', 'SF', 'F'] as const
type RoundKey = typeof ROUND_KEYS[number]
const ROUND_LABELS: Record<RoundKey | '3rd', string> = {
  R32: 'R32', R16: 'Octavos', QF: 'Cuartos', SF: 'Semis', F: 'Final', '3rd': '3er Lugar',
}
const ROUND_SIZES: Record<RoundKey, number> = { R32: 16, R16: 8, QF: 4, SF: 2, F: 1 }

const GROUP_COLORS: Record<string, string> = {
  A: 'from-red-500 to-red-700', B: 'from-blue-500 to-blue-700',
  C: 'from-yellow-500 to-yellow-700', D: 'from-purple-500 to-purple-700',
  E: 'from-pink-500 to-pink-700', F: 'from-cyan-500 to-cyan-700',
  G: 'from-orange-500 to-orange-700', H: 'from-teal-500 to-teal-700',
  I: 'from-lime-500 to-lime-700', J: 'from-indigo-500 to-indigo-700',
  K: 'from-rose-500 to-rose-700', L: 'from-emerald-500 to-emerald-700',
}

// ─── Sistema de puntos ─────────────────────────────────────────────────────────
const POINTS = {
  // Partidos
  EXACT_SCORE:      3,
  CORRECT_TENDENCY: 1,
  // Bracket grupos (por equipo)
  GROUP_EXACT_POS:  3,  // 1° o 2° lugar exacto
  GROUP_QUALIFIED:  1,  // equipo en top-2 pero posición errónea
  // Bracket eliminatoria (ganador correcto por ronda)
  R32:   2,
  R16:   3,
  QF:    4,
  SF:    5,
  THIRD: 4,
  RUNNER_UP: 6,
  CHAMPION: 10,
  // Premios individuales
  GOLDEN_BALL: 5,
  GOLDEN_BOOT: 5,
  BEST_YOUNG:  3,
  BEST_GK:     3,
  FAIR_PLAY:   2,
}

// ─── Premios ───────────────────────────────────────────────────────────────────
type AwardKey = 'golden_ball' | 'golden_boot' | 'best_young' | 'best_goalkeeper' | 'fair_play'
const AWARDS: { key: AwardKey; emoji: string; label: string; sublabel: string; pts: number }[] = [
  { key: 'golden_ball',    emoji: '⭐', label: 'Balón de Oro',        sublabel: 'Mejor jugador del torneo',      pts: POINTS.GOLDEN_BALL },
  { key: 'golden_boot',    emoji: '🥾', label: 'Bota de Oro',         sublabel: 'Máximo goleador',               pts: POINTS.GOLDEN_BOOT },
  { key: 'best_young',     emoji: '🌱', label: 'Mejor Jugador Joven',  sublabel: 'Sub-21 destacado',              pts: POINTS.BEST_YOUNG  },
  { key: 'best_goalkeeper',emoji: '🧤', label: 'Guante de Oro',        sublabel: 'Mejor portero',                 pts: POINTS.BEST_GK     },
  { key: 'fair_play',      emoji: '🤝', label: 'Premio Fair Play',     sublabel: 'Equipo con mejor conducta',     pts: POINTS.FAIR_PLAY   },
]

// ─── Types ─────────────────────────────────────────────────────────────────────
type Match = {
  id: string; team_a: string; team_b: string; match_date: string
  real_score_a: number | null; real_score_b: number | null; status: 'pending' | 'finished'
}
type Prediction  = { match_id: string; pred_score_a: number; pred_score_b: number }
type Member      = { user_id: string; total_points: number; users: { name: string } }
type Group       = { id: string; name: string; invite_code: string }
type Draft       = { a: string; b: string; saved: boolean; saving: boolean }
type GroupPreds  = Record<string, string[]>
type KnockoutPreds = Record<string, Record<number, string>>
type AwardPreds  = Partial<Record<AwardKey, string>>

const MAIN_TABS = [
  { key: 'predictions', label: 'Partidos',  icon: Target   },
  { key: 'bracket',     label: 'Bracket',   icon: GitBranch },
  { key: 'ranking',     label: 'Ranking',   icon: Trophy   },
  { key: 'rules',       label: 'Reglas',    icon: BookOpen },
] as const
type MainTab = typeof MAIN_TABS[number]['key']

type BracketSubTab = 'grupos' | 'llaves' | 'premios'

// ─── Helpers ───────────────────────────────────────────────────────────────────
const isLocked = (m: Match) => m.status === 'finished' || new Date(m.match_date) <= new Date()

const fmtDate = (iso: string) => new Date(iso).toLocaleString('es-AR', {
  weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
})

const getResult = (a: number, b: number) => a > b ? 'a' : a < b ? 'b' : 'draw'

function calcMatchPoints(pred: Prediction, match: Match): number | null {
  if (match.status !== 'finished' || match.real_score_a === null || match.real_score_b === null) return null
  if (pred.pred_score_a === match.real_score_a && pred.pred_score_b === match.real_score_b) return POINTS.EXACT_SCORE
  if (getResult(pred.pred_score_a, pred.pred_score_b) === getResult(match.real_score_a, match.real_score_b)) return POINTS.CORRECT_TENDENCY
  return 0
}

type GroupStanding = { team: string; pts: number; gf: number; gc: number; gd: number; played: number }

function calcRealStandings(groupId: string, matches: Match[]): GroupStanding[] {
  const teams = GROUPS.find(g => g.id === groupId)!.teams
  const standings: Record<string, GroupStanding> = {}
  for (const t of teams) {
    standings[normalize(t)] = { team: t, pts: 0, gf: 0, gc: 0, gd: 0, played: 0 }
    standings[t] = standings[normalize(t)]
  }
  for (const m of matches) {
    if (m.status !== 'finished' || m.real_score_a === null || m.real_score_b === null) continue
    const a = m.team_a; const b = m.team_b
    if (!standings[a] || !standings[b]) continue
    standings[a].played++; standings[b].played++
    standings[a].gf += m.real_score_a; standings[a].gc += m.real_score_b; standings[a].gd += m.real_score_a - m.real_score_b
    standings[b].gf += m.real_score_b; standings[b].gc += m.real_score_a; standings[b].gd += m.real_score_b - m.real_score_a
    if (m.real_score_a > m.real_score_b) standings[a].pts += 3
    else if (m.real_score_a < m.real_score_b) standings[b].pts += 3
    else { standings[a].pts += 1; standings[b].pts += 1 }
  }
  const unique = teams.map(t => standings[normalize(t)] ?? standings[t])
  return unique.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
}

function resolveSlot(slot: string, groupPreds: GroupPreds): string {
  if (!slot.includes('/') && /^\d/.test(slot)) {
    const pos = parseInt(slot[0]) - 1
    const gId = slot[1]
    const pred = groupPreds[gId]
    if (pred && pred[pos]) return pred[pos]
  }
  return slot
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text); return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
      document.body.appendChild(ta); ta.focus(); ta.select()
      const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok
    } catch { return false }
  }
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function GroupPage() {
  const router   = useRouter()
  const params   = useParams()
  const groupId  = params.id as string

  // Group + match data
  const [group,   setGroup]   = useState<Group | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [drafts,  setDrafts]  = useState<Record<string, Draft>>({})
  const [loading, setLoading] = useState(true)
  const [userId,  setUserId]  = useState<string | null>(null)

  // Share
  const [copied,         setCopied]         = useState(false)
  const [shareUrl,       setShareUrl]       = useState('')
  const [showSharePopup, setShowSharePopup] = useState(false)

  // Tabs
  const [activeTab,      setActiveTab]      = useState<MainTab>('predictions')
  const [bracketSubTab,  setBracketSubTab]  = useState<BracketSubTab>('grupos')

  // Bracket predictions
  const [groupPreds,   setGroupPreds]   = useState<GroupPreds>({})
  const [knockoutPreds, setKnockoutPreds] = useState<KnockoutPreds>({})
  const [awardPreds,   setAwardPreds]   = useState<AwardPreds>({})
  const [bracketSaving, setBracketSaving] = useState(false)
  const [bracketSaved,  setBracketSaved]  = useState(false)

  // ── Init group predictions ──────────────────────────────────────────────
  const initGroupPreds = useCallback((existing: GroupPreds) => {
    const init: GroupPreds = {}
    for (const g of GROUPS) init[g.id] = existing[g.id] ?? [...g.teams]
    setGroupPreds(init)
  }, [])

  // ── Load all data ───────────────────────────────────────────────────────
  const loadData = useCallback(async (uid: string) => {
    const [gRes, mRes, pRes, membRes, gPredRes, kPredRes, awardRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase.from('matches').select('*').order('match_date', { ascending: true }),
      supabase.from('predictions').select('match_id,pred_score_a,pred_score_b').eq('user_id', uid),
      supabase.from('group_members').select('user_id,total_points,users(name)').eq('group_id', groupId).order('total_points', { ascending: false }),
      supabase.from('bracket_group_predictions').select('*').eq('user_id', uid),
      supabase.from('bracket_knockout_predictions').select('*').eq('user_id', uid),
      supabase.from('award_predictions').select('*').eq('user_id', uid),
    ])

    if (!gRes.data) { router.replace('/dashboard'); return }
    setGroup(gRes.data)
    setMatches(mRes.data || [])
    setMembers((membRes.data as unknown as Member[]) || [])

    // Match drafts
    const saved: Record<string, Draft> = {}
    for (const p of (pRes.data || []) as Prediction[])
      saved[p.match_id] = { a: String(p.pred_score_a), b: String(p.pred_score_b), saved: true, saving: false }
    setDrafts(saved)

    // Group bracket predictions
    const existingGroup: GroupPreds = {}
    for (const row of (gPredRes.data || [])) {
      if (!existingGroup[row.world_group]) existingGroup[row.world_group] = ['', '', '', '']
      existingGroup[row.world_group][row.position - 1] = row.team
    }

    // For groups without saved predictions, default to real standings order
    const allMatches = mRes.data || []
    for (const g of GROUPS) {
      if (!existingGroup[g.id] || existingGroup[g.id].some(t => !t)) {
        const real = calcRealStandings(g.id, allMatches)
        if (real.some(s => s.played > 0)) {
          existingGroup[g.id] = real.map(s => s.team)
        }
      }
    }
    initGroupPreds(existingGroup)

    // Knockout predictions
    const existingKnockout: KnockoutPreds = {}
    for (const row of (kPredRes.data || [])) {
      if (!existingKnockout[row.round]) existingKnockout[row.round] = {}
      existingKnockout[row.round][row.match_index] = row.winner
    }
    setKnockoutPreds(existingKnockout)

    // Award predictions
    const existingAwards: AwardPreds = {}
    for (const row of (awardRes.data || []))
      existingAwards[row.award_key as AwardKey] = row.value
    setAwardPreds(existingAwards)

    setLoading(false)
  }, [groupId, router, initGroupPreds])

  useEffect(() => {
    const id = localStorage.getItem('userId')
    if (!id) { router.replace('/'); return }
    setUserId(id); loadData(id)
  }, [loadData, router])

  useEffect(() => {
    if (group) setShareUrl(`${window.location.origin}/?invite=${group.invite_code}`)
  }, [group])

  // ── Match prediction handlers ───────────────────────────────────────────
  const updateDraft = (mid: string, field: 'a' | 'b', val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2)
    setDrafts(prev => ({ ...prev, [mid]: { ...(prev[mid] ?? { a: '', b: '', saved: false, saving: false }), [field]: clean, saved: false } }))
  }

  const savePrediction = async (mid: string) => {
    if (!userId) return
    const d = drafts[mid]
    if (!d || d.a === '' || d.b === '') return
    setDrafts(prev => ({ ...prev, [mid]: { ...prev[mid], saving: true } }))
    const { error } = await supabase.from('predictions').upsert(
      { user_id: userId, match_id: mid, pred_score_a: Number(d.a), pred_score_b: Number(d.b) },
      { onConflict: 'user_id,match_id' }
    )
    setDrafts(prev => ({ ...prev, [mid]: { ...prev[mid], saving: false, saved: !error } }))
  }

  // ── Bracket handlers ────────────────────────────────────────────────────
  const moveTeam = (gId: string, idx: number, dir: -1 | 1) => {
    setGroupPreds(prev => {
      const arr = [...(prev[gId] ?? [])]
      const target = idx + dir
      if (target < 0 || target >= arr.length) return prev
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return { ...prev, [gId]: arr }
    })
    setBracketSaved(false)
  }

  const pickWinner = (round: string, matchIdx: number, team: string) => {
    setKnockoutPreds(prev => ({ ...prev, [round]: { ...(prev[round] ?? {}), [matchIdx]: team } }))
    setBracketSaved(false)
    // Cascade: clear next round if team changes
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

  const updateAward = (key: AwardKey, value: string) => {
    setAwardPreds(prev => ({ ...prev, [key]: value }))
    setBracketSaved(false)
  }

  const saveBracket = async () => {
    if (!userId) return
    setBracketSaving(true)

    const groupRows = []
    for (const [gId, teams] of Object.entries(groupPreds))
      for (let i = 0; i < teams.length; i++)
        if (teams[i]) groupRows.push({ user_id: userId, world_group: gId, position: i + 1, team: teams[i] })

    const knockoutRows = []
    for (const [round, matchMap] of Object.entries(knockoutPreds))
      for (const [idx, winner] of Object.entries(matchMap))
        if (winner) knockoutRows.push({ user_id: userId, round, match_index: Number(idx), winner })

    const awardRows = Object.entries(awardPreds)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => ({ user_id: userId, award_key: k, value: (v as string).trim() }))

    await Promise.all([
      groupRows.length > 0
        ? supabase.from('bracket_group_predictions').upsert(groupRows, { onConflict: 'user_id,world_group,position' })
        : Promise.resolve(),
      knockoutRows.length > 0
        ? supabase.from('bracket_knockout_predictions').upsert(knockoutRows, { onConflict: 'user_id,round,match_index' })
        : Promise.resolve(),
      awardRows.length > 0
        ? supabase.from('award_predictions').upsert(awardRows, { onConflict: 'user_id,award_key' })
        : Promise.resolve(),
    ])

    setBracketSaving(false)
    setBracketSaved(true)
    setTimeout(() => setBracketSaved(false), 3000)
  }

  // ── Share handler ───────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!group) return
    if (navigator.share) {
      try { await navigator.share({ title: `Unite al Prode: ${group.name}`, text: '¡Unite al prode del Mundial!', url: shareUrl }); return }
      catch { /* fallback */ }
    }
    const ok = await copyToClipboard(shareUrl)
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 3000) }
    else setShowSharePopup(true)
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-slate-900 flex items-center justify-center">
      <div className="animate-bounceBall text-5xl">⚽</div>
    </div>
  )

  const pendingMatches  = matches.filter(m => !isLocked(m))
  const finishedMatches = matches.filter(m => m.status === 'finished')
  const liveMatches     = matches.filter(m => isLocked(m) && m.status === 'pending')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-10 pb-0 relative">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4 animate-slideInLeft">
            <button onClick={() => router.push('/dashboard')}
              className="p-2.5 glass rounded-xl text-white hover:bg-white/10 transition-all press flex-shrink-0">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-white truncate">{group?.name}</h1>
              <p className="text-green-300 text-xs font-mono">#{group?.invite_code}</p>
            </div>
          </div>

          {/* Main tabs */}
          <div className="flex gap-1 animate-fadeInUp delay-100">
            {MAIN_TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all duration-200 flex items-center justify-center gap-1 ${
                  activeTab === key ? 'border-white text-white' : 'border-transparent text-green-300 hover:text-white'
                }`}>
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5">

        {/* ── PARTIDOS ── */}
        {activeTab === 'predictions' && (
          <div className="space-y-3 animate-fadeInUp">
            {matches.length === 0 && (
              <div className="glass rounded-2xl p-10 text-center border border-white/10">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-white font-semibold">Todavía no hay partidos cargados</p>
              </div>
            )}

            {liveMatches.length > 0 && (
              <div>
                <p className="text-xs font-bold text-orange-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse inline-block" />
                  En curso — predicciones bloqueadas
                </p>
                {liveMatches.map((match, idx) => (
                  <MatchCard key={match.id} match={match} draft={drafts[match.id]} locked idx={idx}
                    onChangeA={() => {}} onChangeB={() => {}} onBlur={() => {}} userId={userId} />
                ))}
              </div>
            )}

            {pendingMatches.length > 0 && (
              <div>
                <p className="text-xs font-bold text-green-300 uppercase tracking-widest mb-2">Próximos — podés predecir</p>
                {pendingMatches.map((match, idx) => (
                  <MatchCard key={match.id} match={match} draft={drafts[match.id]} locked={false} idx={idx}
                    onChangeA={v => updateDraft(match.id, 'a', v)}
                    onChangeB={v => updateDraft(match.id, 'b', v)}
                    onBlur={() => savePrediction(match.id)}
                    userId={userId} />
                ))}
              </div>
            )}

            {finishedMatches.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Finalizados</p>
                {finishedMatches.map((match, idx) => {
                  const d = drafts[match.id]
                  const pts = d ? calcMatchPoints({ match_id: match.id, pred_score_a: Number(d.a), pred_score_b: Number(d.b) }, match) : null
                  return (
                    <MatchCard key={match.id} match={match} draft={d} locked idx={idx}
                      onChangeA={() => {}} onChangeB={() => {}} onBlur={() => {}} userId={userId} pts={pts} />
                  )
                })}
              </div>
            )}

            <p className="text-center text-xs text-green-400/60 py-2">Se guardan solos al salir del campo ✓</p>
          </div>
        )}

        {/* ── BRACKET ── */}
        {activeTab === 'bracket' && (
          <div className="animate-fadeInUp">
            {/* Sub-tabs */}
            <div className="glass rounded-2xl p-1 flex border border-white/10 mb-4">
              {(['grupos', 'llaves', 'premios'] as BracketSubTab[]).map(t => (
                <button key={t} onClick={() => setBracketSubTab(t)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    bracketSubTab === t ? 'bg-white text-green-800 shadow' : 'text-green-300 hover:text-white'
                  }`}>
                  {t === 'grupos' ? '📋 Grupos' : t === 'llaves' ? '🏆 Llaves' : '⭐ Premios'}
                </button>
              ))}
            </div>

            {/* Sub-tab: Grupos */}
            {bracketSubTab === 'grupos' && (
              <div>
                <p className="text-green-400/70 text-xs text-center mb-4">
                  Ordená los equipos para predecir la clasificación final de cada grupo.
                </p>
                <div className="space-y-3">
                  {GROUPS.map(g => {
                    const realStandings = calcRealStandings(g.id, matches)
                    const pred = groupPreds[g.id] ?? g.teams
                    return (
                      <div key={g.id} className="glass rounded-2xl overflow-hidden border border-white/10">
                        <div className={`bg-gradient-to-r ${GROUP_COLORS[g.id]} px-4 py-2.5 flex items-center justify-between`}>
                          <span className="text-white font-black text-sm">Grupo {g.id}</span>
                          {realStandings.some(s => s.played > 0) && (
                            <span className="text-white/70 text-xs">tabla real →</span>
                          )}
                        </div>
                        <div className="p-3 space-y-1.5">
                          {pred.map((team, ti) => {
                            const real = realStandings.find(s => s.team === team || normalize(s.team) === normalize(team))
                            return (
                              <div key={team}
                                className={`flex items-center gap-2 px-2 py-2 rounded-xl border transition-colors ${
                                  ti === 0 ? 'bg-yellow-500/20 border-yellow-500/30' :
                                  ti === 1 ? 'bg-gray-400/10 border-white/10' : 'bg-white/5 border-transparent'
                                }`}>
                                <span className={`text-xs font-black w-5 text-center ${
                                  ti === 0 ? 'text-yellow-400' : ti === 1 ? 'text-gray-300' : 'text-white/30'
                                }`}>{ti + 1}</span>
                                <span className="text-white text-xs font-semibold flex-1 truncate">{team}</span>
                                {real && real.played > 0 && (
                                  <span className="text-green-400 text-xs font-mono tabular-nums">
                                    {real.pts}p {real.gd > 0 ? '+' : ''}{real.gd}
                                  </span>
                                )}
                                <div className="flex flex-col gap-0.5">
                                  <button onClick={() => moveTeam(g.id, ti, -1)} disabled={ti === 0}
                                    className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 transition-colors">
                                    <ChevronUp size={13} className="text-white" />
                                  </button>
                                  <button onClick={() => moveTeam(g.id, ti, 1)} disabled={ti === pred.length - 1}
                                    className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 transition-colors">
                                    <ChevronDown size={13} className="text-white" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {realStandings.some(s => s.played > 0) && (
                          <div className="px-3 pb-3">
                            <div className="bg-white/5 rounded-xl px-3 py-2">
                              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tabla real actual</p>
                              {realStandings.map((s, i) => (
                                <div key={s.team} className="flex items-center gap-2 py-0.5">
                                  <span className={`text-[10px] font-black w-3 ${i < 2 ? 'text-green-400' : 'text-white/30'}`}>{i + 1}</span>
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

            {/* Sub-tab: Llaves */}
            {bracketSubTab === 'llaves' && (
              <KnockoutBracket
                groupPreds={groupPreds}
                knockoutPreds={knockoutPreds}
                onPick={pickWinner}
              />
            )}

            {/* Sub-tab: Premios */}
            {bracketSubTab === 'premios' && (
              <div className="space-y-3">
                <p className="text-green-400/70 text-xs text-center mb-4">
                  Escribí tu predicción para cada premio FIFA. Se revelan al final del torneo.
                </p>
                {AWARDS.map(award => (
                  <div key={award.key} className="glass rounded-2xl p-4 border border-white/10">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{award.emoji}</span>
                      <div className="flex-1">
                        <p className="text-white font-black text-sm">{award.label}</p>
                        <p className="text-green-300/70 text-xs">{award.sublabel}</p>
                      </div>
                      <span className="bg-green-500/20 text-green-300 text-xs font-black px-2 py-1 rounded-lg flex-shrink-0">
                        +{award.pts} pts
                      </span>
                    </div>
                    <input
                      type="text"
                      value={awardPreds[award.key] ?? ''}
                      onChange={e => updateAward(award.key, e.target.value)}
                      placeholder={award.key === 'fair_play' ? 'Nombre del equipo…' : 'Nombre del jugador…'}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm font-semibold placeholder-white/30 focus:outline-none focus:border-white/50 transition-colors"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Sticky save */}
            <div className="mt-6">
              <button onClick={saveBracket} disabled={bracketSaving}
                className={`press w-full py-3.5 rounded-2xl font-black text-base transition-all shadow-xl flex items-center justify-center gap-2 ${
                  bracketSaved ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-white text-green-800 hover:bg-green-50 shadow-black/30'
                }`}>
                {bracketSaving
                  ? <><Loader2 size={18} className="animate-spin" /> Guardando…</>
                  : bracketSaved
                  ? <><CheckCircle2 size={18} /> ¡Predicciones guardadas!</>
                  : <><Save size={18} /> Guardar bracket y premios</>}
              </button>
            </div>
          </div>
        )}

        {/* ── RANKING ── */}
        {activeTab === 'ranking' && (
          <div className="space-y-2.5 animate-fadeInUp">
            {members.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center border border-white/10">
                <div className="text-4xl mb-3">🍺</div>
                <p className="text-white font-semibold">El ranking está vacío</p>
              </div>
            ) : (
              <>
                {members.map((member, idx) => {
                  const isMe = member.user_id === userId
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div key={member.user_id}
                      className={`rounded-2xl p-4 flex items-center gap-4 transition-all ${
                        isMe ? 'bg-white shadow-xl shadow-black/20 animate-pulse-glow' : 'glass border border-white/10'
                      }`}
                      style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className="w-10 text-center flex-shrink-0">
                        {idx === 0 && <span className="text-2xl">🍺</span>}
                        {idx > 0 && medals[idx] && <span className="text-2xl">{medals[idx]}</span>}
                        {idx > 0 && !medals[idx] && (
                          <span className={`text-base font-black ${isMe ? 'text-gray-400' : 'text-green-300/50'}`}>#{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-base truncate ${isMe ? 'text-gray-800' : 'text-white'}`}>
                          {member.users?.name}
                          {isMe && <span className={`ml-2 text-xs font-normal ${isMe ? 'text-gray-400' : 'text-green-300'}`}>(vos)</span>}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-2xl font-black leading-none ${isMe ? 'text-green-600' : 'text-green-300'}`}>
                          {member.total_points}
                        </p>
                        <p className={`text-xs ${isMe ? 'text-gray-400' : 'text-green-300/60'}`}>pts</p>
                      </div>
                    </div>
                  )
                })}

                <div className="glass rounded-2xl p-4 border border-white/10 mt-4">
                  <p className="text-white font-bold text-sm mb-3">💰 Reparto del bote</p>
                  {[['🥇', '1er lugar', '70%'], ['🥈', '2do lugar', '20%'], ['🥉', '3er lugar', '10%']].map(([emoji, pos, pct]) => (
                    <div key={pos} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-green-200 text-sm">{emoji} {pos}</span>
                      <span className="text-white font-black">{pct}</span>
                    </div>
                  ))}
                </div>

                <div className="glass rounded-xl p-3 border border-white/10 text-center">
                  <p className="text-white/50 text-xs">
                    Los puntos de bracket y premios se suman al confirmar resultados finales del torneo.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── REGLAS ── */}
        {activeTab === 'rules' && (
          <div className="space-y-4 animate-fadeInUp">
            <button onClick={handleShare}
              className="press w-full bg-white text-green-700 font-black py-4 px-5 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-black/20 text-base hover:bg-green-50 transition-all">
              {copied ? <><span className="text-green-600">✓</span> ¡Enlace copiado!</> : <><Share2 size={20} /> Compartir invitación</>}
            </button>

            {shareUrl && (
              <div className="glass rounded-xl p-3 border border-white/10">
                <p className="text-green-300 text-xs mb-1">Enlace de invitación:</p>
                <p className="text-white text-xs font-mono break-all">{shareUrl}</p>
              </div>
            )}

            {showSharePopup && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
                onClick={() => setShowSharePopup(false)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scaleIn" onClick={e => e.stopPropagation()}>
                  <p className="font-black text-gray-800 mb-2">Copiá este enlace</p>
                  <div className="bg-gray-100 rounded-xl p-3 mb-4 break-all text-xs font-mono text-gray-700 select-all">{shareUrl}</div>
                  <button onClick={() => setShowSharePopup(false)}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold press">Cerrar</button>
                </div>
              </div>
            )}

            <div className="glass rounded-2xl p-5 border border-white/10 space-y-5">
              <div>
                <h3 className="text-white font-black text-lg mb-1">El Prode de los Pibes™</h3>
                <p className="text-green-300 text-sm">Simple, sin excusas, como la vida misma.</p>
              </div>

              {/* Partidos */}
              <div>
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">⚽ Partidos</p>
                <div className="space-y-3">
                  {[
                    { pts: `+${POINTS.EXACT_SCORE}`,      emoji: '🎯', title: 'Resultado exacto',      desc: 'Acertaste el marcador clavado. Sos un crack.' },
                    { pts: `+${POINTS.CORRECT_TENDENCY}`, emoji: '👀', title: 'Tendencia correcta',    desc: 'Sabías quién ganaba pero el marcador te quedó corto.' },
                    { pts: '0',                           emoji: '💀', title: 'Ni en pedo',            desc: 'La erraste. Bancátela.' },
                  ].map(r => (
                    <div key={r.pts} className="flex gap-3">
                      <div className={`text-sm font-black px-2.5 py-1.5 rounded-lg flex-shrink-0 min-w-[40px] text-center ${
                        r.pts === `+${POINTS.EXACT_SCORE}` ? 'bg-green-500/20 text-green-300' :
                        r.pts === `+${POINTS.CORRECT_TENDENCY}` ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-400'
                      }`}>{r.pts}</div>
                      <div>
                        <p className="text-white font-semibold text-sm">{r.emoji} {r.title}</p>
                        <p className="text-green-300/70 text-xs mt-0.5">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bracket grupos */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">📋 Bracket — Fase de grupos</p>
                <div className="space-y-2">
                  {[
                    { pts: `+${POINTS.GROUP_EXACT_POS}`, desc: '1° o 2° lugar exacto en el grupo' },
                    { pts: `+${POINTS.GROUP_QUALIFIED}`, desc: 'Equipo en top 2 pero posición errónea' },
                    { pts: '0', desc: 'Equipo no clasificó (3° o 4°)' },
                  ].map(r => (
                    <div key={r.desc} className="flex items-center gap-3">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg min-w-[36px] text-center ${
                        r.pts.startsWith('+3') ? 'bg-green-500/20 text-green-300' :
                        r.pts.startsWith('+1') ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/10 text-white/30'
                      }`}>{r.pts}</span>
                      <span className="text-green-200 text-xs">{r.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bracket eliminatoria */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">🏆 Bracket — Eliminatoria</p>
                <div className="space-y-2">
                  {[
                    { pts: `+${POINTS.R32}`,       label: 'Ronda de 32',   desc: 'Ganador correcto' },
                    { pts: `+${POINTS.R16}`,       label: 'Octavos',       desc: 'Ganador correcto' },
                    { pts: `+${POINTS.QF}`,        label: 'Cuartos',       desc: 'Ganador correcto' },
                    { pts: `+${POINTS.SF}`,        label: 'Semis',         desc: 'Ganador correcto' },
                    { pts: `+${POINTS.THIRD}`,     label: '3er lugar',     desc: 'Equipo correcto' },
                    { pts: `+${POINTS.RUNNER_UP}`, label: 'Subcampeón',    desc: 'Finalista correcto' },
                    { pts: `+${POINTS.CHAMPION}`,  label: 'Campeón 🏆',   desc: 'El que levanta la copa' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-3">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg min-w-[36px] text-center ${
                        Number(r.pts.replace('+','')) >= 8 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                      }`}>{r.pts}</span>
                      <span className="text-white font-semibold text-xs w-24 flex-shrink-0">{r.label}</span>
                      <span className="text-green-300/60 text-xs">{r.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premios */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">⭐ Premios individuales</p>
                <div className="space-y-2">
                  {AWARDS.map(a => (
                    <div key={a.key} className="flex items-center gap-3">
                      <span className="bg-purple-500/20 text-purple-300 text-xs font-black px-2 py-1 rounded-lg min-w-[36px] text-center">+{a.pts}</span>
                      <span className="text-xl">{a.emoji}</span>
                      <span className="text-green-200 text-xs">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bote */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">🍺 El bote</p>
                <p className="text-green-300 text-sm mb-3">
                  La cuota la ponen los pibes entre todos. El que sale campeón agarra el gordo.
                </p>
                {[['🥇', '1er puesto', '70%', 'Para el asado'], ['🥈', '2do puesto', '20%', 'Para las birras'], ['🥉', '3er puesto', '10%', 'Para recuperar dignidad']].map(([e, p, pct, desc]) => (
                  <div key={p} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                    <span className="text-xl flex-shrink-0">{e}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{p} — <span className="text-green-300">{pct}</span></p>
                      <p className="text-green-300/60 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">📜 La letra chica</p>
                <ul className="space-y-2 text-green-300 text-sm">
                  {[
                    '⏱️ Los partidos se cierran cuando arrancan. Ni un segundo después.',
                    '📊 Los puntos van a todos tus grupos a la vez.',
                    '🏆 El bracket y premios se puntúan al finalizar el torneo.',
                    '👑 El admin tiene la última palabra. No hay apelación.',
                    '🤝 Las trampas se pagan con una ronda.',
                  ].map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── MatchCard ─── */
function MatchCard({ match, draft, locked, onChangeA, onChangeB, onBlur, pts, idx }: {
  match: Match; draft?: Draft; locked: boolean
  onChangeA: (v: string) => void; onChangeB: (v: string) => void
  onBlur: () => void; userId: string | null; pts?: number | null; idx: number
}) {
  const isFinished = match.status === 'finished'
  const isLive = locked && !isFinished

  return (
    <div className={`mb-3 rounded-2xl p-4 transition-all animate-fadeInUp ${
      isLive ? 'glass border border-orange-400/30' :
      isFinished ? 'glass border border-white/5' : 'bg-white shadow-lg shadow-black/10'
    }`} style={{ animationDelay: `${idx * 50}ms` }}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium capitalize ${isFinished ? 'text-green-300/60' : isLive ? 'text-orange-300' : 'text-gray-400'}`}>
          {fmtDate(match.match_date)}
        </span>
        {isLive && (
          <span className="text-xs bg-orange-400/20 text-orange-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />EN VIVO
          </span>
        )}
        {isFinished && <span className="text-xs bg-white/10 text-green-300 px-2 py-0.5 rounded-full font-semibold">FIN</span>}
      </div>

      <div className="flex items-center gap-2">
        <span className={`flex-1 text-right font-black text-base ${isFinished || isLive ? 'text-white' : 'text-gray-800'}`}>
          {match.team_a}
        </span>

        {locked ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black ${isFinished ? 'bg-white/10 text-white' : 'bg-orange-400/20 text-orange-200'}`}>
              {draft?.a ?? '?'}
            </div>
            <Lock size={12} className={isLive ? 'text-orange-300' : 'text-white/30'} />
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black ${isFinished ? 'bg-white/10 text-white' : 'bg-orange-400/20 text-orange-200'}`}>
              {draft?.b ?? '?'}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <input type="number" min="0" max="99" value={draft?.a ?? ''}
              onChange={e => onChangeA(e.target.value)} onBlur={onBlur}
              placeholder="—" className="w-12 h-12 border-2 border-gray-200 focus:border-green-500 rounded-xl text-center text-xl font-black text-gray-800 focus:outline-none transition-colors" />
            <span className="text-gray-300 font-black">–</span>
            <input type="number" min="0" max="99" value={draft?.b ?? ''}
              onChange={e => onChangeB(e.target.value)} onBlur={onBlur}
              placeholder="—" className="w-12 h-12 border-2 border-gray-200 focus:border-green-500 rounded-xl text-center text-xl font-black text-gray-800 focus:outline-none transition-colors" />
          </div>
        )}

        <span className={`flex-1 text-left font-black text-base ${isFinished || isLive ? 'text-white' : 'text-gray-800'}`}>
          {match.team_b}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between min-h-[20px]">
        {isFinished && match.real_score_a !== null ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-green-300/70">Resultado:</span>
            <span className="text-sm font-black text-white">{match.real_score_a}–{match.real_score_b}</span>
            {pts !== null && pts !== undefined && (
              <span className={`text-xs font-black px-2 py-0.5 rounded-full animate-popIn ${
                pts === 3 ? 'bg-green-400/20 text-green-300' :
                pts === 1 ? 'bg-yellow-400/20 text-yellow-300' : 'bg-red-400/20 text-red-400'
              }`}>
                {pts === 3 ? '✓ +3' : pts === 1 ? '~ +1' : '✗ 0'}
              </span>
            )}
          </div>
        ) : <span />}

        {!locked && (
          <div className="flex items-center gap-1.5 text-xs">
            {draft?.saving ? (
              <><Loader2 size={12} className="animate-spin text-gray-400" /><span className="text-gray-400">Guardando</span></>
            ) : draft?.saved ? (
              <><CheckCircle2 size={14} className="text-green-500" /><span className="text-green-600 font-semibold">Guardado</span></>
            ) : draft?.a !== undefined && draft.a !== '' ? (
              <span className="text-orange-400 font-medium">● Sin guardar</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── KnockoutBracket ─── */
function KnockoutBracket({ groupPreds, knockoutPreds, onPick }: {
  groupPreds: GroupPreds; knockoutPreds: KnockoutPreds
  onPick: (round: string, matchIdx: number, team: string) => void
}) {
  const r32Teams = R32_STRUCTURE.map(m => ({
    a: resolveSlot(m.a, groupPreds),
    b: resolveSlot(m.b, groupPreds),
  }))

  const getTeam = (round: RoundKey, matchIdx: number, side: 'a' | 'b'): string => {
    if (round === 'R32') return side === 'a' ? r32Teams[matchIdx].a : r32Teams[matchIdx].b
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
    <div className="pb-4">
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-3 min-w-max py-2">
          {ROUND_KEYS.map(round => {
            const count = ROUND_SIZES[round]
            return (
              <div key={round} className="flex flex-col">
                <div className="mb-3 flex justify-center">
                  <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                    round === 'F' ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black' : 'glass text-green-300 border border-white/10'
                  }`}>
                    {ROUND_LABELS[round]}
                  </span>
                </div>
                <div className="flex flex-col justify-around gap-2" style={{ minHeight: `${count * 72}px` }}>
                  {Array.from({ length: count }).map((_, mIdx) => {
                    const teamA = getTeam(round, mIdx, 'a')
                    const teamB = getTeam(round, mIdx, 'b')
                    const winner = knockoutPreds[round]?.[mIdx]
                    return (
                      <BracketMatch key={mIdx} teamA={teamA} teamB={teamB} winner={winner} isFinal={round === 'F'}
                        onPickA={() => { if (teamA !== '?' && !teamA.includes('/')) onPick(round, mIdx, teamA) }}
                        onPickB={() => { if (teamB !== '?' && !teamB.includes('/')) onPick(round, mIdx, teamB) }} />
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* 3er puesto */}
          <div className="flex flex-col">
            <div className="mb-3 flex justify-center">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full glass text-green-300 border border-white/10">
                3er Lugar
              </span>
            </div>
            <div className="flex flex-col justify-around" style={{ minHeight: '72px' }}>
              {(() => {
                const teamA = getSFLoser(0)
                const teamB = getSFLoser(1)
                const winner = knockoutPreds['3rd']?.[0]
                return (
                  <BracketMatch teamA={teamA} teamB={teamB} winner={winner} isFinal={false}
                    onPickA={() => { if (teamA !== '?') onPick('3rd', 0, teamA) }}
                    onPickB={() => { if (teamB !== '?') onPick('3rd', 0, teamB) }} />
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {knockoutPreds['F']?.[0] && (
        <div className="mt-4 max-w-sm mx-auto animate-popIn">
          <div className="glass rounded-3xl p-5 border border-yellow-400/30 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-yellow-400 font-black text-lg">{knockoutPreds['F'][0]}</p>
            <p className="text-white/50 text-xs mt-1">Tu campeón del Mundial 2026</p>
          </div>
        </div>
      )}

      <p className="text-white/30 text-xs text-center mt-4">
        Tocá un equipo para elegirlo ganador · Los cambios en grupos actualizan las llaves
      </p>
    </div>
  )
}

/* ─── BracketMatch ─── */
function BracketMatch({ teamA, teamB, winner, isFinal, onPickA, onPickB }: {
  teamA: string; teamB: string; winner?: string
  isFinal: boolean; onPickA: () => void; onPickB: () => void
}) {
  const isUnknown = (t: string) => t === '?' || t.includes('/')
  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border w-32 ${isFinal ? 'border-yellow-400/40' : 'border-white/10'}`}>
      {[{ team: teamA, pick: onPickA }, { team: teamB, pick: onPickB }].map(({ team, pick }, si) => {
        const isWinner = winner === team
        const isLoser  = !!(winner && !isWinner && !isUnknown(team))
        const unknown  = isUnknown(team)
        return (
          <button key={si} onClick={pick} disabled={unknown}
            className={`px-2 py-2 text-left transition-all ${
              si === 0 ? `border-b ${isFinal ? 'border-yellow-400/20' : 'border-white/5'}` : ''
            } ${
              isWinner ? 'bg-green-500/30' : isLoser ? 'opacity-40 bg-white/3' : unknown ? 'bg-white/5' : 'bg-white/10 hover:bg-white/20'
            }`}>
            <p className={`text-xs font-bold truncate ${isWinner ? 'text-green-300' : unknown ? 'text-white/20 italic' : 'text-white'}`}>
              {isWinner && '✓ '}{team}
            </p>
          </button>
        )
      })}
    </div>
  )
}
