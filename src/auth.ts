const KEY = 'hobonichi.lock.v1';

interface LockSetting {
  hash: string;
  hint?: string;
}

export async function hashPassword(pw: string): Promise<string> {
  const enc = new TextEncoder().encode(`hobonichi:${pw}`);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function loadLock(): LockSetting | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.hash === 'string') return parsed as LockSetting;
    return null;
  } catch {
    return null;
  }
}

export function saveLock(lock: LockSetting | null): void {
  if (lock) {
    localStorage.setItem(KEY, JSON.stringify(lock));
  } else {
    localStorage.removeItem(KEY);
  }
}

export async function verifyPassword(pw: string): Promise<boolean> {
  const cur = loadLock();
  if (!cur) return true;
  return (await hashPassword(pw)) === cur.hash;
}
