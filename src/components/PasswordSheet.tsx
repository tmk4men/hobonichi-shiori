import { useState } from 'react';
import { hashPassword, loadLock, saveLock } from '../auth';

interface Props {
  onClose: () => void;
  onChanged: () => void;
}

export default function PasswordSheet({ onClose, onChanged }: Props) {
  const existing = loadLock();
  const [mode, setMode] = useState<'view' | 'set' | 'remove'>(existing ? 'view' : 'set');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [hint, setHint] = useState('');
  const [oldPw, setOldPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setNew = async () => {
    setError('');
    if (pw.length < 4) { setError('4文字以上で 入れてください。'); return; }
    if (pw !== pw2) { setError('2回めが ちがいます。'); return; }
    setBusy(true);
    const h = await hashPassword(pw);
    saveLock({ hash: h, hint: hint.trim() || undefined });
    setBusy(false);
    onChanged();
    onClose();
  };

  const removeLock = async () => {
    setError('');
    if (!existing) return;
    setBusy(true);
    const h = await hashPassword(oldPw);
    if (h !== existing.hash) {
      setError('あいことばが ちがいます。');
      setBusy(false);
      return;
    }
    saveLock(null);
    setBusy(false);
    onChanged();
    onClose();
  };

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>あいことば</h3>

        {existing && mode === 'view' && (
          <>
            <p className="empty" style={{ margin: '8px 0' }}>
              いま、あいことばが せっていされています。
            </p>
            {existing.hint && (
              <p className="empty" style={{ margin: '0 0 8px', fontSize: 13 }}>
                ヒント: {existing.hint}
              </p>
            )}
            <div className="modal-actions">
              <button className="ghost" onClick={() => setMode('remove')}>
                解除する
              </button>
              <button className="primary" onClick={() => { setMode('set'); setPw(''); setPw2(''); setHint(existing.hint ?? ''); }}>
                変更する
              </button>
            </div>
          </>
        )}

        {mode === 'set' && (
          <>
            <p className="empty" style={{ margin: '0 0 4px', fontSize: 13 }}>
              つよく しない、忘れにくい ことばで。
            </p>
            <label className="field">
              <span>あいことば（4文字以上）</span>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoFocus
                inputMode="text"
              />
            </label>
            <label className="field">
              <span>もう一度</span>
              <input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
              />
            </label>
            <label className="field">
              <span>ヒント（任意）</span>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                maxLength={40}
              />
            </label>
            {error && <p className="error">{error}</p>}
            <div className="modal-actions">
              <button className="ghost" onClick={existing ? () => setMode('view') : onClose}>
                やめる
              </button>
              <button className="primary" onClick={setNew} disabled={busy}>
                ほぞん
              </button>
            </div>
          </>
        )}

        {mode === 'remove' && (
          <>
            <p className="empty" style={{ margin: '0 0 4px', fontSize: 13 }}>
              いまの あいことばを 入れて 確認します。
            </p>
            <label className="field">
              <span>いまの あいことば</span>
              <input
                type="password"
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                autoFocus
              />
            </label>
            {error && <p className="error">{error}</p>}
            <div className="modal-actions">
              <button className="ghost" onClick={() => setMode('view')}>
                やめる
              </button>
              <button className="primary" onClick={removeLock} disabled={busy}>
                解除する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
