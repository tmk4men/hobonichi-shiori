import { useState } from 'react';
import { loadLock, verifyPassword } from '../auth';

interface Props {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: Props) {
  const lock = loadLock();
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw) return;
    setBusy(true);
    const ok = await verifyPassword(pw);
    setBusy(false);
    if (ok) onUnlock();
    else {
      setError('あいことばが ちがいます。');
      setPw('');
    }
  };

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <div className="lock-illust">📔</div>
        <h1>ほぼ日のしおり</h1>
        <p className="lock-sub">あいことばを 入れて、ひらく。</p>
        <form onSubmit={submit} className="lock-form">
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(''); }}
            autoFocus
            inputMode="text"
            placeholder="あいことば"
          />
          {lock?.hint && <p className="lock-hint">ヒント: {lock.hint}</p>}
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit" disabled={busy || !pw}>
            ひらく
          </button>
        </form>
      </div>
    </div>
  );
}
