import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json()
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    const allowed: Partial<{ title: string; img: string }> = {}
    if (typeof body.title === 'string') allowed.title = body.title
    if (typeof body.img === 'string') allowed.img = body.img
    if (!allowed.title && !allowed.img) return NextResponse.json({ error: 'no updatable fields' }, { status: 400 })

    const updated = await prisma.game.update({ where: { id }, data: allowed })
    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'update failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    await prisma.game.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}
