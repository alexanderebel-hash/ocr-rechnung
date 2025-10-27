'use client';
import { useState, useRef } from 'react';
import { runOcr } from '@/utils/ocrClient';

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
  zwischensumme: number;
  zinv?: number;
  gesamtbetrag: number;
  rechnungsnummer?: string;
}

interface PDFUploadProps {
  type: 'bewilligung' | 'rechnung';
  onDataExtracted: (data: BewilligungData | RechnungData) => void;
}

type OCRPayload = BewilligungData | RechnungData | Record<string, unknown> | null | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const extractLKCode = (text: string): string | null => {
  // Suche nach LK-Codes wie: LK02, LK03a, LK03b, LK11b, LK20.2, LK20_HH
  const match = text.match(/LK\d+[a-z]?(?:[._]\w+)?/i);
  if (match) {
    return match[0].toUpperCase().replace('.', '_');
  }
  return null;
};

const sanitizeRechnungsPosition = (
  raw: unknown,
  index: number,
): RechnungsPosition | null => {
  if (!isRecord(raw)) {
    console.warn(`Position ${index} ist kein Object:`, raw);
    return null;
  }

  // Versuche LK-Code zu finden
  let lkCode: string | null = null;
  
  // 1. Prüfe ob direktes lkCode Feld existiert
  const lkCodeRaw = raw.lkCode ?? raw.code ?? raw.lk_code ?? raw.abk;
  if (typeof lkCodeRaw === 'string' && lkCodeRaw.trim().length > 0) {
    lkCode = lkCodeRaw.trim().toUpperCase();
  }
  
  // 2. Falls nicht, extrahiere aus Beschreibung
  if (!lkCode) {
    const beschreibungRaw = raw.beschreibung ?? raw.leistung ?? raw.bezeichnung ?? raw.description;
    if (typeof beschreibungRaw === 'string') {
      lkCode = extractLKCode(beschreibungRaw);
    }
  }
  
  // 3. Fallback: UNBEKANNT
  if (!lkCode) {
    lkCode = `UNBEKANNT-${index + 1}`;
    console.warn(`Keine LK-Code gefunden für Position ${index}:`, raw);
  }

  const bezeichnung = typeof raw.bezeichnung === 'string' 
    ? raw.bezeichnung 
    : typeof raw.leistung === 'string'
    ? raw.leistung
    : typeof raw.description === 'string'
    ? raw.description
    : '';

  const menge = toNumber(raw.menge ?? raw.anzahl ?? raw.quantity);
  const preis = toNumber(raw.preis ?? raw.einzelpreis ?? raw.price);
  const gesamt = toNumber(raw.gesamt ?? raw.gesamtpreis ?? raw.total, menge * preis);

  const bewilligtValue = raw.bewilligt;
  const bewilligt =
    typeof bewilligtValue === 'boolean'
      ? bewilligtValue
      : Boolean(bewilligtValue);

  const istAUB = 
    raw.istAUB === true || 
    lkCode.includes('AUB') ||
    bezeichnung.toLowerCase().includes('ausbildungsumlage');

  console.log(`Position ${index}: ${lkCode} | Menge: ${menge} | Preis: ${preis} | Gesamt: ${gesamt}`);

  return {
    lkCode,
    bezeichnung,
    menge,
    preis,
    gesamt,
    bewilligt,
    ...(istAUB ? { istAUB } : {}),
  };
};

