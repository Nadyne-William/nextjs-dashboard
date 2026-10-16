'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  /**
   * Called on Escape or a click on the backdrop. Leave it out for a modal the
   * user must answer, such as "your session has expired".
   */
  onDismiss?: () => void;
};

/**
 * Built on the native <dialog> element, so focus is trapped, the page behind
 * is inert, and screen readers announce it, without a library.
 */
export function Modal({ open, title, icon, children, footer, onDismiss }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="w-[calc(100%-2rem)] max-w-md rounded-xl p-0 shadow-xl backdrop:bg-gray-900/40 backdrop:backdrop-blur-[2px]"
      onCancel={(e) => {
        // Escape key. Blocked entirely when the modal can't be dismissed.
        e.preventDefault();
        onDismiss?.();
      }}
      onClick={(e) => {
        // A click on the dialog element itself (not its content) is a backdrop click.
        if (e.target === ref.current) onDismiss?.();
      }}
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <div className="mt-2 text-sm text-gray-600">{children}</div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>
      </div>
    </dialog>
  );
}

export const modalButton = {
  primary:
    'inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60',
  danger:
    'inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60',
  secondary:
    'inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60',
};
