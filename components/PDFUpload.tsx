'use client';
import { useState, useRef } from 'react';

interface BewilligungRow {
  lkCode: string;
  bezeichnung: string;
  jeWoche: number;
  jeMonat: number;
}

interface KlientData {
  name: string;
  zeitraumVon: string;
  zeitraumBis: string;
  geburtsdatum: string;
  pflegegrad: number;
  debitor: string;
  belegNr: string;
  genehmigungsDatum: string;
  genehmigungsNr: string;
}

interface RechnungsPosition {
  lkCode: string;
  bezeichnung: string;
  menge: number;
  preis: number;
  gesamt: number;
  bewilligt: boolean;
  istAUB?: boolean;
}

interface BewilligungData {
  klientData: KlientData;
  bewilligung: BewilligungRow[];
  investitionskosten?: string | null;
}

interface RechnungData {
  rechnungsPositionen: RechnungsPosition[];
  zinv?: string | null;
  gesamtbetrag: number;
  rechnungsnummer?: string;
}

interface PDFUploadProps {
  type: 'bewilligung' | 'rechnung';
  onDataExtracted: (data: BewilligungData | RechnungData) => void;
}

export default function PDFUpload({ type, onDataExtracted }: PDFUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.type.includes('pdf')) {
      setError('Bitte nur PDF-Dateien hochladen');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess(false);

    // Start OCR processing
    await processFile(selectedFile);
  };

  const processFile = async (fileToProcess: File) => {
    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', fileToProcess);
      formData.append('type', type);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'OCR-Processing fehlgeschlagen');
      }

      if (result.success && result.data) {
        onDataExtracted(result.data);
        setSuccess(true);
      } else {
        throw new Error('Keine Daten extrahiert');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);
      console.error('OCR Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getTitle = () => {
    return type === 'bewilligung' ? 'Bewilligung' : 'Rechnung';
  };

  const getIcon = () => {
    return type === 'bewilligung' ? '📋' : '📄';
  };

  return (
    <div className="animate-scale-in">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
            : success
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
          }
          ${isProcessing ? 'cursor-wait' : 'btn-haptic'}
          min-h-[180px] sm:min-h-[200px] flex flex-col items-center justify-center
        `}
      >
        {!file ? (
          <div className="space-y-3">
            <div className="text-5xl sm:text-6xl mb-2 transform transition-transform duration-300 hover:scale-110">
              {getIcon()}
            </div>
            <div className="text-base sm:text-lg font-semibold text-gray-800 tracking-tight">
              {getTitle()}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 font-medium">
              PDF hierher ziehen oder klicken
            </div>
            <div className="hidden sm:block text-xs text-gray-400 mt-2">
              Maximal 20 MB
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className={`
              relative rounded-xl px-4 sm:px-6 py-4 transition-all duration-300
              ${success ? 'bg-green-100' : 'bg-gray-100'}
            `}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{getIcon()}</span>
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {file.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                {!isProcessing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500 hover:bg-red-600
                             text-white flex items-center justify-center
                             transition-all duration-200 btn-haptic shadow-sm hover:shadow-md"
                    aria-label="Datei entfernen"
                  >
                    <span className="text-base font-bold">×</span>
                  </button>
                )}
              </div>

              {isProcessing && (
                <div className="mt-4 flex items-center justify-center gap-3 animate-fade-in">
                  <div className="relative w-5 h-5">
                    <div className="absolute inset-0 rounded-full border-2 border-gray-300"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    OCR wird verarbeitet...
                  </span>
                </div>
              )}

              {success && !isProcessing && (
                <div className="mt-3 flex items-center justify-center gap-2 animate-fade-in">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-green-700 font-semibold">
                    Erfolgreich extrahiert
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-slide-up">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <strong className="font-semibold">Fehler:</strong>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
