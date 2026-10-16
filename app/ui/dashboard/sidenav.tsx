import Link from 'next/link';
import type { Session } from 'next-auth';
import NavLinks from '@/app/ui/dashboard/nav-links';
import AcmeLogo from '@/app/ui/acme-logo';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOutWithReason } from '@/app/lib/actions';
import { ROLE_LABELS } from '@/app/lib/permissions';
import clsx from 'clsx';

export default function SideNav({ user }: { user: Session['user'] }) {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link className="mb-2 flex h-20 items-end justify-start rounded-md bg-blue-600 p-4 md:h-40" href="/">
        <div className="w-32 text-white md:w-40">
          <AcmeLogo />
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks role={user.role} />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>

        <div className="hidden rounded-md bg-gray-50 px-3 py-2 md:block">
          <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
          <span
            className={clsx(
              'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
              user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700',
            )}
          >
            {ROLE_LABELS[user.role]}
          </span>
        </div>

        <form action={signOutWithReason.bind(null, 'manual')}>
          <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
            <PowerIcon className="w-6" />
            <div className="hidden md:block">Sign Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}
