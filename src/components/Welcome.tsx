import { useState } from 'react';
import type { CoverTheme, Notebook } from '../types';
import { COVER_THEMES } from '../types';
import { iconUrl, loadIconChoice } from '../iconChoice';
import { newId } from '../storage';

interface Props {
  onComplete: (nb: Notebook) => void;
}

export default function Welcome({ onComplete }: Props) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [cover, setCover] = useState<CoverTheme>('beige');
  const [title, setTitle] = useState('');
  const icon = loadIconChoice();

  const finish = () => {
    const t = title.trim() || 'はじめての ノート';
    const nb: Notebook = {
      id: newId(),
      title: t,
      cover,
      calendarMode: 'seireki',
      createdAt: Date.now(),
    };
    onComplete(nb);
  };

  return (
    <div className="welcome">
      {step === 0 && (
        <div className="welcome-step welcome-intro">
          <img
            className="welcome-hero"
            src={`${import.meta.env.BASE_URL}illust/welcome-hero.svg`}
            alt=""
          />
          <img className="welcome-icon" src={iconUrl(icon)} alt="" />
          <h1>ひびのしおり</h1>
          <p className="welcome-lead">
            ぴかぴかの 写真ではなく、
            <br />
            人生の 断片を そっと 残すために。
          </p>
          <button className="primary" onClick={() => setStep(1)}>
            ノートを 1冊、ひらく
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="welcome-step">
          <p className="welcome-step-h">表紙を 選ぶ。</p>
          <div className="welcome-covers">
            {COVER_THEMES.map((t) => (
              <button
                key={t.key}
                className={`welcome-cover${cover === t.key ? ' on' : ''}`}
                style={{ background: t.bg, color: t.ink }}
                onClick={() => setCover(t.key)}
              >
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          <div className="welcome-actions">
            <button className="ghost" onClick={() => setStep(0)}>
              もどる
            </button>
            <button className="primary" onClick={() => setStep(2)}>
              つぎへ
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="welcome-step">
          <p className="welcome-step-h">名前を 書く。</p>
          <div className="welcome-bookwrap">
            <span
              className="welcome-bookpreview"
              style={{
                background: COVER_THEMES.find((t) => t.key === cover)!.bg,
                color: COVER_THEMES.find((t) => t.key === cover)!.ink,
              }}
            >
              <span className="welcome-booklabel">
                {title.trim() || 'あなたの しおり'}
              </span>
            </span>
          </div>
          <input
            className="welcome-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="あなたの しおり"
            maxLength={40}
            autoFocus
          />
          <div className="welcome-actions">
            <button className="ghost" onClick={() => setStep(1)}>
              もどる
            </button>
            <button className="primary" onClick={finish}>
              はじめる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
