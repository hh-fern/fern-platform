const levels = ["log", "debug", "info", "warn", "error"] as const;

type Level = (typeof levels)[number];

// Next.js automatically sets NODE_ENV during build
const isProduction = () => process.env.NODE_ENV === "production";

export const DebugLogger = levels.reduce(
  (acc, level) => {
    acc[level] = (...args: Parameters<(typeof console)[Level]>) => {
      if (!isProduction()) {
        console[level]("[DEBUG]", ...args);
      }
    };
    return acc;
  },
  {} as Record<Level, (typeof console)[Level]>
);
