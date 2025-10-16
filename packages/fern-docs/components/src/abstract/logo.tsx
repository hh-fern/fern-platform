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

function getLogoCacheKey(theme: "light" | "dark"): string {
    if (typeof window === "undefined") {
        return "";
    }
    return `fern-logo-cache-${theme}-${window.location.host}`;
}

function getCachedLogo(theme: "light" | "dark"): string | null {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return null;
    }
    try {
        return localStorage.getItem(getLogoCacheKey(theme));
    } catch {
        return null;
    }
}

function cacheLogo(theme: "light" | "dark", src: string): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return;
    }
    try {
        localStorage.setItem(getLogoCacheKey(theme), src);
    } catch {}
}

export function AbstractLogo({ logo, alt, onError }: AbstractLogoProps) {
    const { light, dark, height } = logo;
    const [lightSrc, setLightSrc] = React.useState(light?.src);
    const [darkSrc, setDarkSrc] = React.useState(dark?.src);
    const [revalidationTriggered, setRevalidationTriggered] = React.useState(false);

    const style = {
        height: height ?? DEFAULT_LOGO_HEIGHT,
        width: "auto"
    };

    React.useEffect(() => {
        if (light?.src) {
            cacheLogo("light", light.src);
        }
    }, [light?.src]);

    React.useEffect(() => {
        if (dark?.src) {
            cacheLogo("dark", dark.src);
        }
    }, [dark?.src]);

    const handleLogoError = React.useCallback(
        (theme: "light" | "dark", src: string) => {
            onError?.(theme, src);

            const cachedSrc = getCachedLogo(theme);
            if (cachedSrc && cachedSrc !== src) {
                if (theme === "light") {
                    setLightSrc(cachedSrc);
                } else {
                    setDarkSrc(cachedSrc);
                }
            } else if (!revalidationTriggered) {
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
                    src={lightSrc ?? light.src}
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
                    src={darkSrc ?? dark.src}
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
