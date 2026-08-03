import Link from "next/link";

const TILT = [0, 0, 0, 0];
// const TILT = [-3, 2, -1, 3];
const COLORS = [
  "bg-primary text-primary-foreground",
  "bg-p1 text-tile-text",
  "bg-accent text-accent-foreground",
  "bg-card text-card-foreground",
];

function Row({ word, offset = 0 }: { word: string; offset?: number }) {
  return (
    <span className="flex items-center gap-2">
      {word.split("").map((letter, i) => (
        <span
          key={`${letter}-${i}`}
          className={`letter-tile h-12 w-12 text-xl sm:h-14 sm:w-14 sm:text-2xl ${COLORS[(i + offset) % COLORS.length]}`}
          style={{ transform: `rotate(${TILT[(i + offset) % TILT.length]}deg) translateZ(0)` }}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}

export function Wordmark({
  size = "lg",
  stacked = false,
}: {
  size?: "lg" | "sm";
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <Link
        href="/"
        className="inline-flex flex-col items-center gap-3"
        aria-label="Word-lock home"
      >
        <Row word="WORD" />
        <Row word="LOCK" offset={2} />
      </Link>
    );
  }

  const text = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <Link href="/" className={`wordmark inline-flex ${text}`} aria-label="Word-lock home">
      Word<span className="text-p1"> lock</span>
    </Link>
  );
}
