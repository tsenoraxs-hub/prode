'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, LogOut, Trophy, Users, ChevronRight, Loader2, Star } from 'lucide-react'

type GroupMember = {
  group_id: string
  total_points: number
  groups: {
    id: string
    name: string
    invite_code: string
  }
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

  const fetchGroups = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, total_points, groups(id, name, invite_code)')
      .eq('user_id', id)
      .order('total_points', { ascending: false })

    setGroups((data as unknown as GroupMember[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = localStorage.getItem('userId')
    const name = localStorage.getItem('userName') || ''
    if (!id) { router.replace('/'); return }
    setUserId(id)
    setUserName(name)
    fetchGroups(id)
  }, [fetchGroups, router])

  const createGroup = async () => {
    if (!newGroupName.trim() || !userId) return
    setCreating(true)

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name: newGroupName.trim(), invite_code: inviteCode })
      .select('id')
      .single()

    if (!error && group) {
      await supabase.from('group_members').insert({ group_id: group.id, user_id: userId })
      setNewGroupName('')
      setShowCreate(false)
      router.push(`/grupo/${group.id}`)
    }
    setCreating(false)
  }

  const logout = () => {
    localStorage.clear()
    router.replace('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 pt-10 pb-6 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Prode Mundial ⚽</h1>
            <p className="text-green-200 text-sm mt-0.5">Hola, <span className="font-semibold text-white">{userName}</span>!</p>
          </div>
          <button
            onClick={logout}
            className="p-2.5 hover:bg-green-600 active:bg-green-800 rounded-xl transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Create Group Button */}
        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 px-5 rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-md text-base"
        >
          <Plus size={22} />
          Crear nuevo Grupo de Prode
        </button>

        {/* Groups Section */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 px-1">
            <Users size={15} />
            Mis Grupos
          </h2>

          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <Trophy size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium">Todavía no estás en ningún grupo.</p>
              <p className="text-gray-400 text-sm mt-1">
                Creá uno o pedile a alguien que te comparta su enlace de invitación.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((member) => (
                <button
                  key={member.group_id}
                  onClick={() => router.push(`/grupo/${member.group_id}`)}
                  className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md active:bg-gray-50 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star size={22} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{member.groups?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Código: <span className="font-mono font-semibold">{member.groups?.invite_code}</span></p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-black text-green-600 leading-none">{member.total_points}</p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50"
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black text-gray-800 mb-5">Nuevo Grupo de Prode</h2>
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createGroup()}
              placeholder="Ej: Los Cracks del Barrio"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 mb-5 focus:outline-none focus:border-green-500 text-gray-800 text-base"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreate(false); setNewGroupName('') }}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold active:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createGroup}
                disabled={creating || !newGroupName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : null}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
