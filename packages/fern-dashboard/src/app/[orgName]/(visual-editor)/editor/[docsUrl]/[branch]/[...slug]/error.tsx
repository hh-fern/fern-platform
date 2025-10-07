"use client";

import { UnsupportedContent } from "@/components/editor/UnsupportedContent";

export default function Error({ error }: { error: Error }) {
    // TODO: We should make this error message more specific to the error thrown. Right now this
    // is a catch-all for any error that occurs in the editor's markdown page.
    console.error("[error.tsx] Error caught in error boundary:", error);
    console.error("[error.tsx] Error message:", error.message);
    console.error("[error.tsx] Error stack:", error.stack);
    return (
        <div className="w-content-width mx-auto mt-12">
            <div>
                <UnsupportedContent>
                    This file contains markdown that is not yet readable by the editor.
                    <br />
                    <br />
                    <details className="text-xs text-gray-600">
                        <summary>Error details</summary>
                        <pre className="mt-2">{error.message}</pre>
                    </details>
                </UnsupportedContent>
            </div>
        </div>
    );
}
