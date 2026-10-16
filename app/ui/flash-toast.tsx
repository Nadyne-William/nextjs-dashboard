'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Server actions redirect after saving, so they can't show a toast themselves.
// They add ?toast=<key> to the redirect URL instead; this shows the message
// once and removes the param, so a refresh doesn't show it again.
const MESSAGES: Record<string, { type: 'success' | 'error'; text: string }> = {
  created: { type: 'success', text: 'Invoice created' },
  updated: { type: 'success', text: 'Invoice updated' },
};

export function FlashToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const key = searchParams.get('toast');
  const denied = searchParams.get('denied');

  useEffect(() => {
    if (!key && !denied) return;

    const message = key ? MESSAGES[key] : null;
    if (message) toast[message.type](message.text);
    if (denied) toast.error("You don't have permission to open that page.");

    const params = new URLSearchParams(searchParams);
    params.delete('toast');
    params.delete('denied');
    const qs = params.toString();
    replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [key, denied, pathname, replace, searchParams]);

  return null;
}
