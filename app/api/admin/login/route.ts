import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const password = body?.password
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    if (typeof password !== 'string') {
      return NextResponse.json({ error: 'Missing password' }, { status: 400 })
    }

    if (password === adminPassword) {
      const secure = process.env.NODE_ENV === 'production'
      const maxAge = 60 * 60 * 24 * 7 // 7 days
      const cookie = `admin_auth=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
      const res = NextResponse.json({ authenticated: true })
      res.headers.set('Set-Cookie', cookie)
      return res
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch (e) {
    console.error('Login error', e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
