interface EmojiProps {
  char: string;
  size?: number;
  className?: string;
}

function emojiToCp(s: string): string {
  return [...s]
    .map((c) => c.codePointAt(0)!)
    .filter((c) => c !== 0xfe0f && c !== 0x200d)
    .map((c) => c.toString(16))
    .join('-');
}

export default function Emoji({ char, size = 22, className = '' }: EmojiProps) {
  const cp = emojiToCp(char);
  const src = `${import.meta.env.BASE_URL}emoji/${cp}.svg`;
  return (
    <img
      src={src}
      alt={char}
      className={`emoji ${className}`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
