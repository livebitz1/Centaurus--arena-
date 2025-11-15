import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pwd = body?.password;

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Server misconfiguration: ADMIN_PASSWORD not set' }, { status: 500 });
    }

    if (!pwd || typeof pwd !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    if (pwd === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
