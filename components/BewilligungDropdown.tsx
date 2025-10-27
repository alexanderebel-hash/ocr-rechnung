'use client';

import { useState, useEffect } from 'react';

interface BlobItem {
  key: string;
  filename: string;
  size: number;
  uploadedAt: string;
  nachname: string;
  vorname: string;
  zeitraum: string;
}

interface BewilligungData {
  klient: {
    nachname: string;
    vorname: string;
    pflegegrad: number;
    adresse: string;
  };
  zeitraum: { von: string; bis: string };
  leistungen: Array<{
    leistungsart: string;
    bezeichnung: string;
    einheit: string;
    menge: number;
    minuten: number;
    einzelpreis: number;
  }>;
  kasse: string;
  versichertennummer: string;
}

interface BewilligungDropdownProps {
  onBewilligungConfirmed: (data: BewilligungData, meta: { key: string; filename: string }) => void;
}

export default function BewilligungDropdown({ onBewilligungConfirmed }: BewilligungDropdownProps) {
  const [items, setItems] = useState<BlobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [bewilligungData, setBewilligungData] = useState<BewilligungData | null>(null);
  const [bewilligungMeta, setBewilligungMeta] = useState<{ key: string; filename: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingBewilligung, setLoadingBewilligung] = useState(false);

  useEffect(() => {
    loadList();
  }, []);

  async function loadList() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bewilligungen/list', { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Liste konnte nicht geladen werden');
      setItems(json.items || []);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Liste');
    } finally {
      setLoading(false);
    }
  }

  async function handleDropdownChange(key: string) {
    if (!key) {
      setSelectedKey('');
      setBewilligungData(null);
      setBewilligungMeta(null);
      return;
    }

    setSelectedKey(key);
    setLoadingBewilligung(true);
    setError('');

    try {
      const res = await fetch('/api/bewilligungen/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
        cache: 'no-store',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Laden fehlgeschlagen');

      // Ensure leistungen array exists
      const data = {
        ...json.data,
        leistungen: json.data.leistungen || [],
      };

      setBewilligungData(data);
      setBewilligungMeta(json.meta);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Bewilligung');
      setBewilligungData(null);
      setBewilligungMeta(null);
    } finally {
      setLoadingBewilligung(false);
    }
  }

  function handleFieldChange(field: string, value: any) {
    if (!bewilligungData) return;

    setBewilligungData({
      ...bewilligungData,
      [field]: value,
    });
  }

  function handleKlientChange(field: string, value: any) {
    if (!bewilligungData) return;

    setBewilligungData({
      ...bewilligungData,
      klient: {
        ...bewilligungData.klient,
        [field]: value,
      },
    });
  }

  function handleZeitraumChange(field: string, value: string) {
    if (!bewilligungData) return;

    setBewilligungData({
      ...bewilligungData,
      zeitraum: {
        ...bewilligungData.zeitraum,
        [field]: value,
      },
    });
  }

  function handleLeistungChange(index: number, field: string, value: any) {
    if (!bewilligungData) return;

    const newLeistungen = [...bewilligungData.leistungen];
    newLeistungen[index] = {
      ...newLeistungen[index],
      [field]: value,
    };

    setBewilligungData({
      ...bewilligungData,
      leistungen: newLeistungen,
    });
  }

  function handleRemoveLeistung(index: number) {
    if (!bewilligungData) return;

    const newLeistungen = bewilligungData.leistungen.filter((_, i) => i !== index);
    setBewilligungData({
      ...bewilligungData,
      leistungen: newLeistungen,
    });
  }

  function handleAddLeistung() {
    if (!bewilligungData) return;

    const newLeistung = {
      leistungsart: '',
      bezeichnung: '',
      einheit: 'x/Monat',
      menge: 0,
      minuten: 0,
      einzelpreis: 0,
    };

    setBewilligungData({
      ...bewilligungData,
      leistungen: [...bewilligungData.leistungen, newLeistung],
    });
  }

  function handleConfirm() {
    if (bewilligungData && bewilligungMeta) {
      onBewilligungConfirmed(bewilligungData, bewilligungMeta);
    }
  }

  const selectedItem = items.find(item => item.key === selectedKey);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Bewilligung auswählen
        </h2>
        <button
          onClick={loadList}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          {loading ? 'Lädt...' : 'Aktualisieren'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bewilligung
        </label>
        <select
          value={selectedKey}
          onChange={(e) => handleDropdownChange(e.target.value)}
          disabled={loading || loadingBewilligung}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">-- Bitte wählen --</option>
          {items.map((item) => (
            <option key={item.key} value={item.key}>
              {item.nachname}, {item.vorname} ({item.zeitraum || 'Kein Zeitraum'})
            </option>
          ))}
        </select>
        {selectedItem && (
          <p className="mt-2 text-xs text-gray-500">
            Datei: {selectedItem.filename} • {(selectedItem.size / 1024).toFixed(1)} KB
          </p>
        )}
      </div>

      {/* Loading indicator */}
      {loadingBewilligung && (
        <div className="text-center py-8 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Lade Bewilligungsdaten...</p>
        </div>
      )}

      {/* Preview */}
      {bewilligungData && !loadingBewilligung && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Vorschau</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {isEditing ? '🔒 Bearbeitung beenden' : '✏️ Bearbeiten'}
            </button>
          </div>

          {/* Klient Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">Klient</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nachname</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={bewilligungData.klient.nachname}
                    onChange={(e) => handleKlientChange('nachname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900">{bewilligungData.klient.nachname || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Vorname</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={bewilligungData.klient.vorname}
                    onChange={(e) => handleKlientChange('vorname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900">{bewilligungData.klient.vorname || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Pflegegrad</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={bewilligungData.klient.pflegegrad}
                    onChange={(e) => handleKlientChange('pflegegrad', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="1"
                    max="5"
                  />
                ) : (
                  <p className="text-gray-900">{bewilligungData.klient.pflegegrad || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Adresse</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={bewilligungData.klient.adresse}
                    onChange={(e) => handleKlientChange('adresse', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900">{bewilligungData.klient.adresse || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Zeitraum Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">Zeitraum</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Von</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={bewilligungData.zeitraum.von}
                    onChange={(e) => handleZeitraumChange('von', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="DD.MM.YYYY"
                  />
                ) : (
                  <p className="text-gray-900">{bewilligungData.zeitraum.von || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bis</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={bewilligungData.zeitraum.bis}
                    onChange={(e) => handleZeitraumChange('bis', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="DD.MM.YYYY"
                  />
                ) : (
                  <p className="text-gray-900">{bewilligungData.zeitraum.bis || '-'}</p>
                )}
              </div>
            </div>
            {selectedItem?.zeitraum && (
              <p className="mt-2 text-xs text-gray-500">
                Zeitraum aus Dateiname: {selectedItem.zeitraum}
              </p>
            )}
          </div>

          {/* Leistungen Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">
                Leistungen ({bewilligungData.leistungen?.length || 0})
              </h4>
              {isEditing && (
                <button
                  onClick={handleAddLeistung}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Leistung hinzufügen
                </button>
              )}
            </div>

            {!bewilligungData.leistungen || bewilligungData.leistungen.length === 0 ? (
              <p className="text-gray-500 text-sm">Keine Leistungen vorhanden</p>
            ) : (
              <div className="space-y-3">
                {bewilligungData.leistungen.map((leistung, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">LK-Code</label>
                            <input
                              type="text"
                              value={leistung.leistungsart}
                              onChange={(e) => handleLeistungChange(index, 'leistungsart', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">Bezeichnung</label>
                            <input
                              type="text"
                              value={leistung.bezeichnung}
                              onChange={(e) => handleLeistungChange(index, 'bezeichnung', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Einheit</label>
                            <select
                              value={leistung.einheit}
                              onChange={(e) => handleLeistungChange(index, 'einheit', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="x/Monat">x/Monat</option>
                              <option value="x/Woche">x/Woche</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Menge</label>
                            <input
                              type="number"
                              value={leistung.menge}
                              onChange={(e) => handleLeistungChange(index, 'menge', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Minuten</label>
                            <input
                              type="number"
                              value={leistung.minuten}
                              onChange={(e) => handleLeistungChange(index, 'minuten', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Preis €</label>
                            <input
                              type="number"
                              value={leistung.einzelpreis}
                              onChange={(e) => handleLeistungChange(index, 'einzelpreis', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveLeistung(index)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          🗑️ Entfernen
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        <div>
                          <span className="font-semibold">{leistung.leistungsart}</span>
                        </div>
                        <div className="col-span-2 text-gray-700">
                          {leistung.bezeichnung}
                        </div>
                        <div className="text-gray-600">
                          {leistung.menge} {leistung.einheit}
                        </div>
                        <div className="text-right font-medium">
                          {leistung.einzelpreis.toFixed(2)} €
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kasse & Versichertennummer */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Pflegekasse</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={bewilligungData.kasse}
                    onChange={(e) => handleFieldChange('kasse', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900">{bewilligungData.kasse || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Versichertennummer</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={bewilligungData.versichertennummer}
                    onChange={(e) => handleFieldChange('versichertennummer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900">{bewilligungData.versichertennummer || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              ✓ Bewilligungsdaten für Korrekturrechnung verwenden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
