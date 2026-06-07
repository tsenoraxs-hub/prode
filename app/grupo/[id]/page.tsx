'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Share2, Trophy, Target, BookOpen, Lock, CheckCircle2, Loader2, GitBranch } from 'lucide-react'

type Match = {
  id: string; team_a: string; team_b: string; match_date: string
  real_score_a: number | null; real_score_b: number | null; status: 'pending' | 'finished'
}
type Prediction = { match_id: string; pred_score_a: number; pred_score_b: number }
type Member = { user_id: string; total_points: number; users: { name: string } }
type Group = { id: string; name: string; invite_code: string }
type Draft = { a: string; b: string; saved: boolean; saving: boolean }

const TABS = [
  { key: 'predictions', label: 'Predicciones', icon: Target },
  { key: 'ranking',     label: 'Ranking',       icon: Trophy },
  { key: 'rules',       label: 'Reglas',         icon: BookOpen },
] as const
type Tab = typeof TABS[number]['key']

const isLocked = (m: Match) => m.status === 'finished' || new Date(m.match_date) <= new Date()

const fmtDate = (iso: string) => new Date(iso).toLocaleString('es-AR', {
  weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
})

const getResult = (a: number, b: number) => a > b ? 'a' : a < b ? 'b' : 'draw'

function calcPoints(pred: Prediction, match: Match): number | null {
  if (match.status !== 'finished' || match.real_score_a === null || match.real_score_b === null) return null
  if (pred.pred_score_a === match.real_score_a && pred.pred_score_b === match.real_score_b) return 3
  if (getResult(pred.pred_score_a, pred.pred_score_b) === getResult(match.real_score_a, match.real_score_b)) return 1
  return 0
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
      document.body.appendChild(ta)
      ta.focus(); ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch { return false }
  }
}

