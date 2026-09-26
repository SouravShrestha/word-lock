import type { ReactNode } from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

export interface TextStyleConfig {
  Usage: string;
  "Font-Family"?: string;
  Size: string;
  Weight: string;
  LetterSpacing?: string;
  Color: string;
}

export const TEXT_STYLE_CONFIG = {
  pageTitle: {
    Usage: "Top-level screen title",
    "Font-Family": "font-display",
    Size: "text-3xl",
    Weight: "font-bold",
    Color: "text-foreground",
    LetterSpacing: "tracking-wide",
  },
  leagueTitle: {
    Usage: "Leaderboard league name",
    "Font-Family": "font-display",
    Size: "text-3xl",
    Weight: "font-bold",
    Color: "",
    LetterSpacing: "tracking-wide",
  },
  sectionHeading: {
    Usage: "Section heading",
    "Font-Family": "font-display",
    Size: "text-lg",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  sheetTitle: {
    Usage: "Sheet title bar text",
    "Font-Family": "font-display",
    Size: "text-xl",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  heading: {
    Usage: "Card heading",
    "Font-Family": "font-display",
    Size: "text-lg",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  body: {
    Usage: "Body paragraphs",
    "Font-Family": "font-sans",
    Size: "text-sm",
    Weight: "font-medium",
    Color: "text-mutedForeground",
  },
  bodyBase: {
    Usage: "Loading panels",
    "Font-Family": "font-sans",
    Size: "text-base",
    Weight: "font-medium",
    Color: "text-foreground",
  },
  label: {
    Usage: "Row player name",
    Size: "text-[15px]",
    Weight: "font-semibold",
    Color: "text-foreground",
  },
  labelTracked: {
    Usage: "Overview fact value",
    "Font-Family": "font-display",
    Size: "text-[15px]",
    Weight: "font-semibold",
    LetterSpacing: "tracking-wide",
    Color: "text-mutedForeground",
  },
  labelBody: {
    Usage: "Auth sheet intro",
    "Font-Family": "font-sans",
    Size: "text-[15px]",
    Weight: "font-semibold",
    Color: "text-mutedForeground",
  },
  caption: {
    Usage: "Joined year",
    Size: "text-[13px]",
    Weight: "font-semibold",
    Color: "text-mutedForeground",
  },
  eyebrow: {
    Usage: "SectionLabel text",
    "Font-Family": "font-sans",
    Size: "text-[0.65rem]",
    Weight: "font-bold",
    LetterSpacing: "tracking-wider",
    Color: "text-mutedForeground",
  },
  turnStatus: {
    Usage: "Game-card turn",
    Size: "text-[0.65rem]",
    Weight: "font-bold",
    LetterSpacing: "tracking-wide",
    Color: "",
  },
  error: {
    Usage: "Inline error",
    Size: "text-sm",
    Weight: "font-semibold",
    Color: "text-destructive",
  },
  hint: {
    Usage: "Username hint",
    Size: "text-xs",
    Weight: "font-normal",
    Color: "text-mutedForeground",
  },
  hintSuccess: {
    Usage: "Username success",
    Size: "text-xs",
    Weight: "font-normal",
    Color: "text-mint",
  },
  link: {
    Usage: "Footer links",
    Size: "text-sm",
    Weight: "font-semibold",
    Color: "text-mutedForeground",
  },
  linkBold: {
    Usage: "Primary links",
    Size: "text-sm",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  stat: {
    Usage: "Primary star count",
    "Font-Family": "font-display",
    Size: "text-4xl",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  statMd: {
    Usage: "Medium stat",
    "Font-Family": "font-display",
    Size: "text-2xl",
    Weight: "font-bold",
    Color: "",
  },
  score: {
    Usage: "Live score",
    "Font-Family": "font-display",
    Size: "text-3xl",
    Weight: "font-bold",
    Color: "",
  },
  scoreCard: {
    Usage: "Lobby score",
    "Font-Family": "font-display",
    Size: "text-2xl",
    Weight: "font-semibold",
    Color: "",
  },
  timer: {
    Usage: "Compact time",
    "Font-Family": "font-display",
    Size: "text-xs",
    Weight: "font-medium",
    Color: "text-foreground",
  },
  countdown: {
    Usage: "Giant countdown",
    "Font-Family": "font-display",
    Size: "text-6xl",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  matchOpponent: {
    Usage: "Opponent name",
    "Font-Family": "font-display",
    Size: "text-[17px]",
    Weight: "font-medium",
    Color: "text-foreground",
  },
  roomCode: {
    Usage: "Room code",
    "Font-Family": "font-display",
    Size: "text-xl",
    Weight: "font-bold",
    LetterSpacing: "tracking-[0.3em]",
    Color: "text-foreground",
  },
  roomCodeCard: {
    Usage: "Room code card",
    Size: "text-[0.7rem]",
    Weight: "font-semibold",
    LetterSpacing: "tracking-wide",
    Color: "text-mutedForeground",
  },
  leagueStars: {
    Usage: "Star count",
    Size: "text-sm",
    Weight: "font-semibold",
    LetterSpacing: "tracking-wider",
    Color: "",
  },
  dateMeta: {
    Usage: "Document date",
    Size: "text-xs",
    Weight: "font-semibold",
    Color: "text-mutedForeground",
  },
  buttonMd: {
    Usage: "Button md",
    "Font-Family": "font-display",
    Size: "text-base",
    Weight: "font-bold",
    LetterSpacing: "tracking-wider",
    Color: "",
  },
  buttonSheet: {
    Usage: "Button sheet",
    "Font-Family": "font-display",
    Size: "text-[15px]",
    Weight: "font-bold",
    LetterSpacing: "tracking-wider",
    Color: "",
  },
  buttonSm: {
    Usage: "Button sm",
    "Font-Family": "font-display",
    Size: "text-[12px]",
    Weight: "font-semibold",
    Color: "",
  },
  input: {
    Usage: "TextInput",
    Size: "text-[17px]",
    Weight: "font-medium",
    LetterSpacing: "tracking-wide",
    Color: "text-foreground",
  },
  inputSm: {
    Usage: "Username input",
    Size: "text-[15px]",
    Weight: "font-medium",
    Color: "text-foreground",
  },
  inputCode: {
    Usage: "6-digit OTP",
    Size: "text-[17px]",
    Weight: "font-medium",
    LetterSpacing: "tracking-widest",
    Color: "text-foreground",
  },
  autoGen1: {
    Usage: "Auto-generated style for text-xl",
    Size: "text-xl",
    Weight: "font-medium",
    Color: "text-mutedForeground",
  },
  autoGen2: {
    Usage: "Auto-generated style for text-7xl",
    "Font-Family": "font-display",
    Size: "text-7xl",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  autoGen3: {
    Usage: "Auto-generated style for text-xl",
    Size: "text-xl",
    Weight: "font-semibold",
    Color: "text-foreground",
  },
  autoGen4: {
    Usage: "Auto-generated style for text-base",
    Size: "text-base",
    Weight: "font-bold",
    Color: "text-white",
  },
  autoGen5: {
    Usage: "Auto-generated style for text-2xl",
    Size: "text-2xl",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  autoGen6: {
    Usage: "Auto-generated style for text-lg",
    Size: "text-lg",
    Weight: "",
    Color: "text-foreground",
  },
  autoGen7: {
    Usage: "Auto-generated style for text-lg",
    Size: "text-lg",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  autoGen8: {
    Usage: "Auto-generated style for text-xl",
    "Font-Family": "font-display",
    Size: "text-xl",
    Weight: "",
    Color: "text-foreground",
  },
  autoGen9: {
    Usage: "Auto-generated style for text-lg",
    "Font-Family": "font-display",
    Size: "text-lg",
    Weight: "",
    Color: "text-foreground",
  },
  autoGen10: {
    Usage: "Auto-generated style for text",
    Size: "",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  autoGen11: {
    Usage: "Auto-generated style for text-xs",
    "Font-Family": "font-sans",
    Size: "text-xs",
    Weight: "",
    Color: "text-mutedForeground",
  },
  autoGen12: {
    Usage: "Auto-generated style for text-sm",
    Size: "text-sm",
    Weight: "font-medium",
    LetterSpacing: "tracking-wide",
    Color: "text-foreground",
  },
  autoGen13: {
    Usage: "Auto-generated style for text-xs",
    Size: "text-xs",
    Weight: "font-bold",
    LetterSpacing: "tracking-wider",
    Color: "",
  },
  autoGen14: {
    Usage: "Auto-generated style for text-base",
    "Font-Family": "font-display",
    Size: "text-base",
    Weight: "font-semibold",
    LetterSpacing: "tracking-wide",
    Color: "",
  },
  autoGen15: {
    Usage: "Auto-generated style for text-xs",
    Size: "text-xs",
    Weight: "font-semibold",
    LetterSpacing: "tracking-wide",
    Color: "text-mutedForeground",
  },
  autoGen16: {
    Usage: "Auto-generated style for text-[15px]",
    "Font-Family": "font-sans",
    Size: "text-[15px]",
    Weight: "",
    Color: "",
  },
  autoGen17: {
    Usage: "Auto-generated style for text-xs",
    Size: "text-xs",
    Weight: "font-medium",
    Color: "text-mutedForeground",
  },
  autoGen18: {
    Usage: "Auto-generated style for text-sm",
    "Font-Family": "font-display",
    Size: "text-sm",
    Weight: "font-medium",
    LetterSpacing: "tracking-widest",
    Color: "",
  },
  autoGen19: {
    Usage: "Auto-generated style for text-xs",
    "Font-Family": "font-display",
    Size: "text-xs",
    Weight: "font-bold",
    Color: "",
  },
  autoGen20: {
    Usage: "Auto-generated style for text-2xl",
    "Font-Family": "font-sans",
    Size: "text-2xl",
    Weight: "",
    Color: "",
  },
  autoGen21: {
    Usage: "Auto-generated style for text-[12px]",
    Size: "text-[12px]",
    Weight: "font-semibold",
    LetterSpacing: "tracking-wide",
    Color: "text-mutedForeground",
  },
  autoGen22: {
    Usage: "Auto-generated style for text-[15px]",
    Size: "text-[15px]",
    Weight: "font-medium",
    LetterSpacing: "tracking-wide",
    Color: "text-foreground",
  },
  autoGen23: {
    Usage: "Auto-generated style for text-[13px]",
    "Font-Family": "font-sans",
    Size: "text-[13px]",
    Weight: "",
    Color: "text-mutedForeground",
  },
  autoGen24: {
    Usage: "Auto-generated style for text-base",
    "Font-Family": "font-display",
    Size: "text-base",
    Weight: "font-bold",
    Color: "",
  },
  autoGen25: {
    Usage: "Auto-generated style for text-base",
    "Font-Family": "font-display",
    Size: "text-base",
    Weight: "font-bold",
    LetterSpacing: "tracking-wide",
    Color: "",
  },
  autoGen26: {
    Usage: "Auto-generated style for text-2xl",
    "Font-Family": "font-display",
    Size: "text-2xl",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  autoGen27: {
    Usage: "Auto-generated style for text-[clamp(0.85rem,3.5vw,1.25rem)]",
    Size: "text-[clamp(0.85rem,3.5vw,1.25rem)]",
    Weight: "font-bold",
    Color: "",
  },
  autoGen28: {
    Usage: "Auto-generated style for text",
    Size: "",
    Weight: "font-bold",
    Color: "",
  },
  autoGen29: {
    Usage: "Auto-generated style for text-sm",
    Size: "text-sm",
    Weight: "font-semibold",
    Color: "",
  },
  autoGen30: {
    Usage: "Auto-generated style for text-xs",
    Size: "text-xs",
    Weight: "font-bold",
    Color: "text-foreground",
  },
  autoGen31: {
    Usage: "Auto-generated style for text-sm",
    Size: "text-sm",
    Weight: "font-medium",
    LetterSpacing: "tracking-wide",
    Color: "",
  },
  autoGen32: {
    Usage: "Auto-generated style for text-sm",
    "Font-Family": "font-display",
    Size: "text-sm",
    Weight: "font-medium",
    LetterSpacing: "tracking-widest",
    Color: "text-foreground",
  },
} as const satisfies Record<string, TextStyleConfig>;

export type TextVariant = keyof typeof TEXT_STYLE_CONFIG;

export function textClass(variant: TextVariant, extra = ""): string {
  const config: TextStyleConfig = TEXT_STYLE_CONFIG[variant];
  const {
    "Font-Family": font,
    Size: size,
    Weight: weight,
    LetterSpacing: tracking,
    Color: color,
  } = config;
  return [font, size, weight, tracking, color, extra].filter(Boolean).join(" ");
}

export interface TextProps extends Omit<RNTextProps, "className"> {
  variant?: TextVariant;
  className?: string;
  children?: ReactNode;
}

export function Text({ variant = "body", className = "", ...rest }: TextProps) {
  return <RNText className={textClass(variant, className)} {...rest} />;
}
