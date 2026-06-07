'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle2, Plus, X } from 'lucide-react'

type Match = {
  id: string
  team_a: string
  team_b: string
  match_date: string
  real_score_a: number | null
  real_score_b: number | null
  status: 'pending' | 'finished'
}

type ScoreDraft = { a: string; b: string }

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<Record<string, ScoreDraft>>({})
  const [closing, setClosing] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newMatch, setNewMatch] = useState({ team_a: '', team_b: '', match_date: '' })
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchMatches = useCallback(async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true })
    setMatches(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMatches() }, [fetchMatches])

  const closeMatch = async (match: Match) => {
    const draft = scores[match.id]
    if (!draft || draft.a === '' || draft.b === '') {
      showToast('Ingresá ambos goles antes de cerrar el partido.')
      return
    }

    setClosing(match.id)

    // 1. Actualizar el partido
    const { error: matchError } = await supabase
      .from('matches')
      .update({
        real_score_a: Number(draft.a),
        real_score_b: Number(draft.b),
        status: 'finished',
      })
      .eq('id', match.id)

    if (matchError) {
      showToast('Error al actualizar el partido.')
      setClosing(null)
      return
    }

    // 2. Calcular puntos via API route
    const res = await fetch('/api/calculate-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id }),
    })

    if (!res.ok) {
      showToast('Partido cerrado, pero hubo un error al calcular puntos.')
    } else {
      const { updated } = await res.json()
      showToast(`✅ Partido cerrado. Puntos actualizados para ${updated} predicciones.`)
    }

    setClosing(null)
    fetchMatches()
  }

  const addMatch = async () => {
    if (!newMatch.team_a.trim() || !newMatch.team_b.trim() || !newMatch.match_date) {
      showToast('Completá todos los campos.')
      return
    }
    setAdding(true)
    const { error } = await supabase.from('matches').insert({
      team_a: newMatch.team_a.trim(),
      team_b: newMatch.team_b.trim(),
      match_date: new Date(newMatch.match_date).toISOString(),
    })
    if (!error) {
      setNewMatch({ team_a: '', team_b: '', match_date: '' })
      setShowAdd(false)
      showToast('Partido agregado.')
      fetchMatches()
    } else {
      showToast('Error al agregar el partido.')
    }
    setAdding(false)
  }

  const pending  = matches.filter(m => m.status === 'pending')
  const finished = matches.filter(m => m.status === 'finished')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-gray-600 text-white text-sm px-5 py-3 rounded-2xl shadow-2xl max-w-xs text-center">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">⚽ Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-0.5">Gestión de partidos — Prode Mundial</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus size={16} /> Agregar Partido
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-green-400" size={36} />
          </div>
        )}

        {/* Pending Matches */}
        {!loading && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Partidos Pendientes ({pending.length})
            </h2>

            {pending.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <p>No hay partidos pendientes.</p>
              </div>
            )}

            <div className="space-y-3">
              {pending.map(match => (
                <div key={match.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-white">
                        {match.team_a} <span className="text-gray-500">vs</span> {match.team_b}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(match.match_date).toLocaleString('es-AR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-400 font-medium">{match.team_a}</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="0"
                      value={scores[match.id]?.a ?? ''}
                      onChange={e => setScores(prev => ({
                        ...prev,
                        [match.id]: { ...(prev[match.id] ?? { a: '', b: '' }), a: e.target.value.replace(/\D/g, '').slice(0, 2) }
                      }))}
                      className="w-16 h-12 bg-gray-700 border border-gray-600 focus:border-green-500 rounded-xl text-center text-xl font-black text-white focus:outline-none"
                    />
                    <span className="text-gray-500 font-bold">–</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="0"
                      value={scores[match.id]?.b ?? ''}
                      onChange={e => setScores(prev => ({
                        ...prev,
                        [match.id]: { ...(prev[match.id] ?? { a: '', b: '' }), b: e.target.value.replace(/\D/g, '').slice(0, 2) }
                      }))}
                      className="w-16 h-12 bg-gray-700 border border-gray-600 focus:border-green-500 rounded-xl text-center text-xl font-black text-white focus:outline-none"
                    />
                    <span className="text-sm text-gray-400 font-medium">{match.team_b}</span>

                    <button
                      onClick={() => closeMatch(match)}
                      disabled={closing === match.id}
                      className="ml-auto bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                    >
                      {closing === match.id
                        ? <><Loader2 size={14} className="animate-spin" /> Cerrando...</>
                        : 'Cerrar Partido'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Finished Matches */}
        {!loading && finished.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Partidos Finalizados ({finished.length})
            </h2>
            <div className="space-y-2">
              {finished.map(match => (
                <div key={match.id} className="bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-300">
                      {match.team_a} vs {match.team_b}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(match.match_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-lg">
                      {match.real_score_a} – {match.real_score_b}
                    </span>
                    <CheckCircle2 size={18} className="text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Match Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50"
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-white">Agregar Partido</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={newMatch.team_a}
                onChange={e => setNewMatch(prev => ({ ...prev, team_a: e.target.value }))}
                placeholder="Equipo A (ej: Argentina)"
                className="w-full bg-gray-700 border border-gray-600 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
              />
              <input
                type="text"
                value={newMatch.team_b}
                onChange={e => setNewMatch(prev => ({ ...prev, team_b: e.target.value }))}
                placeholder="Equipo B (ej: Brasil)"
                className="w-full bg-gray-700 border border-gray-600 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
              />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha y hora del partido</label>
                <input
                  type="datetime-local"
                  value={newMatch.match_date}
                  onChange={e => setNewMatch(prev => ({ ...prev, match_date: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 focus:border-green-500 rounded-xl px-4 py-3 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 border border-gray-600 text-gray-400 py-3 rounded-xl font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={addMatch}
                disabled={adding}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {adding ? <Loader2 size={15} className="animate-spin" /> : null}
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
