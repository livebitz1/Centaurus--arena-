import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const items = await prisma.game.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(items)
  } catch (err) {
    console.error(err)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body?.title || !body?.img) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    const created = await prisma.game.create({ data: { title: body.title, img: body.img } })
    return NextResponse.json(created)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'create failed' }, { status: 500 })
  }
}
