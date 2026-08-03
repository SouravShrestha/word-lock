import { SkipIcon } from "@/components/icons/SkipIcon";
import { BinIcon } from "@/components/icons/BinIcon";
import { Delete } from "@/components/icons";

export function ActionBar({
  yourTurn,
  selectionLength,
  onPass,
  onClear,
  onBackspace,
  onSubmit,
  passPending,
  submitPending,
}: {
  yourTurn: boolean;
  selectionLength: number;
  onPass: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onSubmit: () => void;
  passPending: boolean;
  submitPending: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      <button
        onClick={onPass}
        disabled={!yourTurn || passPending}
        className="chunky-btn flex-1 flex flex-col items-center justify-center gap-0.5 bg-card py-2 text-foreground hover:bg-card disabled:pointer-events-none"
        aria-label="Pass turn"
      >
        <SkipIcon className="w-4 h-4" />
        <span className="text-[0.55rem] font-semibold uppercase tracking-wide">Skip</span>
      </button>
      <button
        onClick={onClear}
        disabled={!yourTurn || selectionLength === 0}
        className="chunky-btn flex-1 flex flex-col items-center justify-center gap-0.5 bg-card py-2 text-foreground hover:bg-card disabled:pointer-events-none"
        aria-label="Clear selection"
      >
        <BinIcon className="w-4 h-4" />
        <span className="text-[0.55rem] font-semibold uppercase tracking-wide">Clear</span>
      </button>
      <button
        onClick={onBackspace}
        disabled={!yourTurn || selectionLength === 0}
        className="chunky-btn flex-1 flex flex-col items-center justify-center gap-0.5 bg-card py-2 text-foreground hover:bg-card disabled:pointer-events-none"
        aria-label="Remove last tile"
      >
        <Delete className="w-4 h-4" />
        <span className="text-[0.55rem] font-semibold uppercase tracking-wide">Delete</span>
      </button>
      <button
        onClick={onSubmit}
        disabled={!yourTurn || selectionLength < 3 || submitPending}
        className="chunky-btn flex-1 flex flex-col items-center justify-center gap-0.5 bg-primary py-2 text-primary-foreground disabled:pointer-events-none"
        aria-label="Submit word"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <g>
            <path d="M19 6.5c-.6 0-1 .4-1 1v4c0 .6-.4 1-1 1H7.4l1.3-1.3c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-3 3c-.1.1-.2.2-.2.3-.1.2-.1.5 0 .8 0 .1.1.2.2.3l3 3c.4.4 1 .4 1.4 0s.4-1 0-1.4l-1.3-1.3H17c1.7 0 3-1.3 3-3v-4c0-.6-.5-1-1-1" />
          </g>
        </svg>
        <span className="text-[0.55rem] font-semibold uppercase tracking-wide">Enter</span>
      </button>
    </div>
  );
}
