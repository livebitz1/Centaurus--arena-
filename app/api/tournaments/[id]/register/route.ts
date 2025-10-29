import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const tournamentId = params.id
    const body = await req.json()

    if (!tournamentId) return NextResponse.json({ error: 'Missing tournament id' }, { status: 400 })
    const { teamName, university, phone, leader, members } = body as Record<string, unknown>
    if (!teamName || !university || !leader) {
      return NextResponse.json({ error: 'Missing required registration fields' }, { status: 400 })
    }

    // Normalize leader identifiers for duplicate check
    const leaderEmail = (leader as any)?.email ? String((leader as any).email).trim().toLowerCase() : ''
    const leaderRegNo = (leader as any)?.registrationNo ? String((leader as any).registrationNo).trim().toLowerCase() : ''

    // If we have either identifier, check if a registration for this tournament already exists
    if (leaderEmail || leaderRegNo) {
      try {
        // Use raw SQL to robustly query JSON fields across environments
        const sql = `SELECT id FROM "Registration" WHERE "tournamentId" = $1 AND (LOWER(COALESCE((leader->>'email')::text, '')) = $2 OR LOWER(COALESCE((leader->>'registrationNo')::text, '')) = $3) LIMIT 1`;
        const paramsArr = [tournamentId, leaderEmail, leaderRegNo];
        const existing = await (prisma as unknown as any).$queryRawUnsafe(sql, ...paramsArr)
        const existingRow = Array.isArray(existing) ? existing[0] : existing
        if (existingRow && Object.keys(existingRow).length) {
          return NextResponse.json({ error: 'You have already registered for this tournament' }, { status: 400 })
        }
      } catch (e: unknown) {
        // If the check fails for some reason, proceed but log the error (fail open) — server-side uniqueness will still be enforced if added later
        console.error('Duplicate check failed, proceeding with creation', e)
      }
    }

    let created: unknown = null

    // Prefer generated delegate if available
    if ((prisma as unknown as Record<string, unknown>)?.registration && 'create' in (prisma as unknown as any).registration) {
      created = await (prisma as unknown as any).registration.create({
        data: {
          tournamentId,
          teamName,
          university,
          phone: phone || null,
          leader: leader as Record<string, unknown>,
          members: members as Array<Record<string, unknown>>,
        },
      })
    } else {
      // Fallback to raw SQL for environments where delegate isn't available
      const id = randomUUID()
      const sql = `INSERT INTO "Registration" ("id","tournamentId","teamName","university","phone","leader","members","createdAt") VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,NOW()) RETURNING *`;
      const paramsArr = [id, tournamentId, teamName, university, phone || null, JSON.stringify(leader), JSON.stringify(members)];

      const result = await (prisma as unknown as any).$queryRawUnsafe(sql, ...paramsArr)
      created = Array.isArray(result) ? result[0] : result

      if (created) {
        try {
          if (typeof (created as any).leader === 'string') {
            (created as any).leader = JSON.parse((created as any).leader || 'null')
          }
        } catch (e) {}
        try {
          if (typeof (created as any).members === 'string') {
            (created as any).members = JSON.parse((created as any).members || 'null')
          }
        } catch (e) {}
      }
    }

    let count = 0
    if ((prisma as unknown as Record<string, unknown>)?.registration && 'count' in (prisma as unknown as any).registration) {
      count = await (prisma as unknown as any).registration.count({ where: { tournamentId } })
    } else {
      const cntRes = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM "Registration" WHERE "tournamentId" = ${tournamentId}`
      if (Array.isArray(cntRes)) count = (cntRes[0] as any)?.cnt ?? 0
      else count = (cntRes as any)?.cnt ?? 0
    }

    return NextResponse.json({ created, count })
  } catch (err: unknown) {
    console.error('Registration create failed', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
