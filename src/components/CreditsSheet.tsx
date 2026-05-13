interface Props {
  onClose: () => void;
}

export default function CreditsSheet({ onClose }: Props) {
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet credits-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>クレジット</h3>

        <section className="credits-section">
          <h4 className="credits-h">効果音</h4>
          <p className="credits-line">
            紙をめくる音 <span className="credits-name">タダノオト</span>
          </p>
        </section>

        <section className="credits-section">
          <h4 className="credits-h">フォント</h4>
          <p className="credits-line">Google Fonts</p>
          <p className="credits-sub">
            Shippori Mincho B1 / Zen Kaku Gothic New / Klee One / Yusei Magic /
            Yomogi / Zen Kurenaido / Hachi Maru Pop / Kaisei Decol / Caveat
          </p>
        </section>

        <section className="credits-section">
          <h4 className="credits-h">絵文字</h4>
          <p className="credits-line">Twemoji</p>
          <p className="credits-sub">© Twitter, Inc / CC-BY 4.0</p>
        </section>

        <section className="credits-section">
          <h4 className="credits-h">ひびのしおり</h4>
          <p className="credits-sub">
            日々を、そっと しまう。
          </p>
        </section>

        <div className="modal-actions">
          <span style={{ flex: 1 }} />
          <button className="ghost" onClick={onClose}>
            とじる
          </button>
        </div>
      </div>
    </div>
  );
}
