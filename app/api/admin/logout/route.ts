import { NextResponse } from 'next/server'

export async function POST() {
  const cookie = `admin_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', cookie)
  return res
}
