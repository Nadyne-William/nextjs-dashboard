import type { DefaultSession } from 'next-auth';
import type { Role } from '@/app/lib/definitions';

declare module 'next-auth' {
  interface User {
    role?: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: Role;
  }
}
