import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const client = new PrismaClient()

export async function GET() {
  try {
    const items = await client.tournament.findMany({ take: 5 })
    return NextResponse.json({ ok: true, count: items.length, sample: items.slice(0, 3) })
  } catch (err: any) {
    console.error('debug/prisma-test error', err)
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  } finally {
    try {
      await client.$disconnect()
    } catch (_) {}
  }
}
