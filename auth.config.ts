import type { NextAuthConfig } from 'next-auth';
import { can, isRole, PROTECTED_ROUTES } from '@/app/lib/permissions';

// Shared by auth.ts and the proxy. Keep it free of Node-only imports (bcrypt,
// postgres) because the proxy runs it on every request.
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    // Hard cap on a session. The client-side idle timer signs people out much
    // sooner when they stop using the app.
    maxAge: 8 * 60 * 60,
  },
  providers: [
    // Added in auth.ts, since the credentials check needs bcrypt (Node.js only).
  ],
  callbacks: {
    // Copy the role from the user record onto the token at sign-in...
    jwt({ token, user }) {
      if (isRole(user?.role)) token.role = user.role;
      return token;
    },
    // ...and from the token onto the session, so pages and actions can read it.
    session({ session, token }) {
      if (isRole(token.role)) session.user.role = token.role;
      if (token.sub) session.user.id = token.sub;
      return session;
    },
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      // Server actions (form submits, delete buttons) are POSTs with a Next-Action
      // header. Redirecting one to /login would hand the browser an HTML page
      // where it expects an action result, and it fails with a generic error.
      // Let it through: every mutating action checks the session itself and
      // answers "session expired", which the UI turns into a clear modal.
      if (request.headers.has('next-action')) return true;

      if (!isOnDashboard) {
        if (isLoggedIn && nextUrl.pathname === '/login') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) return false; // Sends the user to /login with a callbackUrl.

      const rule = PROTECTED_ROUTES.find((r) => r.pattern.test(nextUrl.pathname));
      if (rule && !can(auth.user.role, rule.permission)) {
        return Response.redirect(new URL('/dashboard/invoices?denied=1', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
