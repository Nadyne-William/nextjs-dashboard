import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';
import { FormattedCustomersTable } from '@/app/lib/definitions';
import { DataTable, type Column } from '@/app/ui/data-table/data-table';
import { FilterBar } from '@/app/ui/data-table/filter-bar';

function CustomerCell({ customer }: { customer: FormattedCustomersTable }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={customer.image_url}
        className="rounded-full"
        alt={`${customer.name}'s profile picture`}
        width={28}
        height={28}
      />
      <p>{customer.name}</p>
    </div>
  );
}

// Same DataTable and FilterBar as the invoices page. This page only describes
// its columns; layout, empty state and the mobile view come for free.
const columns: Column<FormattedCustomersTable>[] = [
  { key: 'name', header: 'Name', cell: (c) => <CustomerCell customer={c} /> },
  { key: 'email', header: 'Email', cell: (c) => c.email },
  { key: 'invoices', header: 'Total Invoices', cell: (c) => c.total_invoices },
  { key: 'pending', header: 'Total Pending', cell: (c) => c.total_pending },
  { key: 'paid', header: 'Total Paid', cell: (c) => c.total_paid },
];

export default function CustomersTable({
  customers,
  query,
}: {
  customers: FormattedCustomersTable[];
  query: string;
}) {
  return (
    <div className="w-full">
      <h1 className={`${lusitana.className} mb-8 text-xl md:text-2xl`}>Customers</h1>
      <FilterBar searchPlaceholder="Search customers…" />
      <DataTable
        caption="Customers"
        columns={columns}
        rows={customers}
        getRowId={(c) => c.id}
        emptyState={query ? `No customers match “${query}”.` : 'No customers yet.'}
        renderMobileCard={(customer) => (
          <>
            <div className="border-b pb-4">
              <div className="mb-2">
                <CustomerCell customer={customer} />
              </div>
              <p className="text-sm text-gray-500">{customer.email}</p>
            </div>
            <div className="flex w-full items-center justify-between border-b py-5">
              <div className="flex w-1/2 flex-col">
                <p className="text-xs">Pending</p>
                <p className="font-medium">{customer.total_pending}</p>
              </div>
              <div className="flex w-1/2 flex-col">
                <p className="text-xs">Paid</p>
                <p className="font-medium">{customer.total_paid}</p>
              </div>
            </div>
            <div className="pt-4 text-sm">
              <p>{customer.total_invoices} invoices</p>
            </div>
          </>
        )}
      />
    </div>
  );
}
