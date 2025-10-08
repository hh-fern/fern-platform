import * as monaco from "modern-monaco";
import { useEffect, useRef } from "react";

export default function MonacoEditor({
    currentMarkdown,
    handleEditorDidMount,
    isEditingDisabled
}: {
    currentMarkdown: string;
    handleEditorDidMount: (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => void;
    isEditingDisabled: boolean;
}) {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
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

        // Cleanup on unmount
        return () => {
            editor.dispose();
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

    return <div ref={editorRef} style={{ height: "100%", width: "100%" }} />;
}
