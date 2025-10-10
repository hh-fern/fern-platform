"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Monaco Editor Playground using server-side rendering
 * Based on: https://github.com/pi0/modern-monaco-demo
 */
export function ModernMonacoPlayground() {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [editorValue, setEditorValue] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);

    const initialCode = `console.log('Hello, world!');

// Try editing this code!
function greet(name) {
  return \`Hello, \${name}!\`;
}

greet('Fern');`;

    useEffect(() => {
        // Listen for messages from the iframe
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === "monaco-value-change") {
                setEditorValue(event.data.value);
            }
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    useEffect(() => {
        setEditorValue(initialCode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only set initial value once

    return (
        <div className="flex w-full flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">Monaco Editor Playground</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Edit code with instant Shiki syntax highlighting (SSR mode)
                </p>
            </div>

            <iframe
                ref={iframeRef}
                src={`/api/monaco-editor?code=${encodeURIComponent(initialCode)}&language=javascript&theme=material-theme-darker`}
                className="h-[500px] w-full rounded-lg border border-gray-200 dark:border-gray-700"
                onLoad={() => setIsLoaded(true)}
                title="Monaco Editor"
            />

            <div className="text-xs text-gray-500">
                {isLoaded ? `Characters: ${editorValue.length}` : "Loading editor..."}
            </div>
        </div>
    );
}
