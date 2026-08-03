export function ForfeitConfirmDialog({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm px-6">
      <div className="neo bg-card w-full max-w-xs p-6 flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-lg font-bold">Leave the game?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your opponent will win if you leave now.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="chunky-btn flex-1 bg-card py-3 text-foreground"
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="chunky-btn flex-1 bg-destructive py-3 text-destructive-foreground"
          >
            {isPending ? "Leaving…" : "Leave"}
          </button>
        </div>
      </div>
    </div>
  );
}
