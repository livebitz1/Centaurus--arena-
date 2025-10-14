import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clerkId } = body as { clerkId?: string };
    if (!clerkId) return NextResponse.json({ error: 'missing clerkId' }, { status: 400 });

    // clerkClient may be a function in some SDK versions — handle both cases
    // @ts-ignore
    const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;

    // Fetch user from Clerk
    const user = await client.users.getUser(clerkId);
    if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 });

    // Extract primary email
    const email =
      // @ts-ignore
      user.primaryEmailAddress?.emailAddress ||
      // @ts-ignore
      user.emailAddresses?.[0]?.emailAddress ||
      '';

    // Extract profile image url (try multiple possible fields)
    // @ts-ignore
    const image = user.profileImageUrl || user.image_url || user.imageUrl || null;

    const name =
      // @ts-ignore
      user.firstName || // prefer firstName
      // @ts-ignore
      user.fullName ||
      null;

    // Upsert into Prisma
    const upserted = await prisma.user.upsert({
      where: { clerkId },
      update: { email, name, image },
      create: { clerkId, email, name, image },
    });

    return NextResponse.json({ ok: true, user: upserted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
