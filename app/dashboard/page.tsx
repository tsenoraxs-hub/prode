'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, LogOut, ChevronRight, Loader2, Trophy, GitBranch, Star } from 'lucide-react'

type GroupMember = {
  group_id: string
  total_points: number
  groups: { id: string; name: string; invite_code: string }
}

export default function DashboardPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [ready, setReady] = useState(false)

  const fetchGroups = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, total_points, groups(id, name, invite_code)')
      .eq('user_id', id)
      .order('total_points', { ascending: false })
    setGroups((data as unknown as GroupMember[]) || [])
    setLoading(false)
    setTimeout(() => setReady(true), 80)
  }, [])

  useEffect(() => {
    const id = localStorage.getItem('userId')
    const name = localStorage.getItem('userName') || ''
    if (!id) { router.replace('/'); return }
    setUserId(id); setUserName(name); fetchGroups(id)
  }, [fetchGroups, router])

  const createGroup = async () => {
    if (!newGroupName.trim() || !userId) return
    setCreating(true)
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: group, error } = await supabase
      .from('groups').insert({ name: newGroupName.trim(), invite_code: inviteCode }).select('id').single()
    if (!error && group) {
      await supabase.from('group_members').insert({ group_id: group.id, user_id: userId })
      setNewGroupName(''); setShowCreate(false)
      router.push(`/grupo/${group.id}`)
    }
    setCreating(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-slate-900 flex items-center justify-center">
      <div className="animate-bounceBall text-5xl">⚽</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-slate-900">
      {/* Header */}
      <div className="px-4 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 bg-green-400/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-lg mx-auto flex items-center justify-between relative z-10">
          <div className="animate-slideInLeft">
            <p className="text-green-300 text-sm font-medium">Hola, <span className="text-white font-bold">{userName}</span> 👋</p>
            <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">Prode Mundial ⚽</h1>
          </div>
          <div className="flex items-center gap-2 animate-slideInRight">
            <button
              onClick={() => router.push('/bracket')}
              className="p-2.5 glass rounded-xl text-white hover:bg-white/10 transition-all press"
              title="Bracket del torneo"
            >
              <GitBranch size={18} />
            </button>
            <button
              onClick={() => { localStorage.clear(); router.replace('/') }}
              className="p-2.5 glass rounded-xl text-white hover:bg-white/10 transition-all press"
              title="Salir"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8 space-y-4">
        {/* Create button */}
        <button
          onClick={() => setShowCreate(true)}
          className={`press w-full bg-white text-green-700 font-black py-4 px-5 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-black/20 text-base hover:bg-green-50 ${ready ? 'animate-fadeInUp' : 'opacity-0'}`}
        >
          <Plus size={22} strokeWidth={3} />
          Crear nuevo Grupo de Prode
        </button>

        {/* Bracket shortcut */}
        <button
          onClick={() => router.push('/bracket')}
          className={`press w-full glass text-white font-semibold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2.5 transition-all border border-white/10 text-sm ${ready ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}
        >
          <GitBranch size={18} />
          Ver árbol de enfrentamientos 🏆
        </button>

        {/* Bracket predictions shortcut */}
        <button
          onClick={() => router.push('/predicciones-bracket')}
          className={`press w-full glass text-white font-semibold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2.5 transition-all border border-yellow-400/30 text-sm bg-yellow-400/10 ${ready ? 'animate-fadeInUp delay-150' : 'opacity-0'}`}
        >
          <Star size={18} className="text-yellow-400" />
          Mis predicciones de grupos y llaves ⚡
        </button>

        {/* Groups */}
        <div className={ready ? 'animate-fadeInUp delay-200' : 'opacity-0'}>
          <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-3 px-1">Mis grupos</p>

          {groups.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center border border-white/10">
              <div className="text-5xl mb-3">🍺</div>
              <p className="text-white font-semibold">Todavía no estás en ningún grupo</p>
              <p className="text-green-300 text-sm mt-1">Creá uno o pedile el enlace a alguien</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((member, idx) => (
                <button
                  key={member.group_id}
                  onClick={() => router.push(`/grupo/${member.group_id}`)}
                  className={`press w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-black/10 hover:shadow-xl transition-all text-left ${ready ? `animate-fadeInUp` : 'opacity-0'}`}
                  style={{ animationDelay: `${200 + idx * 80}ms` }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/30">
                    <span className="text-white font-black text-lg">{(member.groups?.name?.[0] ?? '?').toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 truncate text-base">{member.groups?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">#{member.groups?.invite_code}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-black text-green-600 leading-none animate-countUp">{member.total_points}</p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); setNewGroupName('') } }}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slideInLeft">
            <h2 className="text-xl font-black text-gray-800 mb-2">Nuevo Grupo</h2>
            <p className="text-gray-400 text-sm mb-5">Dale un nombre que mande, tipo "Los Cracks del Laburo"</p>
            <input
              type="text" value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createGroup()}
              placeholder="Nombre del grupo..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 mb-5 focus:outline-none focus:border-green-500 text-gray-800 text-base transition-colors"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowCreate(false); setNewGroupName('') }}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold press">
                Cancelar
              </button>
              <button onClick={createGroup} disabled={creating || !newGroupName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-black transition-colors press flex items-center justify-center gap-2">
                {creating ? <Loader2 size={16} className="animate-spin" /> : null}
                Crear 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
