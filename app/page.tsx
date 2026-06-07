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
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      if (inviteCode) joinGroupAndRedirect(userId, inviteCode)
      else router.replace('/dashboard')
    } else {
      setChecking(false)
      setTimeout(() => setReady(true), 50)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const joinGroupAndRedirect = async (userId: string, code: string) => {
    const { data: group } = await supabase
      .from('groups').select('id').eq('invite_code', code.toUpperCase()).single()
    if (group) {
      await supabase.from('group_members')
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
    if (!trimmedName) { setError('Ingresá tu nombre, crack'); return }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('El PIN son 4 dígitos exactos'); return }
    setLoading(true)

    const { data: existing } = await supabase
      .from('users').select('id').eq('name', trimmedName).eq('pin', pin).maybeSingle()

    let userId: string
    if (existing) {
      userId = existing.id
    } else {
      const { data: sameName } = await supabase
        .from('users').select('id').eq('name', trimmedName).maybeSingle()
      if (sameName) {
        setError('Ese nombre ya existe con otro PIN. ¿Lo recordás?')
        setLoading(false); return
      }
      const { data: newUser, error: createError } = await supabase
        .from('users').insert({ name: trimmedName, pin }).select('id').single()
      if (createError || !newUser) {
        setError(`Error: ${createError?.message ?? 'respuesta vacía'}`)
        setLoading(false); return
      }
      userId = newUser.id
    }

    localStorage.setItem('userId', userId)
    localStorage.setItem('userName', trimmedName)
    if (inviteCode) await joinGroupAndRedirect(userId, inviteCode)
    else router.replace('/dashboard')
  }

  if (checking) return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-slate-900 flex items-center justify-center">
      <div className="animate-bounceBall text-5xl">⚽</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/3 right-10 text-6xl opacity-10 animate-bounceBall delay-300">⚽</div>
        <div className="absolute bottom-1/4 left-8 text-4xl opacity-10 animate-bounceBall delay-500">⚽</div>
      </div>

      <div className={`bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm relative z-10 transition-all duration-500 ${ready ? 'animate-scaleIn' : 'opacity-0 scale-95'}`}>
        {/* Header */}
        <div className="text-center mb-7">
          <div className="text-6xl animate-bounceBall inline-block mb-2">⚽</div>
          <h1 className="text-3xl font-black text-green-800 tracking-tight">Prode Mundial</h1>
          <p className="text-gray-400 mt-1 text-sm">Mundial 2026 · La porra de los pibes</p>
        </div>

        {inviteCode && (
          <div className="animate-fadeInUp bg-green-50 border border-green-200 rounded-xl p-3 mb-5 text-sm text-green-700 text-center font-medium">
            🎉 Te invitaron a un grupo. ¡Entrá y metete!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="animate-fadeInUp delay-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nombre</label>
            <input
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="¿Cómo te llaman?"
              required autoComplete="off"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-green-500 text-gray-800 text-base transition-all duration-200 hover:border-gray-300"
            />
          </div>

          <div className="animate-fadeInUp delay-200">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">PIN secreto (4 dígitos)</label>
            <input
              type="password" value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••" maxLength={4} inputMode="numeric" required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-green-500 text-center text-3xl tracking-[0.5em] text-gray-800 transition-all duration-200 hover:border-gray-300"
            />
          </div>

          {error && (
            <div className="animate-popIn bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="animate-fadeInUp delay-300 press w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-black py-4 rounded-xl text-base transition-all duration-200 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 mt-2"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Entrando...</>
              : '⚽ Entrar al Prode'}
          </button>
        </form>

        <p className="animate-fadeInUp delay-400 text-xs text-gray-400 text-center mt-5 leading-relaxed">
          Nombre + PIN que ya usaste → iniciás sesión.<br />
          Nombre nuevo → se crea tu cuenta automáticamente.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="animate-bounceBall text-5xl">⚽</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
