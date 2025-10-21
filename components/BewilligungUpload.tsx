'use client';
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

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

interface BewilligungData {
  klientData?: Partial<KlientData>;
  bewilligung: BewilligungRow[];
  investitionskosten?: string | null;
}

interface BewilligungUploadProps {
  onDataExtracted: (data: BewilligungData) => void;
}

type UploadMode = 'none' | 'pdf' | 'excel';

export default function BewilligungUpload({ onDataExtracted }: BewilligungUploadProps) {
  const [mode, setMode] = useState<UploadMode>('none');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [success, setSuccess] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File, selectedMode: UploadMode) => {
    // Validate file type
    if (selectedMode === 'pdf' && !selectedFile.type.includes('pdf')) {
      setError('Bitte nur PDF-Dateien hochladen');
      return;
    }

    if (selectedMode === 'excel' &&
        !selectedFile.name.endsWith('.xlsx') &&
        !selectedFile.name.endsWith('.xls')) {
      setError('Bitte nur Excel-Dateien (.xlsx oder .xls) hochladen');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess(false);
    setMode(selectedMode);

    // Process based on mode
    if (selectedMode === 'pdf') {
      await processPDF(selectedFile);
    } else if (selectedMode === 'excel') {
      await processExcel(selectedFile);
    }
  };

  const processPDF = async (fileToProcess: File) => {
    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', fileToProcess);
      formData.append('type', 'bewilligung');

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

  const processExcel = async (fileToProcess: File) => {
    setIsProcessing(true);
    setError('');

    try {
      const arrayBuffer = await fileToProcess.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        cellStyles: true,
        cellDates: true
      });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rawData = XLSX.utils.sheet_to_json(sheet) as any[];

      const bewilligungData: BewilligungRow[] = rawData.map(row => ({
        lkCode: row['LK-Code'] || '',
        bezeichnung: row['Leistungsbezeichnung'] || '',
        jeWoche: row['Je Woche'] || 0,
        jeMonat: row['Je Monat'] || 0
      })).filter(row => row.lkCode && (row.jeWoche > 0 || row.jeMonat > 0));

      if (bewilligungData.length === 0) {
        throw new Error('Keine Leistungen mit Mengen > 0 gefunden.');
      }

      onDataExtracted({ bewilligung: bewilligungData });
      setSuccess(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Excel-Import';
      setError(errorMessage);
      console.error('Excel Error:', err);
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

  const handleDrop = (e: React.DragEvent, dropMode: UploadMode) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile, dropMode);
    }
  };

  const handlePdfClick = () => {
    if (!isProcessing) {
      pdfInputRef.current?.click();
    }
  };

  const handleExcelClick = () => {
    if (!isProcessing) {
      excelInputRef.current?.click();
    }
  };

  const handlePdfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile, 'pdf');
    }
  };

  const handleExcelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile, 'excel');
    }
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    setSuccess(false);
    setMode('none');
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
    if (excelInputRef.current) {
      excelInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-scale-in">
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf"
        onChange={handlePdfInputChange}
        className="hidden"
      />
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleExcelInputChange}
        className="hidden"
      />

      {mode === 'none' ? (
        // Mode Selection
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">
              Bewilligung hochladen
            </h3>
            <p className="text-sm text-gray-300">
              Wählen Sie Ihr bevorzugtes Format
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PDF Option */}
            <div
              onClick={handlePdfClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'pdf')}
              className={`
                drag-area frosted-glass rounded-2xl p-6 text-center cursor-pointer
                transition-all duration-500 min-h-[180px] flex flex-col items-center justify-center
                ${isDragging ? 'dragging' : ''}
              `}
            >
              <div className="space-y-3">
                <div className="text-5xl mb-2 transform transition-transform duration-300 hover:scale-110">
                  📋
                </div>
                <div className="text-base font-semibold text-white">
                  PDF
                </div>
                <div className="text-xs text-gray-300">
                  OCR-Extraktion via Claude
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Klicken oder PDF hierher ziehen
                </div>
              </div>
            </div>

            {/* Excel Option */}
            <div
              onClick={handleExcelClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'excel')}
              className={`
                drag-area frosted-glass rounded-2xl p-6 text-center cursor-pointer
                transition-all duration-500 min-h-[180px] flex flex-col items-center justify-center
                ${isDragging ? 'dragging' : ''}
              `}
            >
              <div className="space-y-3">
                <div className="text-5xl mb-2 transform transition-transform duration-300 hover:scale-110">
                  📊
                </div>
                <div className="text-base font-semibold text-white">
                  Excel
                </div>
                <div className="text-xs text-gray-300">
                  Direkte Datenextraktion
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Klicken oder Excel hierher ziehen
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // File Display after Selection
        <div className="frosted-glass rounded-2xl p-8 text-center">
          <div className="w-full space-y-4">
            <div className={`
              relative rounded-xl px-6 py-4 transition-all duration-300
              ${success ? 'bg-green-900/20 border border-green-500/30' : 'bg-white/5 border border-white/10'}
            `}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{mode === 'pdf' ? '📋' : '📊'}</span>
                    <span className="text-sm font-semibold text-white truncate">
                      {file?.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {file && (file.size / 1024 / 1024).toFixed(2)} MB • {mode === 'pdf' ? 'PDF' : 'Excel'}
                  </div>
                </div>

                {!isProcessing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500 hover:bg-red-600
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
                    {mode === 'pdf' ? 'OCR wird verarbeitet...' : 'Excel wird verarbeitet...'}
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
                  <span className="text-sm text-green-400 font-semibold">
                    Erfolgreich extrahiert
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
