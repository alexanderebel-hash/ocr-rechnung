'use client';

import { useState, useEffect } from 'react';
import { loadAllKlienten, fallbackKlienten, type Klient } from '@/lib/seedData';

interface KlientenDropdownProps {
  onSelect: (klient: Klient) => void;
  onNewKlient: () => void;
}

export function KlientenDropdown({ onSelect, onNewKlient }: KlientenDropdownProps) {
  const [klienten, setKlienten] = useState<Klient[]>(fallbackKlienten);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const loaded = await loadAllKlienten();
        setKlienten(loaded.length > 0 ? loaded : fallbackKlienten);
      } catch (error) {
        console.error('Error loading klienten:', error);
        setKlienten(fallbackKlienten);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getStatusBadge(bewilligung: any) {
    const ends = new Date(bewilligung.gueltig_bis);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { text: 'Abgelaufen', color: 'bg-red-500' };
    if (daysUntilExpiry <= 30) return { text: `${daysUntilExpiry}T`, color: 'bg-orange-500' };
    if (daysUntilExpiry <= 90) return { text: `${daysUntilExpiry}T`, color: 'bg-yellow-500' };
    return { text: 'Aktiv', color: 'bg-green-500' };
  }

  const sortedKlienten = [...klienten].sort((a, b) => {
    const aEnds = new Date(a.bewilligungen[0].gueltig_bis);
    const bEnds = new Date(b.bewilligungen[0].gueltig_bis);
    return aEnds.getTime() - bEnds.getTime(); // Sort by nearest expiry first
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-gray-600"></div>
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dropdown */}
      <div className="relative">
        <select
          value={selectedId}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedId(value);

            if (value === 'new') {
              onNewKlient();
            } else if (value) {
              const klient = klienten.find(k => k.id === value);
              if (klient) onSelect(klient);
            }
          }}
          className="
            w-full px-4 py-4
            bg-white/5 backdrop-blur-xl
            border border-white/10
            rounded-2xl
            text-white text-base
            appearance-none
            cursor-pointer
            focus:border-cyan-500
            focus:outline-none
            focus:ring-2 focus:ring-cyan-500/50
            transition-all duration-300
            hover:bg-white/10
          "
        >
          <option value="" className="bg-slate-900">
            📋 Klient auswählen... ({klienten.length} verfügbar)
          </option>

          <option value="new" className="bg-slate-900 font-semibold">
            ✨ Neuen Klienten anlegen
          </option>

          <optgroup label="Bestehende Klienten" className="bg-slate-900">
            {sortedKlienten.map((klient) => {
              const bewilligung = klient.bewilligungen[0];
              const status = getStatusBadge(bewilligung);

              return (
                <option
                  key={klient.id}
                  value={klient.id}
                  className="bg-slate-900"
                >
                  {klient.name} - PG{klient.pflegegrad}
                  {' '}(bis {bewilligung.gueltig_bis})
                  {' '}[{status.text}]
                </option>
              );
            })}
          </optgroup>
        </select>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedKlienten.map((klient) => {
          const bewilligung = klient.bewilligungen[0];
          const status = getStatusBadge(bewilligung);

          return (
            <button
              key={klient.id}
              onClick={() => {
                setSelectedId(klient.id);
                onSelect(klient);
              }}
              className={`
                p-5 rounded-2xl
                bg-white/5 backdrop-blur-xl
                border transition-all duration-300
                hover:scale-105 hover:bg-white/10
                text-left
                ${selectedId === klient.id
                  ? 'border-cyan-500 shadow-lg shadow-cyan-500/50'
                  : 'border-white/10 hover:border-cyan-500/50'}
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-base mb-1">
                    {klient.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    📍 {klient.stadtteil}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs text-white shrink-0 ml-2 ${status.color}`}>
                  {status.text}
                </span>
              </div>

              <div className="text-sm text-gray-400 space-y-1">
                <p className="font-medium">Pflegegrad {klient.pflegegrad}</p>
                <p className="text-xs">Gültig bis: {bewilligung.gueltig_bis}</p>
                <p className="text-xs text-cyan-400 font-medium">
                  {bewilligung.leistungen.length} Leistungen bewilligt
                </p>
              </div>
            </button>
          );
        })}

        {/* New Client Card */}
        <button
          onClick={() => {
            setSelectedId('new');
            onNewKlient();
          }}
          className={`
            p-5 rounded-2xl
            border-2 border-dashed
            transition-all duration-300
            hover:scale-105
            text-center
            ${selectedId === 'new'
              ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/30'
              : 'border-white/20 hover:border-cyan-500/50 bg-white/5'}
          `}
        >
          <div className="text-5xl mb-3">✨</div>
          <h4 className="font-semibold text-white text-base mb-2">
            Neuen Klienten anlegen
          </h4>
          <p className="text-xs text-gray-400">
            Manuelle Erfassung
          </p>
        </button>
      </div>
    </div>
  );
}
