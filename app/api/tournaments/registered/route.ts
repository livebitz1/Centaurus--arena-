import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const email = (url.searchParams.get('email') || '').toString().trim().toLowerCase()
    if (!email) return NextResponse.json({ tournamentIds: [] })

    // use raw SQL to match leader->>'email' case-insensitively
    const rows = await prisma.$queryRaw`
      SELECT DISTINCT "tournamentId" FROM "Registration" WHERE LOWER(COALESCE((leader->>'email'), '')) = ${email}
    `

    const ids = Array.isArray(rows) ? rows.map((r: Record<string, unknown>) => String(r['tournamentId'] ?? '')) : []
    return NextResponse.json({ tournamentIds: ids })
  } catch (err: unknown) {
    console.error('Failed to fetch registered tournaments for email', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ tournamentIds: [], error: message }, { status: 500 })
  }
}
