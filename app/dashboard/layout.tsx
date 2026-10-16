import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import SideNav from '@/app/ui/dashboard/sidenav';
import { SessionGuard } from '@/app/ui/session/session-guard';
import { FlashToast } from '@/app/ui/flash-toast';

// Minutes of inactivity before sign-out. Set IDLE_TIMEOUT_MINUTES=0.5 to try it quickly.
const idleTimeoutMinutes = Number(process.env.IDLE_TIMEOUT_MINUTES) || 15;

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // The proxy already blocks signed-out visitors; this covers a session that
  // expires between the proxy check and render.
  if (!session?.user) redirect('/login?reason=expired');

  return (
    <SessionGuard idleTimeoutMinutes={idleTimeoutMinutes}>
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="w-full flex-none md:w-64">
          <SideNav user={session.user} />
        </div>
        <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
      </div>
      <Suspense>
        <FlashToast />
      </Suspense>
    </SessionGuard>
  );
}
