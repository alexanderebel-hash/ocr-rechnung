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
  const [selectedLeistung, setSelectedLeistung] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editedMenge, setEditedMenge] = useState<number>(0);

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
    return a.name.localeCompare(b.name, 'de-DE'); // Alphabetical sort
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
              {selectedKlient.bewilligungen[0]?.leistungen.map((leistung: any, idx: number) => {
                const proMonat = leistung.menge;
                const proWoche = Math.round((proMonat / 4) * 10) / 10; // Round to 1 decimal

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedLeistung(leistung);
                      setEditedMenge(proMonat);
                      setShowModal(true);
                    }}
                    className="p-3 bg-white rounded border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <span className="font-mono text-base font-semibold text-blue-600">
                          {leistung.lkCode}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900 bg-blue-50 px-2 py-1 rounded">
                          {proMonat}x / Monat
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        📅 {proWoche}x / Woche
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-medium">
                        ✓ Klicken zum Übernehmen
                      </span>
                    </div>
                  </div>
                );
              })}
              {(!selectedKlient.bewilligungen[0]?.leistungen || selectedKlient.bewilligungen[0].leistungen.length === 0) && (
                <p className="text-sm text-gray-500 italic">Keine Leistungen bewilligt</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Leistung übernehmen oder bearbeiten */}
      {showModal && selectedLeistung && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Leistung bearbeiten
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Leistung Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-lg font-bold text-blue-600">
                    {selectedLeistung.lkCode}
                  </span>
                  <span className="text-sm text-gray-600">
                    Bewilligt: {selectedLeistung.menge}x / Monat
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  ≈ {Math.round((selectedLeistung.menge / 4) * 10) / 10}x / Woche
                </div>
              </div>

              {/* Menge bearbeiten */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menge pro Monat:
                </label>
                <input
                  type="number"
                  value={editedMenge}
                  onChange={(e) => setEditedMenge(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.1"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Pro Woche: ≈ {Math.round((editedMenge / 4) * 10) / 10}x
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    // TODO: Bewilligung übernehmen (Original-Menge)
                    console.log('✓ Übernommen:', selectedLeistung.lkCode, selectedLeistung.menge);
                    setShowModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  ✓ Bewilligung übernehmen
                </button>
                <button
                  onClick={() => {
                    // TODO: Angepasste Menge übernehmen
                    console.log('✏️ Angepasst:', selectedLeistung.lkCode, editedMenge);
                    setShowModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  ✏️ Änderung übernehmen
                </button>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
