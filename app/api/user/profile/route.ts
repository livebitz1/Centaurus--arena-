import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const email = (url.searchParams.get('email') || '').toString().trim().toLowerCase()
    if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 })

    // fetch user record by email
    const user = await prisma.user.findUnique({ where: { email } })

    // fetch registrations where leader email or any member email matches
    const rows = await prisma.$queryRaw`
      SELECT r.*, t.title as tournament_title, t.date as tournament_date, t.location as tournament_location, t.slots as tournament_slots, t.game as tournament_game, t.img as tournament_img
      FROM "Registration" r
      JOIN "Tournament" t ON t.id = r."tournamentId"
      WHERE LOWER(COALESCE(r.leader->>'email', '')) = ${email}
         OR EXISTS (
           SELECT 1 FROM jsonb_array_elements(r.members) m WHERE LOWER(COALESCE(m->>'email','')) = ${email}
         )
      ORDER BY r."createdAt" DESC
    `

    // normalize leader/members fields
    const regs = (Array.isArray(rows) ? rows : []).map((r) => ({
      ...r,
      leader: typeof r.leader === 'string' ? JSON.parse(r.leader || 'null') : r.leader,
      members: typeof r.members === 'string' ? JSON.parse(r.members || 'null') : r.members,
    }))

    return NextResponse.json({ user, registrations: regs })
  } catch (err: unknown) {
    console.error('Failed to fetch user profile', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
