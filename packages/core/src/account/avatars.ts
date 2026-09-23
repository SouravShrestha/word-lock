import { supabaseOrigin } from "../build-env";

export const AVATAR_COUNT = 51;

const AVATAR_BUCKET = "avatar";

export type AvatarId = string;

export function avatarIdFor(index: number): AvatarId {
  return `avatar_${String(index).padStart(2, "0")}`;
}

export const AVATAR_IDS: readonly AvatarId[] = Array.from({ length: AVATAR_COUNT }, (_, i) =>
  avatarIdFor(i + 1),
);

export const DEFAULT_AVATAR_ID: AvatarId = AVATAR_IDS[0];

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && AVATAR_IDS.includes(value);
}

export function normalizeAvatarId(value: string | null | undefined): AvatarId {
  return isAvatarId(value) ? value : DEFAULT_AVATAR_ID;
}

export function avatarUrl(
  value: string | null | undefined,
  baseUrl: string | undefined = supabaseOrigin(),
): string {
  if (!baseUrl) return "";
  return `${baseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${normalizeAvatarId(value)}.png`;
}
