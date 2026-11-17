"use client";

import { AutoThemeIcon, MoonIcon, SunIcon } from "@word-lock/icons";
import { colors } from "@word-lock/tokens/native";
import { useTheme } from "next-themes";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";

export const THEME_LABELS: Record<string, string> = {
  system: "System",
  dark: "Dark",
  light: "Light",
};

const OPTIONS = [
  { value: "system", Icon: AutoThemeIcon },
  { value: "dark", Icon: MoonIcon },
  { value: "light", Icon: SunIcon },
] as const;

export function AppearanceSheet({
  open,
  onClose,
  zClassName,
}: {
  open: boolean;
  onClose: () => void;
  zClassName?: string;
}) {
  const { theme, systemTheme, setTheme } = useTheme();
  const device = systemTheme === "dark" ? "dark" : "light";

  return (
    <BottomSheet open={open} onClose={onClose} label="Appearance" zClassName={zClassName}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg">Choose your theme</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div role="radiogroup" aria-label="Theme" className="mt-6 flex gap-3 pb-2">
        {OPTIONS.map(({ value, Icon }) => {
          const selected = theme === value;
          // The tile previews what it picks; System previews the device's scheme.
          const tile = colors[value === "system" ? device : value];
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setTheme(value);
                onClose();
              }}
              style={{ backgroundColor: tile.background, color: tile.foreground }}
              className="press relative flex h-28 flex-1 flex-col items-start justify-between overflow-hidden rounded-xl border border-border px-3 pt-4 pb-3 text-left"
            >
              <Icon size={16} color={tile.foreground} />
              <span className="text-base font-medium">{THEME_LABELS[value]}</span>
              {selected ? (
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-sky" />
              ) : null}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
