import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export const runtime = 'edge';

export async function GET() {
  try {
    const { blobs } = await list({
      prefix: 'bewilligungen/',
    });

    // Filter only Excel files and format for frontend
    const bewilligungen = blobs
      .filter(blob => blob.pathname.endsWith('.xlsx') || blob.pathname.endsWith('.xls'))
      .map(blob => ({
        filename: blob.pathname.replace('bewilligungen/', ''),
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        uploadedAt: blob.uploadedAt,
        size: blob.size
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename));

    return NextResponse.json({
      success: true,
      count: bewilligungen.length,
      bewilligungen
    });

  } catch (error: any) {
    console.error('Fehler beim Auflisten der Bewilligungen:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Laden der Bewilligungen',
        details: error.message
      },
      { status: 500 }
    );
  }
}
