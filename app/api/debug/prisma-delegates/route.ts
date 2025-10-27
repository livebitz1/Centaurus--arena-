import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function GET() {
  const client = new PrismaClient()
  try {
    const hasTournament = typeof (client as any).tournament !== 'undefined'
    const hasRegistration = typeof (client as any).registration !== 'undefined'
    const keys = Object.keys(client as any).slice(0, 200)
    const runtimeModel = (client as any)._runtimeDataModel?.models?.map((m: any) => m.name) || null
    return NextResponse.json({ ok: true, hasTournament, hasRegistration, keys, runtimeModel })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  } finally {
    try { await client.$disconnect() } catch (_) {}
  }
}
