'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

/* ── BRACKET DATA ──────────────────────────────────────
   Grupos confirmados del Mundial 2026.
   Fase eliminatoria: se actualizará cuando avance el torneo.
   El admin puede editar este archivo o se integrará con la DB.
────────────────────────────────────────────────────────── */

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

/* Round of 32 bracket seeding (2026 FIFA format) */
const R32: { home: string; away: string }[] = [
  { home: '1A', away: '2B' }, { home: '1B', away: '2A' },
  { home: '1C', away: '2D' }, { home: '1D', away: '2C' },
  { home: '1E', away: '2F' }, { home: '1F', away: '2E' },
  { home: '1G', away: '2H' }, { home: '1H', away: '2G' },
  { home: '1I', away: '2J' }, { home: '1J', away: '2I' },
  { home: '1K', away: '2L' }, { home: '1L', away: '2K' },
  { home: '3A/B/C', away: '3D/E/F' }, { home: '3G/H/I', away: '3J/K/L' },
  { home: '3A/B/C/D', away: '3E/F/G/H' }, { home: '3I/J/K/L', away: '...' },
]

type Slot = { label: string; winner?: string }

const KNOCKOUT: { round: string; matches: Slot[][] }[] = [
  {
    round: 'R32',
    matches: R32.map(m => [{ label: m.home }, { label: m.away }]),
  },
  {
    round: 'Octavos',
    matches: Array(8).fill(null).map(() => [{ label: 'TBD' }, { label: 'TBD' }]),
  },
  {
    round: 'Cuartos',
    matches: Array(4).fill(null).map(() => [{ label: 'TBD' }, { label: 'TBD' }]),
  },
  {
    round: 'Semis',
    matches: Array(2).fill(null).map(() => [{ label: 'TBD' }, { label: 'TBD' }]),
  },
  {
    round: 'Final',
    matches: [[{ label: 'TBD' }, { label: 'TBD' }]],
  },
]

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

export default function BracketPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-slate-900">
      {/* Header */}
      <div className="px-4 pt-10 pb-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 animate-slideInLeft">
          <button onClick={() => router.back()}
            className="p-2.5 glass rounded-xl text-white hover:bg-white/10 transition-all press">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Árbol del Mundial 🏆</h1>
            <p className="text-green-300 text-sm">Mundial 2026 · 48 equipos · 12 grupos</p>
          </div>
        </div>
      </div>

      {/* ── GROUPS ── */}
      <section className="px-4 pb-8 max-w-4xl mx-auto">
        <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-4 animate-fadeInUp">
          Fase de Grupos (11–27 Jun)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GROUPS.map((g, idx) => (
            <div key={g.id}
              className="glass rounded-2xl overflow-hidden border border-white/10 animate-fadeInUp"
              style={{ animationDelay: `${idx * 40}ms` }}>
              {/* Group header */}
              <div className={`bg-gradient-to-r ${GROUP_COLORS[g.id]} px-3 py-2 flex items-center gap-2`}>
                <span className="text-white font-black text-base">Grupo {g.id}</span>
              </div>
              {/* Teams */}
              <div className="p-2 space-y-1">
                {g.teams.map((team, ti) => (
                  <div key={team} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-white/5 transition-colors">
                    <span className={`text-xs font-black w-4 ${ti === 0 ? 'text-yellow-400' : ti === 1 ? 'text-gray-400' : 'text-green-400/40'}`}>
                      {ti + 1}
                    </span>
                    <span className="text-white text-xs font-medium truncate">{team}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── KNOCKOUT BRACKET (horizontal scroll) ── */}
      <section className="px-4 pb-12 max-w-4xl mx-auto">
        <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-4 animate-fadeInUp delay-200">
          Fase Eliminatoria (desde 28 Jun)
        </p>

        {/* Bracket scroll container */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-4 min-w-max">
            {KNOCKOUT.map((round, rIdx) => (
              <div key={round.round}
                className={`flex flex-col animate-fadeInUp`}
                style={{ animationDelay: `${200 + rIdx * 80}ms` }}>
                {/* Round header */}
                <div className="mb-3">
                  <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                    round.round === 'Final'
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black'
                      : 'glass text-green-300 border border-white/10'
                  }`}>
                    {round.round}
                  </span>
                </div>

                {/* Matches column */}
                <div className="flex flex-col justify-around flex-1 gap-3">
                  {round.matches.map((match, mIdx) => (
                    <BracketMatch
                      key={mIdx}
                      slotA={match[0]}
                      slotB={match[1]}
                      isFinal={round.round === 'Final'}
                      width={round.round === 'R32' ? 120 : round.round === 'Octavos' ? 130 : 140}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* 3rd place */}
            <div className="flex flex-col animate-fadeInUp" style={{ animationDelay: '600ms' }}>
              <div className="mb-3">
                <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full glass text-green-300 border border-white/10">
                  3er Lugar
                </span>
              </div>
              <div className="flex flex-col justify-around flex-1 gap-3">
                <BracketMatch slotA={{ label: 'TBD' }} slotB={{ label: 'TBD' }} isFinal={false} width={140} />
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 glass rounded-xl p-3 border border-white/10 animate-fadeInUp delay-500">
          <p className="text-green-300 text-xs text-center">
            🔄 El árbol se actualiza automáticamente cuando el admin carga los resultados de grupos y fases eliminatorias.
            <br />Los números indican la posición del grupo (1A = 1er lugar Grupo A).
          </p>
        </div>
      </section>

      {/* ── CHAMPION SPOTLIGHT ── */}
      <section className="px-4 pb-12 max-w-lg mx-auto text-center animate-fadeInUp delay-600">
        <div className="glass rounded-3xl p-8 border border-white/10">
          <div className="text-6xl animate-beerFoam inline-block mb-3">🍺</div>
          <h2 className="text-white font-black text-2xl">¿Quién levanta la Copa?</h2>
          <p className="text-green-300 mt-2 text-sm">
            El que acierte más y llegue campeón del prode, se lleva la 🍺 copa del mundo y el 70% del bote.
          </p>
          <p className="text-green-400/60 text-xs mt-4">
            Mundial 2026 · USA · Canadá · México
          </p>
        </div>
      </section>
    </div>
  )
}

function BracketMatch({ slotA, slotB, isFinal, width }: {
  slotA: Slot; slotB: Slot; isFinal: boolean; width: number
}) {
  const isTBD = (s: Slot) => !s.winner && (s.label === 'TBD' || s.label.startsWith('3'))

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border ${isFinal ? 'border-yellow-400/40' : 'border-white/10'}`}
      style={{ width }}>
      {/* Slot A */}
      <div className={`px-2.5 py-2 border-b ${isFinal ? 'border-yellow-400/20' : 'border-white/5'} ${
        slotA.winner ? 'bg-green-500/20' : isTBD(slotA) ? 'bg-white/5' : 'bg-white/10'
      }`}>
        <p className={`text-xs font-bold truncate ${
          slotA.winner ? 'text-green-300' : isTBD(slotA) ? 'text-white/30 italic' : 'text-white'
        }`}>
          {slotA.winner ?? slotA.label}
        </p>
      </div>
      {/* Slot B */}
      <div className={`px-2.5 py-2 ${
        slotB.winner ? 'bg-green-500/20' : isTBD(slotB) ? 'bg-white/5' : 'bg-white/10'
      }`}>
        <p className={`text-xs font-bold truncate ${
          slotB.winner ? 'text-green-300' : isTBD(slotB) ? 'text-white/30 italic' : 'text-white'
        }`}>
          {slotB.winner ?? slotB.label}
        </p>
      </div>
    </div>
  )
}
