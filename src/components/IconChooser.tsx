import { useState } from 'react';
import type { IconChoice } from '../iconChoice';
import { iconUrl, loadIconChoice, saveIconChoice } from '../iconChoice';

interface Props {
  onClose: () => void;
}

export default function IconChooser({ onClose }: Props) {
  const [choice, setChoice] = useState<IconChoice>(loadIconChoice());

  const pick = (c: IconChoice) => {
    setChoice(c);
    saveIconChoice(c);
  };

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>ロックの 絵</h3>
        <div className="icon-pick">
          {(['a', 'b'] as IconChoice[]).map((c) => (
            <button
              key={c}
              className={`icon-opt${choice === c ? ' on' : ''}`}
              onClick={() => pick(c)}
            >
              <img src={iconUrl(c)} alt="" />
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <span style={{ flex: 1 }} />
          <button className="primary" onClick={onClose}>とじる</button>
        </div>
      </div>
    </div>
  );
}
