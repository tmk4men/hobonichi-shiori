import { useState } from 'react';
import { hashPassword, loadLock, saveLock } from '../auth';

interface Props {
  onClose: () => void;
  onChanged: () => void;
}

function PinDots({ length }: { length: number }) {
  return (
    <div className="pin-dots">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`pin-dot${i < length ? ' on' : ''}`} />
      ))}
    </div>
  );
}

function PinKeypad({ onPress, onDel }: { onPress: (d: string) => void; onDel: () => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <div className="pin-keypad">
      {keys.map((k) => (
        <button key={k} className="pin-key" onClick={() => onPress(k)}>
          {k}
        </button>
      ))}
      <span />
      <button className="pin-key" onClick={() => onPress('0')}>0</button>
      <button className="pin-key pin-back" onClick={onDel} aria-label="削除">←</button>
    </div>
  );
}

export default function PasswordSheet({ onClose, onChanged }: Props) {
  const existing = loadLock();
  const [mode, setMode] = useState<'view' | 'set' | 'confirm' | 'remove'>(
    existing ? 'view' : 'set',
  );
  const [pin, setPin] = useState('');
  const [pinFirst, setPinFirst] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const press = (d: string) => {
    setError('');
    setPin((cur) => (cur.length < 4 ? cur + d : cur));
  };
  const del = () => {
    setError('');
    setPin((cur) => cur.slice(0, -1));
  };

  const setStart = () => {
    setPin('');
    setPinFirst('');
    setError('');
    setMode('set');
  };

  const confirmSet = async () => {
    if (mode === 'set' && pin.length === 4) {
      setPinFirst(pin);
      setPin('');
      setMode('confirm');
      return;
    }
    if (mode === 'confirm' && pin.length === 4) {
      if (pin !== pinFirst) {
        setError('一致しません。もう一度。');
        setPin('');
        setMode('set');
        setPinFirst('');
        return;
      }
      setBusy(true);
      const h = await hashPassword(pin);
      saveLock({ hash: h });
      setBusy(false);
      onChanged();
      onClose();
    }
  };

  const tryRemove = async () => {
    if (!existing) return;
    if (pin.length !== 4) return;
    setBusy(true);
    const h = await hashPassword(pin);
    if (h !== existing.hash) {
      setError('あいことばが ちがいます。');
      setPin('');
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
      <div className="sheet pin-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>{
          mode === 'view'
            ? 'かぎ'
            : mode === 'set'
              ? '4けたの 数字を 入れる'
              : mode === 'confirm'
                ? 'もう一度、同じ数字を'
                : 'いまの 数字を 入れる'
        }</h3>

        {mode === 'view' ? (
          <>
            <p className="empty" style={{ margin: '4px 0', fontSize: 13 }}>
              いま、4けたの 数字で 守られています。
            </p>
            <div className="modal-actions">
              <button className="ghost" onClick={() => { setPin(''); setError(''); setMode('remove'); }}>
                解除する
              </button>
              <button className="primary" onClick={setStart}>
                変更する
              </button>
            </div>
          </>
        ) : (
          <>
            <PinDots length={pin.length} />
            {error && <p className="error" style={{ textAlign: 'center' }}>{error}</p>}
            <PinKeypad onPress={press} onDel={del} />
            <div className="modal-actions">
              <button className="ghost" onClick={existing ? () => setMode('view') : onClose}>
                やめる
              </button>
              <button
                className="primary"
                onClick={mode === 'remove' ? tryRemove : confirmSet}
                disabled={busy || pin.length !== 4}
              >
                {mode === 'remove' ? '解除する' : mode === 'confirm' ? 'ほぞん' : 'つぎへ'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
