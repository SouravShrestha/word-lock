import type { SVGProps } from "react";

/**
 * Red "LIVE" broadcast badge, used by `ReviewBar` as the way back to the live
 * board.
 *
 * Unlike most icons here it is deliberately **not** `currentColor`: the red is
 * the whole signal, the same way a broadcast badge reads on a screen, so it is
 * baked in rather than inherited from whatever it sits on.
 *
 * The artwork is centred in a square viewBox while the badge itself only fills
 * the middle band, so a square `size` paints a wide, short glyph — that is the
 * source's geometry, not padding to trim.
 */
export function LiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#f51e1e"
        d="M64 23a7 7 0 0 0-7-7H7a7 7 0 0 0-7 7v18a7 7 0 0 0 7 7h50a7 7 0 0 0 7-7z"
      />
      <path
        fill="#ffffff"
        d="M9.929 39.071c-3.903-3.903-3.903-10.239 0-14.142a1 1 0 0 0-1.414-1.414c-4.683 4.683-4.683 12.287 0 16.97a.999.999 0 1 0 1.414-1.414M24.071 24.929c3.903 3.903 3.903 10.239 0 14.142a1 1 0 0 0 1.414 1.414c4.683-4.683 4.683-12.287 0-16.97a.999.999 0 1 0-1.414 1.414"
      />
      <path
        fill="#ffffff"
        d="M12.757 36.243a6.005 6.005 0 0 1 0-8.486.999.999 0 1 0-1.414-1.414 8.004 8.004 0 0 0 0 11.314 1 1 0 0 0 1.414-1.414M21.243 27.757a6.005 6.005 0 0 1 0 8.486.999.999 0 1 0 1.414 1.414 8.004 8.004 0 0 0 0-11.314 1 1 0 0 0-1.414 1.414M55 31v-2h2a1 1 0 0 0 0-2h-3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3a1 1 0 0 0 0-2h-2v-2h2a1 1 0 0 0 0-2zM49.03 27.757 48 31.877l-1.03-4.12a1 1 0 0 0-1.94.486l2 8a1 1 0 0 0 1.94 0l2-8a1 1 0 0 0-1.94-.486M43 36v-8a1 1 0 0 0-2 0v8a1 1 0 0 0 2 0M34 28v8a1 1 0 0 0 1 1h3a1 1 0 0 0 0-2h-2v-7a1 1 0 0 0-2 0"
      />
      <circle cx="605" cy="200" r="3" fill="#ffffff" transform="translate(-588 -168)" />
    </svg>
  );
}
