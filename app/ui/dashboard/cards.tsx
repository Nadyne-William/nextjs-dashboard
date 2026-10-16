import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { fetchCardData } from '@/app/lib/data';
import { CountUp } from '@/app/ui/dashboard/count-up';

const iconMap = {
  collected: BanknotesIcon,
  customers: UserGroupIcon,
  pending: ClockIcon,
  invoices: InboxIcon,
};

export default async function CardWrapper() {
  const { numberOfInvoices, numberOfCustomers, totalPaidCents, totalPendingCents } =
    await fetchCardData();

  return (
    <>
      <Card title="Collected" value={totalPaidCents} format="currency" type="collected" />
      <Card title="Pending" value={totalPendingCents} format="currency" type="pending" />
      <Card title="Total Invoices" value={numberOfInvoices} format="number" type="invoices" />
      <Card title="Total Customers" value={numberOfCustomers} format="number" type="customers" />
    </>
  );
}

export function Card({
  title,
  value,
  format,
  type,
}: {
  title: string;
  value: number;
  format: 'currency' | 'number';
  type: 'invoices' | 'customers' | 'pending' | 'collected';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        <CountUp value={value} format={format} />
      </p>
    </div>
  );
}
