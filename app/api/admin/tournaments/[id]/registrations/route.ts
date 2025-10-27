import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const client = new PrismaClient()
  try {
    const tournamentId = params.id
    if (!tournamentId) return NextResponse.json({ error: 'Missing tournament id' }, { status: 400 })

    // Use raw query as a robust fallback in case the generated delegate is not present at runtime
    const rows: any[] = await client.$queryRaw`
      SELECT * FROM "Registration" WHERE "tournamentId" = ${tournamentId} ORDER BY "createdAt" ASC
    `

    // Normalize fields: leader and members may be returned as JSON strings depending on the driver
    const regs = rows.map((r) => ({
      ...r,
      leader: typeof r.leader === 'string' ? JSON.parse(r.leader || 'null') : r.leader,
      members: typeof r.members === 'string' ? JSON.parse(r.members || 'null') : r.members,
    }))

    return NextResponse.json(regs)
  } catch (err: any) {
    console.error('Failed to fetch registrations', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  } finally {
    try {
      await client.$disconnect()
    } catch (e) {}
  }
}
