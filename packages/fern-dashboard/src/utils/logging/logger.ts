import * as Sentry from "@sentry/nextjs";

import { isProduction } from "../environment";
import { DashboardError } from "./errors";

export class FernLogger {
  static info(message: string, metadata: Record<string, any>) {
    this.log({
      level: "info",
      message,
      metadata,
    });
  }

  static warn(message: string, metadata: Record<string, any>) {
    this.log({
      level: "warn",
      message,
      metadata,
    });
  }

  static error(
    message: DashboardError,
    rawError?: any,
    metadata?: Record<string, any>
  ) {
    this.log({
      level: "error",
      message,
      metadata: {
        ...metadata,
        rawError,
      },
    });
  }

  static debug(message: string, metadata: Record<string, any>) {
    // Don't log debug messages in production
    if (isProduction()) {
      return;
    }

    this.log({
      level: "debug",
      message,
      metadata,
    });
  }

  private static log({
    level,
    message,
    metadata,
  }: {
    level: "debug" | "info" | "warn" | "error";
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    Sentry.logger[level](message, metadata);
    // Only log to console in non-production environments
    if (!isProduction()) {
      console[level](message, metadata);
    }
  }
}
