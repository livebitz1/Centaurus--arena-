import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: any }) {
  // `params` may be a promise in some Next.js runtimes — await it before using
  const p = await params;
  const id = p?.id;
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const body = await req.json();

  // Only allow a whitelist of updatable scalar fields to avoid sending relations/unknown props
  const allowed = ['title', 'date', 'location', 'slots', 'game', 'img', 'roomId', 'roomPassword', 'showRoom'];
  const data: Record<string, any> = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) data[key] = body[key];
  }

  try {
    const updated = await prisma.tournament.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error('Failed to update tournament', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: any }) {
  const p = await params;
  const id = p?.id;
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  try {
    await prisma.tournament.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('Failed to delete tournament', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
