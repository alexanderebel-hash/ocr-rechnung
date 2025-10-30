import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import type { ApprovalFile } from '@/lib/approvalsTypes';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await list({ prefix: 'approvals/' });

    const items = res.blobs
      .filter((b) => /\.xls$|\.xlsx$/i.test(b.pathname))
      .map<ApprovalFile>((b) => {
        // 🔧 Date → string (ISO) erzwingen, egal was das SDK liefert
        const uploadedAt =
          typeof (b as any).uploadedAt === 'string'
            ? (b as any).uploadedAt
            : new Date((b as any).uploadedAt).toISOString();

        return {
          id: b.pathname,
          name: b.pathname.replace(/^approvals\//, ''),
          url: b.url,
          size: b.size,
          uploadedAt,
        };
      });

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error('bewilligung/route:', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'list failed' },
      { status: 500 }
    );
  }
}
