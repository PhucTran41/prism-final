import * as React from "react";

type PrismLogoProps = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
};

export function PrismLogo({
  size = 24,
  withWordmark = false,
  className,
  wordmarkClassName,
}: PrismLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Triangular prism outline */}
        <path
          d="M12 3L3 19h18L12 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Inner facet lines */}
        <path
          d="M12 3v16M3 19l9-5m9 5l-9-5"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.2"
        />
      </svg>
      {withWordmark ? (
        <span className={wordmarkClassName ?? "text-sm font-semibold tracking-tight"}>
          Prism
        </span>
      ) : null}
    </span>
  );
}


