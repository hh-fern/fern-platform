"use client";

import { ComponentPropsWithoutRef, forwardRef } from "react";

import { cn } from "./cn";

export interface FernProgressProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * The total value
   */
  total: number;
  /**
   * The used value
   */
  used: number;
  /**
   * The unit to display next to the progress bar
   */
  unit?: string;
}

export const FernProgress = forwardRef<HTMLDivElement, FernProgressProps>(
  function FernProgress(
    { total, used, unit = "normal", className, ...props },
    ref
  ) {
    const progressValue = Math.max(total - used, 0);
    const percentage = (progressValue / total) * 100;

    return (
      <div className="fern-progress-container">
        <div
          ref={ref}
          className={cn("fern-progress", className)}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={progressValue}
          {...props}
        >
          <div
            className="fern-progress-bar"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
        <div className="fern-progress-text">
          <span className="fern-progress-used">{progressValue}</span>
          <span className="fern-progress-separator">/</span>
          <span className="fern-progress-total">{total}</span>
          {unit && <span className="fern-progress-unit">{unit}</span>}
        </div>
      </div>
    );
  }
);

FernProgress.displayName = "FernProgress";