const sanitizeRechnungData = (payload: OCRPayload): RechnungData => {
  console.log('\n═══ SANITIZE DEBUG START ═══');
  console.log('📦 Raw Payload Type:', typeof payload);
  
  const base: Record<string, unknown> = isRecord(payload) ? payload : {};
  
  console.log('🔑 Keys in base:', Object.keys(base));
  console.log('📋 base.rechnungsPositionen:', base.rechnungsPositionen);
  console.log('📋 Is Array?', Array.isArray(base.rechnungsPositionen));

  // ✅ VERSUCHE VERSCHIEDENE SCHLÜSSEL FÜR POSITIONEN
  const rawPositionen = 
    Array.isArray(base.rechnungsPositionen) ? base.rechnungsPositionen :
    Array.isArray(base.positionen) ? base.positionen :
    Array.isArray(base.rechnungs_positionen) ? base.rechnungs_positionen :
    Array.isArray(base.items) ? base.items :
    Array.isArray(base.leistungen) ? base.leistungen :
    [];

  console.log('📊 Raw Positionen gefunden:', rawPositionen.length);
  if (rawPositionen.length > 0) {
    console.log('📌 Erste Position:', JSON.stringify(rawPositionen[0], null, 2));
    console.log('📌 Zweite Position:', JSON.stringify(rawPositionen[1], null, 2));
  }

  const rechnungsPositionen = rawPositionen
    .map((pos, index) => sanitizeRechnungsPosition(pos, index))
    .filter((pos): pos is RechnungsPosition => pos !== null);

  console.log('✅ Sanitized Positionen:', rechnungsPositionen.length);
  console.log('📋 LK-Codes gefunden:', rechnungsPositionen.map(p => p.lkCode).join(', '));
  console.log('═══ SANITIZE DEBUG END ═══\n');

  const zwischensumme = toNumber(base.zwischensumme ?? base.summe_netto);
  const gesamtbetrag = toNumber(base.gesamtbetrag ?? base.summe_brutto);
  const zinv =
    base.zinv === null || base.zinv === undefined
      ? undefined
      : toNumber(base.zinv, 0);

  return {
    ...base,
    rechnungsPositionen,
    zwischensumme,
    gesamtbetrag,
    ...(zinv === undefined ? {} : { zinv }),
  } as RechnungData;
};

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
      const result = await runOcr(fileToProcess, type);
      
      // ✅ UMFANGREICHES DEBUG-LOGGING
      console.log('\n🔍 ═══ OCR RESULT DEBUG ═══');
      console.log('📄 File:', fileToProcess.name);
      console.log('🎯 Type:', type);
      console.log('📦 Result exists?', !!result);
      console.log('📦 Result.data exists?', !!result?.data);
      
      if (result?.data) {
        console.log('📊 RAW OCR DATA:');
        console.log(JSON.stringify(result.data, null, 2));
      }
      console.log('═══ OCR RESULT DEBUG END ═══\n');

      if (result?.data) {
        if (type === 'rechnung') {
          const sanitizedInvoice = sanitizeRechnungData(result.data);
          
          console.log('\n✅ FINAL SANITIZED DATA:');
          console.log('Positionen:', sanitizedInvoice.rechnungsPositionen.length);
          console.log('Zwischensumme:', sanitizedInvoice.zwischensumme);
          console.log('Gesamtbetrag:', sanitizedInvoice.gesamtbetrag);
          
          onDataExtracted(sanitizedInvoice);

          const originalPositions = (result.data as any)?.rechnungsPositionen;
          if (
            !Array.isArray(originalPositions) ||
            (originalPositions?.length ?? 0) !==
              sanitizedInvoice.rechnungsPositionen.length
          ) {
            console.warn(
              '[PDFUpload] Rechnungspositionen wurden aus Sicherheitsgründen normalisiert.',
            );
          }
        } else {
          onDataExtracted(result.data as BewilligungData);
        }
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
          drag-area frosted-glass rounded-3xl p-8 sm:p-12 text-center cursor-pointer
          transition-all duration-500
          ${isDragging ? 'dragging' : ''}
          ${success ? 'success-pulse border-green-400' : ''}
          ${isProcessing ? 'cursor-wait' : ''}
          min-h-[200px] sm:min-h-[240px] flex flex-col items-center justify-center
        `}
      >
        {!file ? (
          <div className="space-y-3">
            <div className="text-5xl sm:text-6xl mb-2 transform transition-transform duration-300 hover:scale-110">
              {getIcon()}
            </div>
            <div className="text-base sm:text-lg font-semibold text-white tracking-tight">
              {getTitle()}
            </div>
            <div className="text-xs sm:text-sm text-gray-300 font-medium">
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
              ${success ? 'bg-green-900/20 border border-green-500/30' : 'bg-white/5 border border-white/10'}
            `}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{getIcon()}</span>
                    <span className="text-sm font-semibold text-white truncate">
                      {file.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
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
                  <div className="relative w-5 h-5 spinner-glow">
                    <div className="absolute inset-0 rounded-full border-2 border-gray-600"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
                  </div>
                  <span className="text-sm text-gray-300 font-medium">
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
        <div className="mt-3 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm animate-slide-up backdrop-blur-xl">
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