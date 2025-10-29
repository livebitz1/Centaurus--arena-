import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const client = new PrismaClient()
  try {
    const tournamentId = params.id
    if (!tournamentId) return NextResponse.json({ error: 'Missing tournament id' }, { status: 400 })

    // Use raw query as a robust fallback in case the generated delegate is not present at runtime
    const rows = await client.$queryRaw`
      SELECT * FROM "Registration" WHERE "tournamentId" = ${tournamentId} ORDER BY "createdAt" ASC
    `

    // Normalize fields: leader and members may be returned as JSON strings depending on the driver
    const regs = (rows as Array<Record<string, unknown>>).map((r) => ({
      ...r,
      leader: typeof (r as any).leader === 'string' ? JSON.parse((r as any).leader || 'null') : (r as any).leader,
      members: typeof (r as any).members === 'string' ? JSON.parse((r as any).members || 'null') : (r as any).members,
    }))

    return NextResponse.json(regs)
  } catch (err: unknown) {
    console.error('Failed to fetch registrations', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    try {
      await client.$disconnect()
    } catch (e) {}
  }
}
