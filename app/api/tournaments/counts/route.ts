import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // fetch counts grouped by tournamentId
    if ((prisma as unknown as Record<string, unknown>)?.registration && typeof (prisma as unknown as Record<string, unknown>).registration === 'object' && 'groupBy' in (prisma as unknown as Record<string, any>).registration) {
      const groups = await (prisma as unknown as any).registration.groupBy({
        by: ['tournamentId'],
        _count: { _all: true },
      })
      const map: Record<string, number> = {}
      ;(groups as Array<Record<string, unknown>>).forEach((g) => {
        const key = String((g as any).tournamentId ?? '')
        const countVal = (g as any)._count?._all ?? (g as any)._count
        map[key] = Number(countVal ?? 0)
      })
      return NextResponse.json(map)
    }

    // fallback to raw SQL
    const rows = await prisma.$queryRaw`SELECT "tournamentId", COUNT(*)::int AS cnt FROM "Registration" GROUP BY "tournamentId"`
    const map: Record<string, number> = {}
    for (const r of (rows as Array<Record<string, unknown>>)) {
      const id = String(r['tournamentId'] ?? '')
      map[id] = Number(r['cnt'] ?? r['count'] ?? 0)
    }
    return NextResponse.json(map)
  } catch (err: unknown) {
    console.error('Failed to fetch counts', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
