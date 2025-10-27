import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const tournamentId = params.id
    const body = await req.json()

    if (!tournamentId) return NextResponse.json({ error: 'Missing tournament id' }, { status: 400 })
    const { teamName, university, phone, leader, members } = body
    if (!teamName || !university || !leader) {
      return NextResponse.json({ error: 'Missing required registration fields' }, { status: 400 })
    }

    let created: any = null

    // Prefer generated delegate if available
    if ((prisma as any)?.registration?.create) {
      created = await (prisma as any).registration.create({
        data: {
          tournamentId,
          teamName,
          university,
          phone: phone || null,
          leader: leader as any,
          members: members as any,
        },
      })
    } else {
      // Fallback to raw SQL for environments where delegate isn't available
      const id = randomUUID()
      const sql = `INSERT INTO \"Registration\" (\"id\",\"tournamentId\",\"teamName\",\"university\",\"phone\",\"leader\",\"members\",\"createdAt\") VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,NOW()) RETURNING *`;
      const paramsArr = [id, tournamentId, teamName, university, phone || null, JSON.stringify(leader), JSON.stringify(members)];

      const result: any = await (prisma as any).$queryRawUnsafe(sql, ...paramsArr)
      created = Array.isArray(result) ? result[0] : result

      if (created) {
        if (typeof created.leader === 'string') {
          try { created.leader = JSON.parse(created.leader) } catch (e) {}
        }
        if (typeof created.members === 'string') {
          try { created.members = JSON.parse(created.members) } catch (e) {}
        }
      }
    }

    let count = 0
    if ((prisma as any)?.registration?.count) {
      count = await (prisma as any).registration.count({ where: { tournamentId } })
    } else {
      const cntRes: any = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM "Registration" WHERE "tournamentId" = ${tournamentId}`
      if (Array.isArray(cntRes)) count = cntRes[0]?.cnt ?? 0
      else count = cntRes?.cnt ?? 0
    }

    return NextResponse.json({ created, count })
  } catch (err: any) {
    console.error('Registration create failed', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
