import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const authenticated = cookie.split(';').some(c => c.trim().startsWith('admin_auth='))
    return NextResponse.json({ authenticated: Boolean(authenticated) })
  } catch (e) {
    console.error('Auth check failed', e)
    return NextResponse.json({ authenticated: false })
  }
}
