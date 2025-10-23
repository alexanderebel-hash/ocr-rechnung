import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nur Excel-Dateien (.xlsx, .xls) erlaubt' },
        { status: 400 }
      );
    }

    const cleanFileName = file.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const blob = await put(`bewilligungen/${cleanFileName}`, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName: cleanFileName,
      size: file.size,
    });

  } catch (error) {
    console.error('Upload Fehler:', error);
    return NextResponse.json(
      { error: 'Upload fehlgeschlagen' },
      { status: 500 }
    );
  }
}
