'use client';

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import type { Role } from '@/app/lib/definitions';
import { can, type Permission } from '@/app/lib/permissions';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Shown only to roles with this permission. */
  permission: Permission;
  /** Highlight for nested pages too (e.g. an invoice's edit page under Invoices). */
  matchNested?: boolean;
};

// One list for every role. Each item says what it needs, and the sidebar
// filters it, instead of keeping a separate menu per role in sync by hand.
const NAV_ITEMS: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon, permission: 'invoices:read' },
  {
    name: 'Invoices',
    href: '/dashboard/invoices',
    icon: DocumentDuplicateIcon,
    permission: 'invoices:read',
    matchNested: true,
  },
  { name: 'New invoice', href: '/dashboard/invoices/create', icon: DocumentPlusIcon, permission: 'invoices:write' },
  { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon, permission: 'customers:read' },
];

export default function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => can(role, item.permission));

  // The most specific match wins, so "New invoice" lights up rather than "Invoices".
  const activeHref = items
    .filter((item) => pathname === item.href || (item.matchNested && pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
              { 'bg-sky-100 text-blue-600': isActive },
            )}
          >
            <Icon className="w-6" />
            <p className="hidden md:block">{item.name}</p>
          </Link>
        );
      })}
    </>
  );
}
