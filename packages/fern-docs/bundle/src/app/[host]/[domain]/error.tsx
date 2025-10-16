"use client";

import GradientExclamation from "@fern-docs/components/GradientExclamation";
import { useEffect } from "react";

import { NotFound404Tracker } from "@/components/analytics/NotFound404Tracker";
import ReturnHomeButton from "@/components/ReturnHomeButton";

export default function ErrorBoundary({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        console.error(`[domain-error-boundary] ${JSON.stringify(error)}`);
    }, [error]);

    return (
        <>
            <NotFound404Tracker />
            <div className="flex h-[calc(100svh-var(--header-height)-6rem)] w-screen flex-col items-center justify-center gap-6">
                <GradientExclamation />
                <div className="flex flex-col text-center">
                    <h1>Page not found!</h1>
                    <p className="text-(color:--grayscale-a9)">
                        We&apos;re sorry, we couldn&apos;t find the page you were looking for.
                    </p>
                </div>
                <ReturnHomeButton />
            </div>
        </>
    );
}
