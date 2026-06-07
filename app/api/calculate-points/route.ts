import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Prediction = {
  user_id: string
  pred_score_a: number
  pred_score_b: number
}

type Match = {
  real_score_a: number
  real_score_b: number
}

function calcPoints(pred: Prediction, match: Match): number {
  const exactA = pred.pred_score_a === match.real_score_a
  const exactB = pred.pred_score_b === match.real_score_b
  if (exactA && exactB) return 3

  const predResult = pred.pred_score_a > pred.pred_score_b ? 'a'
    : pred.pred_score_a < pred.pred_score_b ? 'b' : 'draw'
  const realResult = match.real_score_a > match.real_score_b ? 'a'
    : match.real_score_a < match.real_score_b ? 'b' : 'draw'

  return predResult === realResult ? 1 : 0
}

export async function POST(req: NextRequest) {
  const adminPin = req.headers.get('x-admin-pin')
  const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN ?? '0000'
  if (!adminPin || adminPin !== expectedPin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { match_id } = await req.json()

  if (!match_id) {
    return NextResponse.json({ error: 'match_id requerido' }, { status: 400 })
  }

  // Obtener el partido con su resultado real
  const { data: match, error: matchError } = await supabaseAdmin
    .from('matches')
    .select('real_score_a, real_score_b, status')
    .eq('id', match_id)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
  }

  if (match.status !== 'finished' || match.real_score_a === null || match.real_score_b === null) {
    return NextResponse.json({ error: 'El partido no está finalizado o no tiene resultado' }, { status: 400 })
  }

  // Obtener todas las predicciones para este partido
  const { data: predictions, error: predError } = await supabaseAdmin
    .from('predictions')
    .select('user_id, pred_score_a, pred_score_b')
    .eq('match_id', match_id)

  if (predError || !predictions) {
    return NextResponse.json({ error: 'Error al obtener predicciones' }, { status: 500 })
  }

  if (predictions.length === 0) {
    return NextResponse.json({ updated: 0, message: 'No hay predicciones para este partido' })
  }

  // Obtener todos los grupos de cada usuario que predijo
  const userIds = [...new Set(predictions.map(p => p.user_id))]

  const { data: memberships, error: membError } = await supabaseAdmin
    .from('group_members')
    .select('group_id, user_id, total_points')
    .in('user_id', userIds)

  if (membError || !memberships) {
    return NextResponse.json({ error: 'Error al obtener membresías de grupo' }, { status: 500 })
  }

  // Agrupar membresías por user_id para búsqueda rápida
  const membershipsByUser: Record<string, { group_id: string; total_points: number }[]> = {}
  for (const m of memberships) {
    if (!membershipsByUser[m.user_id]) membershipsByUser[m.user_id] = []
    membershipsByUser[m.user_id].push({ group_id: m.group_id, total_points: m.total_points })
  }

  // Construir lista de actualizaciones
  const updates: { group_id: string; user_id: string; total_points: number }[] = []

  for (const pred of predictions as Prediction[]) {
    const points = calcPoints(pred, match as Match)
    if (points === 0) continue

    const userMemberships = membershipsByUser[pred.user_id] || []
    for (const membership of userMemberships) {
      updates.push({
        group_id: membership.group_id,
        user_id: pred.user_id,
        total_points: membership.total_points + points,
      })
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ updated: 0, message: 'Nadie acertó en este partido' })
  }

  // Ejecutar todas las actualizaciones
  const { error: updateError } = await supabaseAdmin
    .from('group_members')
    .upsert(updates, { onConflict: 'group_id,user_id' })

  if (updateError) {
    return NextResponse.json({ error: 'Error al actualizar puntos' }, { status: 500 })
  }

  return NextResponse.json({
    updated: updates.length,
    message: `Puntos actualizados para ${updates.length} entradas en group_members`,
  })
}
