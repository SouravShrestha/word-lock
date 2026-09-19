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
            className="chunky-btn btn-surface-2 flex-1 py-3"
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="chunky-btn btn-danger flex-1 py-3"
          >
            {isPending ? "Leaving…" : "Leave"}
          </button>
        </div>
      </div>
    </div>
  );
}
