"use client";

import type { Auth0SessionData } from "@fern-dashboard/services/auth/getCurrentSession";
import { VisualEditorApiClientProvider } from "@fern-dashboard/visual-editor/client/providers";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { Toaster } from "@/components/ui/sonner";
import { AnimatedNoiseProvider } from "@/providers/AnimatedNoiseProvider";
import { PostHogProvider } from "@/providers/PosthogProvider";
import { ProgressProvider } from "@/providers/ProgressProvider";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { DashboardApiClient } from "./services/dashboard-api/client";

export function RootProviders({
    children,
    session
}: {
    children: React.JSX.Element;
    session: Auth0SessionData | undefined;
}) {
    return (
        <VisualEditorApiClientProvider value={DashboardApiClient}>
            <AnimatedNoiseProvider>
                <NoiseOverlay />

                <Analytics />
                <SpeedInsights />

                <ReactQueryProvider>
                    <PostHogProvider session={session}>
                        <ProgressProvider>{children}</ProgressProvider>
                    </PostHogProvider>
                </ReactQueryProvider>
            </AnimatedNoiseProvider>
            <Toaster
                position="top-center"
                richColors
                toastOptions={{
                    classNames: {
                        icon: "!w-auto",
                        success: "!bg-green-300 !border-green-600 !text-primary",
                        content: "min-w-0"
                    }
                }}
                icons={{
                    success: <CheckCircleIcon className="text-primary size-6" />
                }}
            />
        </VisualEditorApiClientProvider>
    );
}
