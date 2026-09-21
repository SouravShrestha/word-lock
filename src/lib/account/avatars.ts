/**
 * The avatar set. Pure — safe to import from client components.
 *
 * An avatar is stored as an **id** (`avatar_01`), never as a URL. The bucket
 * name, the file extension and the Supabase host are presentation details, and
 * `avatarUrl` is the single place they are composed. That way adding artwork is a
 * change to `AVATAR_COUNT` and nothing else, and moving the files is a change to
 * one function rather than to every row in the table.
 *
 * Ids are generated from a count rather than listed by hand because the set is
 * expected to grow to fifty; a hand-written list would be fifty lines that must
 * agree with the filenames in the bucket.
 */

/**
 * How many avatars exist in the bucket. Bump this when artwork is added.
 *
 * Kept in sync by hand rather than by listing the bucket at runtime: a listing
 * would be a network call on every render of the picker to answer a question that
 * only changes when someone uploads a file, and it would let a stray upload
 * become a selectable avatar without anyone deciding it should be.
 */
export const AVATAR_COUNT = 51;

/** Bucket holding `avatar_NN.png`. Public-read: these are not secrets. */
const AVATAR_BUCKET = "avatar";

export type AvatarId = string;

/** `1` → `avatar_01`. Two digits, matching the filenames and the CHECK in 009. */
export function avatarIdFor(index: number): AvatarId {
  return `avatar_${String(index).padStart(2, "0")}`;
}

/** Every selectable avatar, in display order. */
export const AVATAR_IDS: readonly AvatarId[] = Array.from({ length: AVATAR_COUNT }, (_, i) =>
  avatarIdFor(i + 1),
);

/**
 * What a player has before they choose, and the fallback for any id this build
 * does not recognise. Mirrors the column default in migration 009.
 */
export const DEFAULT_AVATAR_ID: AvatarId = AVATAR_IDS[0];

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && AVATAR_IDS.includes(value);
}

/**
 * Coerces anything to a usable avatar id.
 *
 * Needed because a row can legitimately hold an id this build has never heard
 * of — a client cached before artwork was removed, or a row written by a newer
 * deploy during a rollout. Falling back beats rendering a broken image.
 */
export function normalizeAvatarId(value: string | null | undefined): AvatarId {
  return isAvatarId(value) ? value : DEFAULT_AVATAR_ID;
}

/**
 * Public URL for an avatar.
 *
 * Composed by hand rather than through the storage SDK: the bucket is public, so
 * the path is a stable, cacheable URL and reaching for a client would mean
 * pulling Supabase into components that only need a string.
 *
 * Returns an empty string when the Supabase URL is not configured, so a
 * misconfigured build renders a plain placeholder instead of throwing during
 * render.
 */
export function avatarUrl(value: string | null | undefined): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${normalizeAvatarId(value)}.png`;
}
