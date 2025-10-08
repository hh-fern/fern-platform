import { useEffect, useRef, useState } from "react";

export default function MonacoEditor({
    currentMarkdown,
    handleEditorDidMount,
    isEditingDisabled
}: {
    currentMarkdown: string;
    handleEditorDidMount: (editor: any, monacoInstance: any) => void;
    isEditingDisabled: boolean;
}) {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Dynamically import monaco
        import("modern-monaco").then((monaco) => {
            setIsLoaded(true);
            if (!editorRef.current) return;

            // Create editor instance
            const editor = monaco.editor.create(editorRef.current, {
                value: currentMarkdown,
                language: "markdown",
                theme: "app-theme",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                readOnly: isEditingDisabled
            });

            editorInstanceRef.current = editor;

            // Call the mount handler
            handleEditorDidMount(editor, monaco);
        });

        // Cleanup on unmount
        return () => {
            if (editorInstanceRef.current) {
                editorInstanceRef.current.dispose();
            }
        };
    }, []);

    // Update value when currentMarkdown changes
    useEffect(() => {
        if (editorInstanceRef.current && editorInstanceRef.current.getValue() !== currentMarkdown) {
            editorInstanceRef.current.setValue(currentMarkdown);
        }
    }, [currentMarkdown]);

    // Update readOnly option when isEditingDisabled changes
    useEffect(() => {
        if (editorInstanceRef.current) {
            editorInstanceRef.current.updateOptions({ readOnly: isEditingDisabled });
        }
    }, [isEditingDisabled]);

    if (!isLoaded) {
        return <div style={{ height: "100%", width: "100%" }} className="flex items-center justify-center">Loading editor...</div>;
    }

    return <div ref={editorRef} style={{ height: "100%", width: "100%" }} />;
}
