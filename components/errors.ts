// Classify and shorten wallet / contract errors so the UI never dumps a full
// viem stack trace at the user.

type ErrorLike = {
  message?: string;
  name?: string;
  shortMessage?: string;
  code?: number;
  cause?: unknown;
};

function asErrorLike(err: unknown): ErrorLike | null {
  if (!err || typeof err !== 'object') return null;
  return err as ErrorLike;
}

export function isUserRejection(err: unknown): boolean {
  const e = asErrorLike(err);
  if (!e) return false;
  if (e.name === 'UserRejectedRequestError') return true;
  if (e.code === 4001) return true;
  const msg = (e.message ?? '') + ' ' + (e.shortMessage ?? '');
  if (/user (rejected|denied)/i.test(msg)) return true;
  if (/rejected the request/i.test(msg)) return true;
  const cause = asErrorLike(e.cause);
  if (cause) {
    if (cause.name === 'UserRejectedRequestError') return true;
    if (cause.code === 4001) return true;
    const cmsg = (cause.message ?? '') + ' ' + (cause.shortMessage ?? '');
    if (/user (rejected|denied)/i.test(cmsg)) return true;
  }
  return false;
}

export function shortErrorMessage(err: unknown, maxLen = 100): string {
  const e = asErrorLike(err);
  if (!e) return 'Unknown error';
  // viem attaches a one-line `shortMessage` we can prefer.
  const raw = (e.shortMessage ?? e.message ?? 'Unknown error').trim();
  const first = raw.split('\n')[0].trim();
  return first.length > maxLen ? first.slice(0, maxLen).trim() + '…' : first;
}
