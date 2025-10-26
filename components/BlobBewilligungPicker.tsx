'use client';

import { useState, useEffect } from 'react';

interface BlobItem {
  key: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

interface BewilligungData {
  klient: { nachname: string; vorname: string };
  zeitraum: { von: string; bis: string };
  leistungen: Array<{
    leistungsart: string;
    einheit: string;
    menge: number;
    minuten: number;
  }>;
  kasse: string;
  versichertennummer: string;
}

interface BlobBewilligungPickerProps {
  onBewilligungLoaded: (data: BewilligungData, meta: { key: string; filename: string }) => void;
}

export default function BlobBewilligungPicker({ onBewilligungLoaded }: BlobBewilligungPickerProps) {
  const [items, setItems] = useState<BlobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

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

  async function handleLoad(key: string) {
    setLoadingKey(key);
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

      setSelectedKey(key);
      onBewilligungLoaded(json.data, json.meta);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Bewilligung');
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Bewilligung aus Blob laden
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

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Lade Bewilligungen...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Keine Bewilligungen im Blob gefunden.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map((item) => {
            const isLoading = loadingKey === item.key;
            const isSelected = selectedKey === item.key;

            return (
              <div
                key={item.key}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isSelected
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(item.size / 1024).toFixed(1)} KB • {new Date(item.uploadedAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <button
                  onClick={() => handleLoad(item.key)}
                  disabled={isLoading}
                  className={`ml-3 px-4 py-2 text-sm font-medium rounded-lg ${
                    isSelected
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Lädt...
                    </span>
                  ) : isSelected ? (
                    '✓ Geladen'
                  ) : (
                    'Laden'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
