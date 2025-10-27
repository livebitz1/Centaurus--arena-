import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma || !(prisma as any).tournament) {
      console.error('Prisma client or tournament delegate missing on GET, prisma:', !!prisma, 'hasTournament:', !!(prisma as any)?.tournament);
      return NextResponse.json({ error: 'Prisma client not available or tournament model missing' }, { status: 500 });
    }

    const items = await (prisma as any).tournament.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (err: any) {
    console.error('Error in GET /api/admin/tournaments', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!prisma || !(prisma as any).tournament) {
      console.error('Prisma client or tournament delegate is not available on server prisma:', !!prisma, 'hasTournament:', !!(prisma as any)?.tournament);
      return NextResponse.json({ error: 'Prisma client not available' }, { status: 500 });
    }

    const body = await req.json();
    const created = await (prisma as any).tournament.create({ data: { ...body } });
    return NextResponse.json(created);
  } catch (err: any) {
    console.error('Failed to create tournament', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
