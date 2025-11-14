import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function hasRequiredDelegates(client: PrismaClient | undefined) {
  try {
    // check common delegates created from schema
    return !!client && typeof (client as any).tournament !== 'undefined' && typeof (client as any).registration !== 'undefined' && typeof (client as any).game !== 'undefined';
  } catch (e) {
    return false;
  }
}

let client: PrismaClient;

if (hasRequiredDelegates(global.prisma)) {
  client = global.prisma as PrismaClient;
  if (process.env.NODE_ENV !== 'production') console.log('Using existing global Prisma client with required delegates');
} else {
  if (global.prisma && !hasRequiredDelegates(global.prisma)) {
    console.warn('Global prisma exists but missing delegates; creating fresh PrismaClient to pick up generated client');
  }
  client = new PrismaClient();
  if (process.env.NODE_ENV !== 'production') global.prisma = client;
  if (process.env.NODE_ENV !== 'production') console.log('Created new Prisma client');
}

export default client;
