'use client';

import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { useState, useEffect } from 'react';

interface InvoicePDFViewerProps {
  data: any;
}

export function InvoicePDFViewer({ data }: InvoicePDFViewerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !data) {
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
    <div className="space-y-4">
      {/* Download Button */}
      <div className="flex justify-end">
        <PDFDownloadLink
          document={<InvoicePDF data={data} />}
          fileName={`Korrekturrechnung_${data.klient?.name || 'Rechnung'}_${new Date().toISOString().split('T')[0]}.pdf`}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
        >
          {({ loading }) =>
            loading ? (
              <>
                <div className="w-5 h-5">
                  <div className="absolute inset-0 rounded-full border-2 border-white/30"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                </div>
                <span>Erstelle PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PDF herunterladen</span>
              </>
            )
          }
        </PDFDownloadLink>
      </div>

      {/* PDF Viewer */}
      <div className="w-full h-[800px] border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <PDFViewer width="100%" height="100%" showToolbar={true}>
          <InvoicePDF data={data} />
        </PDFViewer>
      </div>
    </div>
  );
}
