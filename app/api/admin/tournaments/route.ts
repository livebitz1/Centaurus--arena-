import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasTournament = typeof (prisma as unknown as Record<string, unknown>)?.tournament !== 'undefined'
    if (!prisma || !hasTournament) {
      console.error('Prisma client or tournament delegate missing on GET, prisma:', !!prisma, 'hasTournament:', hasTournament);
      return NextResponse.json({ error: 'Prisma client not available or tournament model missing' }, { status: 500 });
    }

    const items = await (prisma as unknown as any).tournament.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (err: unknown) {
    console.error('Error in GET /api/admin/tournaments', err);
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const hasTournament = typeof (prisma as unknown as Record<string, unknown>)?.tournament !== 'undefined'
    if (!prisma || !hasTournament) {
      console.error('Prisma client or tournament delegate is not available on server prisma:', !!prisma, 'hasTournament:', hasTournament);
      return NextResponse.json({ error: 'Prisma client not available' }, { status: 500 });
    }

    const body = await req.json();
    const created = await (prisma as unknown as any).tournament.create({ data: { ...body } });
    return NextResponse.json(created);
  } catch (err: unknown) {
    console.error('Failed to create tournament', err);
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
