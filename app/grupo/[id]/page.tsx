'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Share2, Trophy, Target, BookOpen,
  Lock, Check, Loader2, CheckCircle2, Circle
} from 'lucide-react'

type Match = {
  id: string
  team_a: string
  team_b: string
  match_date: string
  real_score_a: number | null
  real_score_b: number | null
  status: 'pending' | 'finished'
}

type Prediction = {
  match_id: string
  pred_score_a: number
  pred_score_b: number
}

type Member = {
  user_id: string
  total_points: number
  users: { name: string }
}

type Group = {
  id: string
  name: string
  invite_code: string
}

type PredictionDraft = { a: string; b: string; saved: boolean; saving: boolean }

const TABS = [
  { key: 'predictions', label: 'Predicciones', icon: Target },
  { key: 'ranking',     label: 'Ranking',       icon: Trophy },
  { key: 'rules',       label: 'Reglas',         icon: BookOpen },
] as const

type Tab = typeof TABS[number]['key']

function isMatchLocked(match: Match): boolean {
  return match.status === 'finished' || new Date(match.match_date) <= new Date()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

function getResult(realA: number, realB: number): 'a' | 'draw' | 'b' {
  if (realA > realB) return 'a'
  if (realA < realB) return 'b'
  return 'draw'
}

function calcPoints(pred: Prediction, match: Match): number | null {
  if (match.status !== 'finished' || match.real_score_a === null || match.real_score_b === null) return null
  if (pred.pred_score_a === match.real_score_a && pred.pred_score_b === match.real_score_b) return 3
  if (getResult(pred.pred_score_a, pred.pred_score_b) === getResult(match.real_score_a, match.real_score_b)) return 1
  return 0
}

export default function GroupPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [drafts, setDrafts] = useState<Record<string, PredictionDraft>>({})
  const [activeTab, setActiveTab] = useState<Tab>('predictions')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadData = useCallback(async (uid: string) => {
    const [groupRes, matchesRes, predsRes, membersRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase.from('matches').select('*').order('match_date', { ascending: true }),
      supabase.from('predictions').select('match_id, pred_score_a, pred_score_b').eq('user_id', uid),
      supabase
        .from('group_members')
        .select('user_id, total_points, users(name)')
        .eq('group_id', groupId)
        .order('total_points', { ascending: false }),
    ])

    if (!groupRes.data) { router.replace('/dashboard'); return }

    setGroup(groupRes.data)
    setMatches(matchesRes.data || [])
    setMembers((membersRes.data as unknown as Member[]) || [])

    const savedPreds: Record<string, PredictionDraft> = {}
    for (const p of (predsRes.data || []) as Prediction[]) {
      savedPreds[p.match_id] = {
        a: String(p.pred_score_a),
        b: String(p.pred_score_b),
        saved: true,
        saving: false,
      }
    }
    setDrafts(savedPreds)
    setLoading(false)
  }, [groupId, router])

  useEffect(() => {
    const id = localStorage.getItem('userId')
    if (!id) { router.replace('/'); return }
    setUserId(id)
    loadData(id)
  }, [loadData, router])

  const updateDraft = (matchId: string, field: 'a' | 'b', value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 2)
    setDrafts(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] ?? { a: '', b: '', saved: false, saving: false }), [field]: clean, saved: false }
    }))
  }

  const savePrediction = async (matchId: string) => {
    if (!userId) return
    const draft = drafts[matchId]
    if (!draft || draft.a === '' || draft.b === '') return

    setDrafts(prev => ({ ...prev, [matchId]: { ...prev[matchId], saving: true } }))

    const { error } = await supabase.from('predictions').upsert(
      { user_id: userId, match_id: matchId, pred_score_a: Number(draft.a), pred_score_b: Number(draft.b) },
      { onConflict: 'user_id,match_id' }
    )

    setDrafts(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], saving: false, saved: !error }
    }))
  }

  const copyInviteLink = () => {
    if (!group) return
    const url = `${window.location.origin}/?invite=${group.invite_code}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 pt-10 pb-0 shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-green-600 rounded-xl transition-colors -ml-2"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-black tracking-tight truncate flex-1">{group?.name}</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-white text-white'
                    : 'border-transparent text-green-200 hover:text-white'
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5">

        {/* ── TAB 1: PREDICCIONES ── */}
        {activeTab === 'predictions' && (
          <div className="space-y-3">
            {matches.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Target size={44} className="mx-auto mb-3 opacity-30" />
                <p>Todavía no hay partidos cargados.</p>
              </div>
            )}

            {matches.map(match => {
              const locked = isMatchLocked(match)
              const draft = drafts[match.id]
              const pts = draft ? calcPoints(
                { match_id: match.id, pred_score_a: Number(draft.a), pred_score_b: Number(draft.b) },
                match
              ) : null

              return (
                <div
                  key={match.id}
                  className={`bg-white rounded-2xl shadow-sm p-4 ${locked ? 'opacity-90' : ''}`}
                >
                  {/* Match Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 font-medium">{formatDate(match.match_date)}</span>
                    {match.status === 'finished' && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Finalizado</span>
                    )}
                    {locked && match.status === 'pending' && (
                      <span className="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Lock size={10} /> En curso
                      </span>
                    )}
                  </div>

                  {/* Teams and Score Input */}
                  <div className="flex items-center gap-3">
                    <span className="flex-1 text-right font-bold text-gray-800 text-base">{match.team_a}</span>

                    {locked ? (
                      /* Locked: show prediction (and real score if finished) */
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black
                            ${match.status === 'finished' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                            {draft?.a ?? '?'}
                          </div>
                          <span className="text-gray-300 font-bold">–</span>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black
                            ${match.status === 'finished' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                            {draft?.b ?? '?'}
                          </div>
                        </div>
                        <Lock size={14} className="text-gray-300" />
                      </div>
                    ) : (
                      /* Editable */
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={draft?.a ?? ''}
                          onChange={e => updateDraft(match.id, 'a', e.target.value)}
                          onBlur={() => savePrediction(match.id)}
                          placeholder="—"
                          className="w-12 h-12 border-2 border-gray-200 focus:border-green-500 rounded-xl text-center text-xl font-black text-gray-800 focus:outline-none transition-colors"
                        />
                        <span className="text-gray-300 font-bold text-lg">–</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={draft?.b ?? ''}
                          onChange={e => updateDraft(match.id, 'b', e.target.value)}
                          onBlur={() => savePrediction(match.id)}
                          placeholder="—"
                          className="w-12 h-12 border-2 border-gray-200 focus:border-green-500 rounded-xl text-center text-xl font-black text-gray-800 focus:outline-none transition-colors"
                        />
                      </div>
                    )}

                    <span className="flex-1 text-left font-bold text-gray-800 text-base">{match.team_b}</span>
                  </div>

                  {/* Footer row */}
                  <div className="mt-3 flex items-center justify-between">
                    {/* Finished: show real score + points */}
                    {match.status === 'finished' && match.real_score_a !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Resultado real:</span>
                        <span className="text-sm font-black text-gray-700">
                          {match.real_score_a} – {match.real_score_b}
                        </span>
                        {pts !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            pts === 3 ? 'bg-green-100 text-green-700' :
                            pts === 1 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {pts === 3 ? '✓ +3 pts' : pts === 1 ? '~ +1 pt' : '✗ 0 pts'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span />
                    )}

                    {/* Save status for editable matches */}
                    {!locked && (
                      <div className="flex items-center gap-1.5 text-xs">
                        {draft?.saving ? (
                          <><Loader2 size={12} className="animate-spin text-gray-400" /><span className="text-gray-400">Guardando...</span></>
                        ) : draft?.saved ? (
                          <><CheckCircle2 size={14} className="text-green-500" /><span className="text-green-600 font-medium">Guardado</span></>
                        ) : draft?.a !== '' && draft?.b !== '' ? (
                          <><Circle size={12} className="text-orange-400" /><span className="text-orange-500">Sin guardar</span></>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            <p className="text-center text-xs text-gray-400 py-2">
              Las predicciones se guardan automáticamente al salir del campo.
            </p>
          </div>
        )}

        {/* ── TAB 2: RANKING ── */}
        {activeTab === 'ranking' && (
          <div className="space-y-2">
            {members.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Trophy size={44} className="mx-auto mb-3 opacity-30" />
                <p>Todavía no hay miembros en el ranking.</p>
              </div>
            )}

            {members.map((member, idx) => {
              const isCurrentUser = member.user_id === userId
              const medals = ['🥇', '🥈', '🥉']
              const medal = medals[idx] ?? null

              return (
                <div
                  key={member.user_id}
                  className={`rounded-2xl p-4 flex items-center gap-4 ${
                    isCurrentUser
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white shadow-sm'
                  }`}
                >
                  <div className="w-9 text-center">
                    {medal ? (
                      <span className="text-2xl">{medal}</span>
                    ) : (
                      <span className={`text-lg font-black ${isCurrentUser ? 'text-green-200' : 'text-gray-300'}`}>
                        #{idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-base truncate ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                      {member.users?.name}
                      {isCurrentUser && <span className="ml-2 text-green-200 text-xs font-normal">(vos)</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black leading-none ${isCurrentUser ? 'text-white' : 'text-green-600'}`}>
                      {member.total_points}
                    </p>
                    <p className={`text-xs ${isCurrentUser ? 'text-green-200' : 'text-gray-400'}`}>pts</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── TAB 3: REGLAS ── */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {/* Share button */}
            <button
              onClick={copyInviteLink}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 px-5 rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-md"
            >
              {copied ? <><Check size={20} /> ¡Enlace copiado!</> : <><Share2 size={20} /> Compartir enlace de invitación</>}
            </button>

            {group && (
              <div className="bg-gray-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Código del grupo</p>
                <p className="font-mono font-black text-xl text-gray-700 tracking-widest mt-0.5">{group.invite_code}</p>
              </div>
            )}

            {/* Rules Card */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
              <div>
                <h3 className="font-black text-gray-800 text-lg mb-3">📋 Sistema de Puntos</h3>
                <div className="space-y-2.5">
                  {[
                    { pts: '+3', label: 'Resultado Exacto', desc: 'Acertás el marcador exacto (ej: predijiste 2-1 y fue 2-1)', color: 'bg-green-100 text-green-700' },
                    { pts: '+1', label: 'Tendencia Correcta', desc: 'Acertás quién gana o el empate, pero no el marcador exacto', color: 'bg-yellow-100 text-yellow-700' },
                    { pts: '0',  label: 'Fallo',             desc: 'Predijiste el resultado incorrecto', color: 'bg-red-100 text-red-500' },
                  ].map(r => (
                    <div key={r.pts} className="flex gap-3 items-start">
                      <span className={`${r.color} text-sm font-black px-2.5 py-1 rounded-lg flex-shrink-0 min-w-[44px] text-center`}>{r.pts}</span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{r.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-black text-gray-800 text-lg mb-3">💰 Premios del Bote</h3>
                <p className="text-xs text-gray-500 mb-3">
                  La cuota de entrada se define entre los integrantes del grupo. El bote total se reparte entre los tres primeros del ranking final:
                </p>
                <div className="space-y-2">
                  {[
                    { pos: '🥇 1er Puesto', pct: '70%', color: 'bg-yellow-50 border-yellow-200' },
                    { pos: '🥈 2do Puesto', pct: '20%', color: 'bg-gray-50 border-gray-200' },
                    { pos: '🥉 3er Puesto', pct: '10%', color: 'bg-orange-50 border-orange-200' },
                  ].map(p => (
                    <div key={p.pos} className={`${p.color} border rounded-xl px-4 py-2.5 flex items-center justify-between`}>
                      <span className="font-semibold text-gray-700 text-sm">{p.pos}</span>
                      <span className="font-black text-gray-800 text-lg">{p.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  ⚽ Los puntos de cada partido se suman automáticamente en todos los grupos donde estés.
                  Las predicciones se cierran cuando arranca el partido. ¡Mucha suerte!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
