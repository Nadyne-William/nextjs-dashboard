import { Suspense } from 'react';
import { Metadata } from 'next';
import Pagination from '@/app/ui/invoices/pagination';
import Table from '@/app/ui/invoices/table';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { FilterBar, type SelectFilter } from '@/app/ui/data-table/filter-bar';
import { ResultsSummary } from '@/app/ui/data-table/data-table';
import { fetchInvoicesSummary, parseStatusFilter } from '@/app/lib/data';
import { can } from '@/app/lib/permissions';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Invoices',
};

const statusFilter: SelectFilter = {
  param: 'status',
  label: 'Filter by status',
  defaultValue: 'all',
  options: [
    { value: 'all', label: 'All statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
  ],
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    status?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const status = parseStatusFilter(searchParams?.status);

  const [session, summary] = await Promise.all([auth(), fetchInvoicesSummary(query, status)]);
  const canEdit = can(session?.user?.role, 'invoices:write');

  // Clamp the page, so a stale link like ?page=9 after filtering still shows results.
  const requestedPage = Number(searchParams?.page) || 1;
  const currentPage = Math.min(Math.max(requestedPage, 1), Math.max(summary.totalPages, 1));

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 md:mt-8">
        <FilterBar
          searchPlaceholder="Search by customer, email, amount or date…"
          filters={[statusFilter]}
          actions={canEdit ? <CreateInvoice /> : null}
        />
      </div>
      <Suspense key={`${query}-${status}-${currentPage}`} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} status={status} canEdit={canEdit} />
      </Suspense>
      <div className="mt-5 flex w-full flex-col items-center gap-3 md:flex-row md:justify-between">
        <ResultsSummary
          page={currentPage}
          pageSize={summary.pageSize}
          total={summary.totalCount}
          noun={['invoice', 'invoices']}
        />
        {summary.totalPages > 1 ? <Pagination totalPages={summary.totalPages} /> : null}
      </div>
    </div>
  );
}