export default function GroupPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [activeTab, setActiveTab] = useState<Tab>('predictions')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [showSharePopup, setShowSharePopup] = useState(false)

  const loadData = useCallback(async (uid: string) => {
    const [gRes, mRes, pRes, membRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase.from('matches').select('*').order('match_date', { ascending: true }),
      supabase.from('predictions').select('match_id,pred_score_a,pred_score_b').eq('user_id', uid),
      supabase.from('group_members').select('user_id,total_points,users(name)').eq('group_id', groupId).order('total_points', { ascending: false }),
    ])
    if (!gRes.data) { router.replace('/dashboard'); return }
    setGroup(gRes.data)
    setMatches(mRes.data || [])
    setMembers((membRes.data as unknown as Member[]) || [])
    const saved: Record<string, Draft> = {}
    for (const p of (pRes.data || []) as Prediction[])
      saved[p.match_id] = { a: String(p.pred_score_a), b: String(p.pred_score_b), saved: true, saving: false }
    setDrafts(saved)
    setLoading(false)
  }, [groupId, router])

  useEffect(() => {
    const id = localStorage.getItem('userId')
    if (!id) { router.replace('/'); return }
    setUserId(id); loadData(id)
  }, [loadData, router])

  useEffect(() => {
    if (group) setShareUrl(`${window.location.origin}/?invite=${group.invite_code}`)
  }, [group])

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

  const handleShare = async () => {
    if (!group) return
    if (navigator.share) {
      try {
        await navigator.share({ title: `Unite al Prode: ${group.name}`, text: '¡Unite al prode del Mundial!', url: shareUrl })
        return
      } catch { /* fallback */ }
    }
    const ok = await copyToClipboard(shareUrl)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } else {
      setShowSharePopup(true)
    }
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
            <button onClick={() => router.push('/bracket')}
              className="p-2.5 glass rounded-xl text-white hover:bg-white/10 transition-all press flex-shrink-0">
              <GitBranch size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 animate-fadeInUp delay-100">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === key ? 'border-white text-white' : 'border-transparent text-green-300 hover:text-white'
                }`}>
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5">

        {/* ── PREDICCIONES ── */}
        {activeTab === 'predictions' && (
          <div className="space-y-3 animate-fadeInUp">
            {matches.length === 0 && (
              <div className="glass rounded-2xl p-10 text-center border border-white/10">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-white font-semibold">Todavía no hay partidos cargados</p>
              </div>
            )}

            {/* Live matches */}
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

            {/* Upcoming matches */}
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

            {/* Finished */}
            {finishedMatches.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Finalizados</p>
                {finishedMatches.map((match, idx) => {
                  const d = drafts[match.id]
                  const pts = d ? calcPoints({ match_id: match.id, pred_score_a: Number(d.a), pred_score_b: Number(d.b) }, match) : null
                  return (
                    <MatchCard key={match.id} match={match} draft={d} locked idx={idx}
                      onChangeA={() => {}} onChangeB={() => {}} onBlur={() => {}} userId={userId} pts={pts} />
                  )
                })}
              </div>
            )}

            <p className="text-center text-xs text-green-400/60 py-2">
              Se guardan solos al salir del campo ✓
            </p>
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
                  const beer = idx === 0 ? '🍺' : null
                  return (
                    <div key={member.user_id}
                      className={`rounded-2xl p-4 flex items-center gap-4 transition-all ${
                        isMe ? 'bg-white shadow-xl shadow-black/20 animate-pulse-glow' : 'glass border border-white/10'
                      }`}
                      style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className="w-10 text-center flex-shrink-0">
                        {beer && <span className="text-2xl animate-beerFoam inline-block">{beer}</span>}
                        {!beer && medals[idx] && <span className="text-2xl">{medals[idx]}</span>}
                        {!beer && !medals[idx] && (
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
                        <p className={`text-2xl font-black leading-none animate-countUp ${isMe ? 'text-green-600' : 'text-green-300'}`}>
                          {member.total_points}
                        </p>
                        <p className={`text-xs ${isMe ? 'text-gray-400' : 'text-green-300/60'}`}>pts</p>
                      </div>
                    </div>
                  )
                })}

                {/* Prize breakdown */}
                <div className="glass rounded-2xl p-4 border border-white/10 mt-4">
                  <p className="text-white font-bold text-sm mb-3">💰 Reparto del bote</p>
                  {[['🥇', '1er lugar', '70%'], ['🥈', '2do lugar', '20%'], ['🥉', '3er lugar', '10%']].map(([emoji, pos, pct]) => (
                    <div key={pos} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-green-200 text-sm">{emoji} {pos}</span>
                      <span className="text-white font-black">{pct}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── REGLAS ── */}
        {activeTab === 'rules' && (
          <div className="space-y-4 animate-fadeInUp">
            {/* Share button */}
            <button onClick={handleShare}
              className="press w-full bg-white text-green-700 font-black py-4 px-5 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-black/20 text-base hover:bg-green-50 transition-all">
              {copied
                ? <><span className="text-green-600">✓</span> ¡Enlace copiado!</>
                : <><Share2 size={20} /> Compartir invitación</>}
            </button>

            {/* Share URL display */}
            {shareUrl && (
              <div className="glass rounded-xl p-3 border border-white/10">
                <p className="text-green-300 text-xs mb-1">Enlace de invitación:</p>
                <p className="text-white text-xs font-mono break-all">{shareUrl}</p>
              </div>
            )}

            {/* Share popup fallback */}
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

            {/* Rules card */}
            <div className="glass rounded-2xl p-5 border border-white/10 space-y-5">
              <div>
                <h3 className="text-white font-black text-lg mb-1">El Prode de los Pibes™</h3>
                <p className="text-green-300 text-sm">Simple, sin excusas, como la vida misma.</p>
              </div>

              <div>
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">⚽ Sistema de puntos</p>
                <div className="space-y-3">
                  {[
                    { pts: '+3', emoji: '🎯', title: 'Resultado exacto', desc: 'Acertaste el marcador clavado. Sos un crack o tuviste chiripa — da lo mismo.' },
                    { pts: '+1', emoji: '👀', title: 'Tendencia correcta', desc: 'Sabías quién ganaba o que empataban, pero el marcador te quedó corto. Algo es algo.' },
                    { pts: '0',  emoji: '💀', title: 'Ni en pedo', desc: 'La erraste. Bancátela y seguí.' },
                  ].map(r => (
                    <div key={r.pts} className="flex gap-3">
                      <div className={`text-sm font-black px-2.5 py-1.5 rounded-lg flex-shrink-0 min-w-[40px] text-center ${
                        r.pts === '+3' ? 'bg-green-500/20 text-green-300' :
                        r.pts === '+1' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-400'
                      }`}>{r.pts}</div>
                      <div>
                        <p className="text-white font-semibold text-sm">{r.emoji} {r.title}</p>
                        <p className="text-green-300/70 text-xs mt-0.5">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">🍺 El bote</p>
                <p className="text-green-300 text-sm mb-3">
                  La cuota la ponen los pibes entre todos. El que sale campeón agarra el gordo, el resto se lleva las migas.
                </p>
                {[['🥇', '1er puesto', '70%', 'Para el asado de celebración'], ['🥈', '2do puesto', '20%', 'Para las birras del consolatorio'], ['🥉', '3er puesto', '10%', 'Para recuperar algo de dignidad']].map(([e, p, pct, desc]) => (
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
                    '⏱️ Se cierra cuando arranca el partido. Ni un segundo después.',
                    '📊 Los puntos van a todos tus grupos a la vez.',
                    '👑 El admin tiene la última palabra. Confiá en él (o no, pero no hay apelación).',
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

/* ─── MatchCard component ─── */
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
      isFinished ? 'glass border border-white/5' :
      'bg-white shadow-lg shadow-black/10'
    }`} style={{ animationDelay: `${idx * 50}ms` }}>
      {/* Date + status */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium capitalize ${isFinished ? 'text-green-300/60' : isLive ? 'text-orange-300' : 'text-gray-400'}`}>
          {fmtDate(match.match_date)}
        </span>
        {isLive && (
          <span className="text-xs bg-orange-400/20 text-orange-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />EN VIVO
          </span>
        )}
        {isFinished && (
          <span className="text-xs bg-white/10 text-green-300 px-2 py-0.5 rounded-full font-semibold">FIN</span>
        )}
      </div>

      {/* Teams + Score */}
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

      {/* Footer */}
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
