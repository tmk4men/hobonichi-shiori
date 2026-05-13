import { useEffect, useState } from 'react';
import { verifyPassword } from '../auth';
import { iconUrl, loadIconChoice } from '../iconChoice';
import { playUnlock, unlockAudio } from '../sfx';
import { hapticError, hapticSuccess, hapticTap } from '../haptics';

interface Props {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const icon = loadIconChoice();

  const press = (d: string) => {
    unlockAudio();
    hapticTap();
    setError('');
    setPin((c) => (c.length < 4 ? c + d : c));
  };
  const del = () => {
    setError('');
    setPin((c) => c.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length !== 4) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      const ok = await verifyPassword(pin);
      if (cancelled) return;
      setBusy(false);
      if (ok) {
        playUnlock();
        hapticSuccess();
        onUnlock();
      } else {
        hapticError();
        setError('ちがいます。');
        setTimeout(() => !cancelled && setPin(''), 350);
      }
    })();
    return () => { cancelled = true; };
  }, [pin, onUnlock]);

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <img
          className="lock-ribbon"
          src={`${import.meta.env.BASE_URL}illust/lock-ribbon.svg`}
          alt=""
          aria-hidden="true"
        />
        <img className="lock-icon" src={iconUrl(icon)} alt="" />
        <h1>ひびのしおり</h1>
        <p className="lock-sub">4けたの 数字を 入れて ひらく。</p>

        <div className="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`pin-dot${i < pin.length ? ' on' : ''}`} />
          ))}
        </div>
        {error && <p className="error" style={{ textAlign: 'center' }}>{error}</p>}

        <div className="pin-keypad lock-keypad">
          {['1','2','3','4','5','6','7','8','9'].map((k) => (
            <button key={k} className="pin-key" onClick={() => press(k)} disabled={busy}>{k}</button>
          ))}
          <span />
          <button className="pin-key" onClick={() => press('0')} disabled={busy}>0</button>
          <button className="pin-key pin-back" onClick={del} disabled={busy} aria-label="削除">←</button>
        </div>
      </div>
    </div>
  );
}
