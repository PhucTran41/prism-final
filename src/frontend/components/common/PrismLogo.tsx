import * as React from "react";
import Image from "next/image";

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
		<span className={`inline-flex items-center gap-2 ${className ?? "text-primary"}`}>
			<Image
				src="/logos/prism.svg"
				alt="Prism logo"
				width={size}
				height={size}
				priority={false}
			/>
      {withWordmark ? (
        <span className={wordmarkClassName ?? "text-sm font-semibold tracking-tight"}>
          Prism
        </span>
      ) : null}
    </span>
  );
}


