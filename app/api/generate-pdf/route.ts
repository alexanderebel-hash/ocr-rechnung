import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/InvoicePDF';
import React from 'react';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generate PDF buffer - InvoicePDF returns a Document
    const pdfDocument = React.createElement(InvoicePDF, { data });
    const pdfBuffer = await renderToBuffer(pdfDocument as any);

    // Convert Buffer to Uint8Array for NextResponse
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Return PDF as downloadable file
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung_${data.rechnungsnummer || 'Korrektur'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'PDF-Generierung fehlgeschlagen', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
