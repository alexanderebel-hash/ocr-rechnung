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

  const selectedKlient = selectedId ? klienten.find(k => k.id === selectedId) : null;

  return (
    <div className="space-y-4">
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
            w-full px-4 py-3
            bg-white border border-gray-300
            rounded-lg
            text-gray-900 text-base
            appearance-none
            cursor-pointer
            focus:border-blue-500
            focus:outline-none
            focus:ring-2 focus:ring-blue-500/20
            transition-all
            hover:border-gray-400
          "
        >
          <option value="">
            Klient auswählen... ({klienten.length} verfügbar)
          </option>

          <optgroup label="Bestehende Klienten">
            {sortedKlienten.map((klient) => {
              const bewilligung = klient.bewilligungen[0];
              const status = getStatusBadge(bewilligung);

              return (
                <option
                  key={klient.id}
                  value={klient.id}
                >
                  {klient.name} - PG{klient.pflegegrad} (bis {bewilligung.gueltig_bis}) [{status.text}]
                </option>
              );
            })}
          </optgroup>
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Preview: Klient Info + Bewilligte Leistungen */}
      {selectedKlient && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Links: Klient Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">
              Klient-Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <p className="text-gray-900">{selectedKlient.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Pflegegrad:</span>
                <p className="text-gray-900">{selectedKlient.pflegegrad}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Adresse:</span>
                <p className="text-gray-900">{selectedKlient.adresse}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Pflegedienst:</span>
                <p className="text-gray-900">{selectedKlient.pflegedienst}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Standort:</span>
                <p className="text-gray-900">{selectedKlient.standort}</p>
              </div>
              {selectedKlient.bewilligungen[0] && (
                <div className="pt-2 border-t">
                  <span className="font-medium text-gray-700">Bewilligung gültig:</span>
                  <p className="text-gray-900">
                    {new Date(selectedKlient.bewilligungen[0].gueltig_von).toLocaleDateString('de-DE')}
                    {' bis '}
                    {new Date(selectedKlient.bewilligungen[0].gueltig_bis).toLocaleDateString('de-DE')}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded text-xs text-white ${
                      getStatusBadge(selectedKlient.bewilligungen[0]).color
                    }`}
                  >
                    {getStatusBadge(selectedKlient.bewilligungen[0]).text}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rechts: Bewilligte Leistungen */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">
              Bewilligte Leistungen ({selectedKlient.bewilligungen[0]?.leistungen.length || 0})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedKlient.bewilligungen[0]?.leistungen.map((leistung: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <span className="font-mono text-sm font-semibold text-blue-600">
                      {leistung.lkCode}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {leistung.menge}x
                    </span>
                  </div>
                </div>
              ))}
              {(!selectedKlient.bewilligungen[0]?.leistungen || selectedKlient.bewilligungen[0].leistungen.length === 0) && (
                <p className="text-sm text-gray-500 italic">Keine Leistungen bewilligt</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
