import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import type { ApprovalFile } from '@/lib/approvalsTypes';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await list({ prefix: 'approvals/' });
    const items: ApprovalFile[] = res.blobs
      .filter(b => /\.xls$|\.xlsx$/i.test(b.pathname))
      .map(b => ({
        id: b.pathname,
        name: b.pathname.replace(/^approvals\//, ''),
        url: b.url, // signiert
        size: b.size,
        uploadedAt: b.uploadedAt,
      }));

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error('bewilligungen/list:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'list failed' }, { status: 500 });
  }
}
