'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite')

  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      if (inviteCode) {
        joinGroupAndRedirect(userId, inviteCode)
      } else {
        router.replace('/dashboard')
      }
    } else {
      setChecking(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const joinGroupAndRedirect = async (userId: string, code: string) => {
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', code.toUpperCase())
      .single()

    if (group) {
      await supabase
        .from('group_members')
        .upsert({ group_id: group.id, user_id: userId }, { onConflict: 'group_id,user_id' })
      router.replace(`/grupo/${group.id}`)
    } else {
      router.replace('/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) { setError('Ingresa tu nombre'); return }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('El PIN debe ser exactamente 4 dígitos')
      return
    }

    setLoading(true)

    const { data: existing } = await supabase
      .from('users')
      .select('id, name')
      .eq('name', trimmedName)
      .eq('pin', pin)
      .maybeSingle()

    let userId: string

    if (existing) {
      userId = existing.id
    } else {
      // Verificar si el nombre ya existe con otro PIN
      const { data: sameName } = await supabase
        .from('users')
        .select('id')
        .eq('name', trimmedName)
        .maybeSingle()

      if (sameName) {
        setError('Ese nombre ya existe. Si es tu cuenta, revisa el PIN.')
        setLoading(false)
        return
      }

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ name: trimmedName, pin })
        .select('id')
        .single()

      if (createError || !newUser) {
        setError(`Error: ${createError?.message ?? createError?.code ?? 'respuesta vacía'}`)
        setLoading(false)
        return
      }
      userId = newUser.id
    }

    localStorage.setItem('userId', userId)
    localStorage.setItem('userName', trimmedName)

    if (inviteCode) {
      await joinGroupAndRedirect(userId, inviteCode)
    } else {
      router.replace('/dashboard')
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⚽</div>
          <h1 className="text-3xl font-black text-green-800 tracking-tight">Prode Mundial</h1>
          <p className="text-gray-400 mt-1 text-sm">Tu porra del Mundial 2026</p>
        </div>

        {inviteCode && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 text-sm text-green-700 text-center font-medium">
            🎉 Te invitaron a un grupo. Ingresá para unirte.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="¿Cómo te llaman?"
              required
              autoComplete="off"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-green-500 text-gray-800 text-base transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              PIN (4 dígitos)
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-green-500 text-center text-2xl tracking-[0.5em] text-gray-800 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Cargando...</> : 'Entrar al Prode'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
          Si tu nombre y PIN coinciden, iniciás sesión.<br />
          Si no existe la cuenta, se crea automáticamente.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-950 flex items-center justify-center">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
