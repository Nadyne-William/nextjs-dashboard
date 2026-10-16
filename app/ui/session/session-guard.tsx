'use client';

import { ClockIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import { signOutWithReason } from '@/app/lib/actions';
import { Modal, modalButton } from '@/app/ui/modal';

/**
 * Two related jobs, so they live together:
 *
 * 1. Idle timeout. After a period with no activity, warn with a countdown,
 *    then sign out. Activity in any open tab counts for all tabs.
 * 2. Session expired. Any component that gets a "session expired" answer
 *    from the server calls `reportSessionExpired()`, and the user gets one
 *    blocking modal instead of a confusing error in whatever form they were using.
 */

const WARNING_SECONDS = 60;
const ACTIVITY_KEY = 'dashboard:last-activity';
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;
// Writing to storage on every mousemove would be wasteful; once every few seconds is plenty.
const ACTIVITY_THROTTLE_MS = 5_000;

type SessionContextValue = { reportSessionExpired: () => void };

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSessionGuard() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionGuard must be used inside <SessionGuard>.');
  return ctx;
}

function readSharedActivity(): number | null {
  try {
    const value = Number(window.localStorage.getItem(ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null; // Storage can be blocked (private mode, strict settings). The timer still works per tab.
  }
}

function writeSharedActivity(time: number) {
  try {
    window.localStorage.setItem(ACTIVITY_KEY, String(time));
  } catch {
    // See readSharedActivity.
  }
}

export function SessionGuard({
  idleTimeoutMinutes,
  children,
}: {
  idleTimeoutMinutes: number;
  children: ReactNode;
}) {
  const idleMs = idleTimeoutMinutes * 60_000;
  const warningMs = Math.min(WARNING_SECONDS * 1000, idleMs / 2);

  const lastActivity = useRef(Date.now());
  const lastWrite = useRef(0);
  const warningOpen = useRef(false);
  const signingOut = useRef(false);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const [isPending, startTransition] = useTransition();

  const signOut = useCallback((reason: 'idle' | 'expired' | 'manual') => {
    if (signingOut.current) return;
    signingOut.current = true;
    startTransition(() => signOutWithReason(reason));
  }, []);

  const markActive = useCallback((force = false) => {
    const now = Date.now();
    lastActivity.current = now;
    if (force || now - lastWrite.current > ACTIVITY_THROTTLE_MS) {
      lastWrite.current = now;
      writeSharedActivity(now);
    }
  }, []);

  const staySignedIn = useCallback(() => {
    warningOpen.current = false;
    setSecondsLeft(null);
    markActive(true);
  }, [markActive]);

  // Record activity. While the warning is up, only the explicit button counts:
  // a stray mouse movement shouldn't silently cancel a security prompt.
  useEffect(() => {
    markActive(true);
    const onActivity = () => {
      if (!warningOpen.current) markActive();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
  }, [markActive]);

  // Activity in another tab resets this tab's timer too.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== ACTIVITY_KEY || !e.newValue) return;
      const time = Number(e.newValue);
      if (time > lastActivity.current) {
        lastActivity.current = time;
        if (warningOpen.current) {
          warningOpen.current = false;
          setSecondsLeft(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // One clock for everything. Compares timestamps instead of counting ticks,
  // so it stays correct when the browser throttles timers in background tabs
  // or the laptop wakes from sleep.
  useEffect(() => {
    const tick = () => {
      if (signingOut.current || expired) return;

      const shared = readSharedActivity();
      if (shared && shared > lastActivity.current) lastActivity.current = shared;

      const idleFor = Date.now() - lastActivity.current;

      if (idleFor >= idleMs) {
        signOut('idle');
      } else if (idleFor >= idleMs - warningMs) {
        warningOpen.current = true;
        setSecondsLeft(Math.ceil((idleMs - idleFor) / 1000));
      } else if (warningOpen.current) {
        warningOpen.current = false;
        setSecondsLeft(null);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [idleMs, warningMs, expired, signOut]);

  const reportSessionExpired = useCallback(() => {
    warningOpen.current = false;
    setSecondsLeft(null);
    setExpired(true);
  }, []);

  return (
    <SessionContext.Provider value={{ reportSessionExpired }}>
      {children}

      <Modal
        open={secondsLeft !== null && !expired}
        title="Are you still there?"
        icon={<ClockIcon className="h-6 w-6 text-amber-500" />}
        onDismiss={staySignedIn}
        footer={
          <>
            <button type="button" className={modalButton.secondary} onClick={() => signOut('manual')} disabled={isPending}>
              Sign out now
            </button>
            <button type="button" className={modalButton.primary} onClick={staySignedIn} disabled={isPending} autoFocus>
              Stay signed in
            </button>
          </>
        }
      >
        <p>
          For your security, you&apos;ll be signed out in{' '}
          <span className="font-semibold tabular-nums text-gray-900" aria-live="polite">
            {secondsLeft ?? 0} {secondsLeft === 1 ? 'second' : 'seconds'}
          </span>{' '}
          because there&apos;s been no activity for a while.
        </p>
      </Modal>

      {/* No onDismiss: the only way out is signing in again. */}
      <Modal
        open={expired}
        title="Your session has expired"
        icon={<LockClosedIcon className="h-6 w-6 text-red-500" />}
        footer={
          <button type="button" className={modalButton.primary} onClick={() => signOut('expired')} disabled={isPending} autoFocus>
            {isPending ? 'Redirecting…' : 'Sign in again'}
          </button>
        }
      >
        <p>Please sign in again to continue. Your last change wasn&apos;t saved.</p>
      </Modal>
    </SessionContext.Provider>
  );
}

/** For forms: shows the "session expired" modal when an action reports it. */
export function useSessionExpiredEffect(state: { sessionExpired?: boolean }) {
  const { reportSessionExpired } = useSessionGuard();
  useEffect(() => {
    if (state.sessionExpired) reportSessionExpired();
  }, [state, reportSessionExpired]);
}
