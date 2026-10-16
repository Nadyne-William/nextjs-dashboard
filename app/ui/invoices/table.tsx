import Image from 'next/image';
import { UpdateInvoice, DeleteInvoice } from '@/app/ui/invoices/buttons';
import InvoiceStatus from '@/app/ui/invoices/status';
import { formatDateToLocal, formatCurrency } from '@/app/lib/utils';
import { fetchFilteredInvoices, type InvoiceStatusFilter } from '@/app/lib/data';
import type { InvoicesTable as InvoiceRow } from '@/app/lib/definitions';
import { DataTable, type Column } from '@/app/ui/data-table/data-table';

function CustomerCell({ invoice }: { invoice: InvoiceRow }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={invoice.image_url}
        className="rounded-full"
        width={28}
        height={28}
        alt={`${invoice.name}'s profile picture`}
      />
      <p>{invoice.name}</p>
    </div>
  );
}

function RowActions({ invoice }: { invoice: InvoiceRow }) {
  const label = `${invoice.name} (${formatCurrency(invoice.amount)})`;
  return (
    <div className="flex justify-end gap-3">
      <UpdateInvoice id={invoice.id} />
      <DeleteInvoice id={invoice.id} label={label} />
    </div>
  );
}

export default async function InvoicesTable({
  query,
  currentPage,
  status,
  canEdit,
}: {
  query: string;
  currentPage: number;
  status: InvoiceStatusFilter;
  canEdit: boolean;
}) {
  const invoices = await fetchFilteredInvoices(query, currentPage, status);

  const columns: Column<InvoiceRow>[] = [
    { key: 'customer', header: 'Customer', cell: (row) => <CustomerCell invoice={row} /> },
    { key: 'email', header: 'Email', cell: (row) => row.email },
    { key: 'amount', header: 'Amount', cell: (row) => formatCurrency(row.amount) },
    { key: 'date', header: 'Date', cell: (row) => formatDateToLocal(row.date) },
    { key: 'status', header: 'Status', cell: (row) => <InvoiceStatus status={row.status} /> },
  ];

  // Viewers don't get an empty actions column; the column simply isn't there.
  if (canEdit) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      srOnlyHeader: true,
      align: 'right',
      cell: (row) => <RowActions invoice={row} />,
    });
  }

  const hasFilters = query !== '' || status !== 'all';

  return (
    <DataTable
      caption="Invoices"
      columns={columns}
      rows={invoices}
      getRowId={(row) => row.id}
      emptyState={
        hasFilters ? (
          <>
            <p className="font-medium text-gray-900">No invoices match these filters</p>
            <p className="mt-1">Try a different search, or use “Clear all” to see everything.</p>
          </>
        ) : (
          <p>No invoices yet.</p>
        )
      }
      renderMobileCard={(invoice) => (
        <>
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <div className="mb-2">
                <CustomerCell invoice={invoice} />
              </div>
              <p className="text-sm text-gray-500">{invoice.email}</p>
            </div>
            <InvoiceStatus status={invoice.status} />
          </div>
          <div className="flex w-full items-center justify-between pt-4">
            <div>
              <p className="text-xl font-medium">{formatCurrency(invoice.amount)}</p>
              <p>{formatDateToLocal(invoice.date)}</p>
            </div>
            {canEdit ? <RowActions invoice={invoice} /> : null}
          </div>
        </>
      )}
    />
  );
}
