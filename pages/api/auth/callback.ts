import type { NextApiRequest, NextApiResponse } from 'next';
import { clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { clerkId } = req.body as { clerkId: string };
    if (!clerkId) return res.status(400).json({ error: 'missing clerkId' });

    // Fetch full user from Clerk server SDK
    const user = await clerkClient.users.getUser(clerkId);

    const email = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || '';
    const name = user.firstName || user.fullName || null;
    const image = user.profileImageUrl || null;

    // Upsert into Prisma
    const upserted = await prisma.user.upsert({
      where: { clerkId },
      update: { email, name, image },
      create: { clerkId, email, name, image },
    });

    return res.status(200).json({ ok: true, user: upserted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
}
