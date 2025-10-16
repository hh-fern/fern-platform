import { DEFAULT_LOGO_HEIGHT } from "@fern-api/docs-utils";
import type { LogoConfiguration } from "@fern-api/docs-utils/types/logo-configuration";
import React from "react";
import { cn } from "../cn";
import { FernImage } from "../FernImage";

export interface AbstractLogoProps {
    logo: LogoConfiguration;
    alt?: string;
    onError?: (theme: "light" | "dark", src: string) => void;
}

export function AbstractLogo({ logo, alt, onError }: AbstractLogoProps) {
    const { light, dark, height } = logo;
    const [revalidationTriggered, setRevalidationTriggered] = React.useState(false);

    const style = {
        height: height ?? DEFAULT_LOGO_HEIGHT,
        width: "auto"
    };

    const handleLogoError = React.useCallback(
        (theme: "light" | "dark", src: string) => {
            onError?.(theme, src);

            if (!revalidationTriggered) {
                setRevalidationTriggered(true);
                triggerRevalidation();
            }
        },
        [onError, revalidationTriggered]
    );

    return (
        <>
            {light && (
                <FernImage
                    className={cn("max-h-full object-contain max-md:!max-h-8", {
                        "block dark:hidden": !!dark
                    })}
                    alt={alt ?? light.alt ?? "Logo"}
                    src={light.src}
                    height={light.height}
                    width={light.width}
                    blurDataURL={light.blurDataURL}
                    priority
                    loading="eager"
                    quality={100}
                    style={style}
                    onError={() => handleLogoError("light", light.src)}
                />
            )}
            {dark && (
                <FernImage
                    className={cn("max-h-full object-contain max-md:!max-h-8", {
                        "hidden dark:block": !!light
                    })}
                    alt={alt ?? dark.alt ?? "Logo"}
                    src={dark.src}
                    height={dark.height}
                    width={dark.width}
                    blurDataURL={dark.blurDataURL}
                    priority
                    loading="eager"
                    quality={100}
                    style={style}
                    onError={() => handleLogoError("dark", dark.src)}
                />
            )}
        </>
    );
}

function triggerRevalidation(): void {
    if (typeof window === "undefined") {
        return;
    }

    fetch("/api/fern-docs/revalidate", {
        method: "GET",
        headers: {
            "Cache-Control": "no-cache"
        }
    }).catch((error) => {
        console.warn("Failed to trigger revalidation:", error);
    });
}
