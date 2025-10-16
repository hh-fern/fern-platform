"use client";

import { useEffect } from "react";
import GradientExclamation from "@fern-docs/components/GradientExclamation";

export default function ErrorBoundary({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        console.error(`[domain-error-boundary] ${JSON.stringify(error)}`);
    }, [error]);

    return (
        <div className="flex h-[calc(100svh-var(--header-height)-6rem)] w-screen flex-col items-center justify-center gap-6">
            <GradientExclamation />
            <div className="flex flex-col text-center">
                <h1>Page not found!</h1>
                <p className="text-(color:--grayscale-a9)">
                    We&apos;re sorry, we couldn&apos;t find the page you were looking for.
                </p>
            </div>
        </div>
    );
}
