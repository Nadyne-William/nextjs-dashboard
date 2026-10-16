import clsx from 'clsx';
import type { ReactNode } from 'react';

export type Column<T> = {
  /** Stable key for React and for the header cell. */
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Visually hidden header text, for action columns that have no visible title. */
  srOnlyHeader?: boolean;
  align?: 'left' | 'right';
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Card layout for small screens. Tables don't fit on phones. */
  renderMobileCard: (row: T) => ReactNode;
  emptyState?: ReactNode;
  caption?: string;
};

/**
 * One table for every list in the app. Each page describes its columns as data;
 * spacing, borders, the mobile layout and the empty state live here once.
 * It renders on the server, so it ships no JavaScript of its own.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  renderMobileCard,
  emptyState = 'Nothing to show yet.',
  caption,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="mt-6 rounded-lg bg-gray-50 p-2">
        <div className="rounded-md bg-white px-6 py-12 text-center text-sm text-gray-500">
          {emptyState}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <ul className="md:hidden">
            {rows.map((row) => (
              <li key={getRowId(row)} className="mb-2 w-full rounded-md bg-white p-4">
                {renderMobileCard(row)}
              </li>
            ))}
          </ul>

          <table className="hidden min-w-full text-gray-900 md:table">
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <thead className="text-left text-sm font-normal">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={clsx(
                      'py-5 font-medium',
                      i === 0 ? 'px-4 sm:pl-6' : 'px-3',
                      col.align === 'right' && 'text-right',
                    )}
                  >
                    {col.srOnlyHeader ? <span className="sr-only">{col.header}</span> : col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  {columns.map((col, i) => (
                    <td
                      key={col.key}
                      className={clsx(
                        'whitespace-nowrap py-3',
                        i === 0 ? 'pl-6 pr-3' : 'px-3',
                        col.align === 'right' && 'text-right',
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** "Showing 7–12 of 15 invoices". Reads like a sentence, so it's easy to scan. */
export function ResultsSummary({
  page,
  pageSize,
  total,
  noun,
}: {
  page: number;
  pageSize: number;
  total: number;
  noun: [singular: string, plural: string];
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const label = total === 1 ? noun[0] : noun[1];

  return (
    <p className="text-sm text-gray-500" aria-live="polite">
      Showing <span className="font-medium text-gray-900">{from}</span>–
      <span className="font-medium text-gray-900">{to}</span> of{' '}
      <span className="font-medium text-gray-900">{total}</span> {label}
    </p>
  );
}
