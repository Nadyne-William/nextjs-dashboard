import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // (Next 16 renames this file to proxy.ts; this project is pinned to Next 15 for next-auth v5 beta.)
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
