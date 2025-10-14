Prisma setup notes

1. Install packages:

   npm install prisma@5 @prisma/client

2. Initialize Prisma (created `prisma/schema.prisma` already in the repo):

   npx prisma migrate dev --name init

   OR for Neon you can push the schema without a migration history:

   npx prisma db push

3. Configure `DATABASE_URL` in `.env` or `.env.local` with your Neon connection string. Example placeholder (DO NOT COMMIT real keys):

   DATABASE_URL="postgresql://USER:PASSWORD@ep-example-cluster.neon.tech:5432/neondb"

4. Generate Prisma Client (normally `prisma migrate` or `prisma db push` runs this automatically).

5. Use the client in server code:

   import prisma from '@/lib/prisma'

   const users = await prisma.user.findMany()

Notes about Neon:
- For Neon, use the provided connection URL and TLS settings from the Neon dashboard.
- When using serverless, prefer `npx prisma db push` and the connection string format recommended by Neon.
