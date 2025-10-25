import { NextRequest, NextResponse } from 'next/server';
import { head } from '@vercel/blob';
import { parseExcelBewilligung } from '@/lib/excelParser';
import { buildBewilligungBlobPath } from '@/lib/blobUtils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('file');

  if (!fileName) {
    return NextResponse.json(
      { error: 'Parameter "file" ist erforderlich.' },
      { status: 400 }
    );
  }

  try {
    const blobPath = buildBewilligungBlobPath(fileName);
    const metadata = await head(blobPath);

    const excelResponse = await fetch(metadata.downloadUrl);
    if (!excelResponse.ok) {
      return NextResponse.json(
        { error: `Download der Bewilligung fehlgeschlagen (${excelResponse.status})` },
        { status: 502 }
      );
    }

    const arrayBuffer = await excelResponse.arrayBuffer();
    const parsed = await parseExcelBewilligung(arrayBuffer);

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden der Bewilligung aus Blob:', error);

    const status =
      error instanceof Error && /not\s+found|404/i.test(error.message)
        ? 404
        : 500;

    return NextResponse.json(
      {
        error: 'Bewilligung konnte nicht geladen werden.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status }
    );
  }
}
