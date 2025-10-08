import { useEffect, useRef } from "react";

export default function MonacoEditor({
    currentMarkdown,
    handleEditorDidMount,
    isEditingDisabled
}: {
    currentMarkdown: string;
    handleEditorDidMount: (editor: any, monacoInstance: any) => void;
    isEditingDisabled: boolean;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let mounted = true;

        // Dynamically import monaco
        import("modern-monaco").then((monaco) => {
            if (!mounted || !containerRef.current) return;

            // Create editor instance
            const editor = monaco.editor.create(containerRef.current, {
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
            mounted = false;
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

    return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
