'use client';

import { useState } from 'react';

export default function AdminBewilligungStorage() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-bewilligung', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.fileName} erfolgreich hochgeladen!`);
        e.target.value = '';
      } else {
        setMessage(`❌ Fehler: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Upload fehlgeschlagen');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-3">
        🔒 Admin: Bewilligungen zu Vercel Blob hochladen
      </h3>
      <p className="text-sm text-blue-700 mb-4">
        Master-Dateien hier hochladen (werden im Cloud Storage gespeichert)
      </p>

      <label className="block">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-600 file:text-white
            hover:file:bg-blue-700
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </label>

      {uploading && (
        <p className="mt-3 text-sm text-blue-600">
          ⏳ Hochladen...
        </p>
      )}

      {message && (
        <p className="mt-3 text-sm font-medium">
          {message}
        </p>
      )}

      <p className="mt-4 text-xs text-gray-500">
        💡 Dateiname = Klienten-Nachname (z.B. "Köpke.xlsx")
      </p>
    </div>
  );
}
