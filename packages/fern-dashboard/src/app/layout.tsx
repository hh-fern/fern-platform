import { getCurrentSession } from "@fern-dashboard/services/auth/getCurrentSession";
import type { Metadata } from "next";
import { HIDE_PYLON_CLASS_NAME } from "@/components/pylon/constants";
import { PylonScript } from "@/components/pylon/PylonScript";
import { applyOrgMappings } from "@/orgMappings";
import { cn } from "@/utils/utils";
import { gtPlanar } from "./fonts";
import { RootProviders } from "./providers";

import "./globals.css";

export const metadata: Metadata = {
    title: "Fern Dashboard"
};

export default async function RootLayout({
    children
}: Readonly<{
    children: React.JSX.Element;
}>) {
    const session = await getCurrentSession();

    await applyOrgMappings();

    return (
        <html lang="en" suppressHydrationWarning className={gtPlanar.className}>
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.0/styles/atom-one-dark.min.css"
                ></link>
            </head>
            <PylonScript />
            <body
                // id is used to remove the hidePylon class programatically
                id="body"
                className={cn("flex h-[calc(100dvh)] antialiased", HIDE_PYLON_CLASS_NAME)}
            >
                <RootProviders session={session}>{children}</RootProviders>
            </body>
        </html>
    );
}
