import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

function dbNotConfiguredResponse(message = 'Database not configured') {
  return NextResponse.json({ error: message }, { status: 500 })
}

export async function GET() {
  // Quick check for common deployment misconfiguration
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL env var')
    return dbNotConfiguredResponse('Server misconfiguration: DATABASE_URL is not set')
  }

  try {
    const items = await prisma.game.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(items)
  } catch (err) {
    console.error('Error fetching games from DB:', err)
    // return a helpful error for debugging while avoiding sensitive details
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL env var')
    return dbNotConfiguredResponse('Server misconfiguration: DATABASE_URL is not set')
  }

  try {
    const body = await req.json()
    if (!body?.title || !body?.img) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    const created = await prisma.game.create({ data: { title: body.title, img: body.img } })
    return NextResponse.json(created)
  } catch (err) {
    console.error('Error creating game record:', err)
    return NextResponse.json({ error: 'create failed' }, { status: 500 })
  }
}
