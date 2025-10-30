import { NextResponse } from 'next/server';
import { listApprovals } from '@/lib/blobUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await listApprovals();
    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error('bewilligung/route:', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'list failed' },
      { status: 500 }
    );
  }
}
