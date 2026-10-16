'use client';

import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteInvoice } from '@/app/lib/actions';
import { Modal, modalButton } from '@/app/ui/modal';
import { useSessionGuard } from '@/app/ui/session/session-guard';

export function DeleteInvoice({ id, label }: { id: string; label: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Guards against a double click firing the action twice before the first one settles.
  const inFlight = useRef(false);
  const { reportSessionExpired } = useSessionGuard();

  const confirmDelete = () => {
    if (inFlight.current) return;
    inFlight.current = true;

    startTransition(async () => {
      try {
        const result = await deleteInvoice(id);
        setConfirming(false);
        if (result.ok) {
          toast.success('Invoice deleted');
        } else if (result.sessionExpired) {
          reportSessionExpired();
        } else {
          toast.error(result.message);
        }
      } catch {
        setConfirming(false);
        toast.error('Something went wrong. Please try again.');
      } finally {
        inFlight.current = false;
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border p-2 hover:bg-gray-100"
      >
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>

      <Modal
        open={confirming}
        title="Delete this invoice?"
        icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-500" />}
        onDismiss={isPending ? undefined : () => setConfirming(false)}
        footer={
          <>
            <button
              type="button"
              className={modalButton.secondary}
              onClick={() => setConfirming(false)}
              disabled={isPending}
            >
              Cancel
            </button>
            <button type="button" className={modalButton.danger} onClick={confirmDelete} disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete invoice'}
            </button>
          </>
        }
      >
        <p>
          The invoice for <span className="font-medium text-gray-900">{label}</span> will be permanently
          removed. This can&apos;t be undone.
        </p>
      </Modal>
    </>
  );
}
