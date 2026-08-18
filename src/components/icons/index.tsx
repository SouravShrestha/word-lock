import * as React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const createIcon = (defaultContent: React.ReactNode) => {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 24, className, children, ...props }, ref) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {defaultContent}
        {children}
      </svg>
    ),
  );
  Icon.displayName = "Icon";
  return Icon;
};

export const Copy = createIcon(
  <>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>,
);

export const Check = createIcon(<polyline points="20 6 9 17 4 12" />);

export const X = createIcon(
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
);

export const Delete = createIcon(
  <>
    <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
    <line x1="18" x2="12" y1="9" y2="15" />
    <line x1="12" x2="18" y1="9" y2="15" />
  </>,
);

export const RotateCcw = createIcon(
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </>,
);

export const Moon = createIcon(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);

export const Sun = createIcon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </>,
);

export const ChevronDown = createIcon(<path d="m6 9 6 6 6-6" />);
export const ChevronDownIcon = ChevronDown;

export const ChevronRight = createIcon(<path d="m9 18 6-6-6-6" />);
export const ChevronRightIcon = ChevronRight;

export const ChevronLeft = createIcon(<path d="m15 18-6-6 6-6" />);
export const ChevronLeftIcon = ChevronLeft;

export const ChevronUp = createIcon(<path d="m18 15-6-6-6 6" />);
export const ChevronUpIcon = ChevronUp;

export const Search = createIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </>,
);

export const Circle = createIcon(<circle cx="12" cy="12" r="10" />);

export const Minus = createIcon(<path d="M5 12h14" />);

export const Volume2 = createIcon(
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </>,
);

export const VolumeX = createIcon(
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" x2="16" y1="9" y2="15" />
    <line x1="16" x2="22" y1="9" y2="15" />
  </>,
);
