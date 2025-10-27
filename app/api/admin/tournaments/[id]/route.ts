import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.tournament.update({ where: { id: params.id }, data: { ...body } });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await prisma.tournament.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
