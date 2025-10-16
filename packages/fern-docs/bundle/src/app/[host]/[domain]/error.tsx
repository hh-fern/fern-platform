"use client";

import { FernButton } from "@fern-docs/components/FernButton";
import GradientExclamation from "@fern-docs/components/GradientExclamation";
import { HiddenSidebar } from "@fern-docs/components/theming/HiddenSidebar";
import { useEffect } from "react";

import { NotFound404Tracker } from "@/components/analytics/NotFound404Tracker";
import ReturnHomeButton from "@/components/ReturnHomeButton";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(`[domain-error-boundary] ${JSON.stringify(error)}`);
    }, [error]);

    return (
        <>
            <NotFound404Tracker />
            <HiddenSidebar />
            <div className="flex h-[calc(100svh-var(--header-height)-6rem)] w-screen flex-col items-center justify-center gap-6">
                <GradientExclamation />
                <div className="flex flex-col text-center">
                    <h1>We&apos;ve encountered an error!</h1>
                    <p className="text-(color:--grayscale-a9)">Please try again. If the problem persists, contact support.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <FernButton intent="primary" onClick={reset}>
                        Try again
                    </FernButton>
                    <ReturnHomeButton />
                </div>
            </div>
        </>
    );
}
