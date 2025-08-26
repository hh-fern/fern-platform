import { useState } from "react";

import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { useCurrentEditor } from "@tiptap/react";
import { GripVertical, Plus } from "lucide-react";

export default function NodeHoverHandle() {
  const { editor } = useCurrentEditor();
  const [currentNode, setCurrentNode] = useState<{ pos: number } | null>(null);

  if (!editor) return null;

  const handleAddNodeBelow = () => {
    if (!editor || !currentNode) return;

    // Find the node at the current position
    const node = editor.state.doc.nodeAt(currentNode.pos);
    if (!node) return;

    // Find the position after the current hovered node
    const nodeEnd = currentNode.pos + node.nodeSize;

    // Insert a new paragraph after the current node and add "/" to trigger the floating menu
    editor
      .chain()
      .focus()
      .insertContentAt(nodeEnd, {
        type: "paragraph",
        content: [{ type: "text", text: "/" }],
      })
      .setTextSelection(nodeEnd + 2) // Position cursor after the "/"
      .run();
  };

  return (
    <DragHandle
      editor={editor}
      onNodeChange={({ pos }) => {
        setCurrentNode({ pos });
      }}
    >
      <div className="mr-2 flex cursor-grab flex-row items-center">
        <button
          onClick={handleAddNodeBelow}
          className="flex cursor-pointer items-center justify-center rounded-md p-1.5 hover:bg-gray-500/40"
          title="Insert new paragraph below"
        >
          <Plus className="text-muted-foreground" size={16} />
        </button>
        <div className="flex cursor-grab flex-col items-center rounded-md p-1.5 hover:bg-gray-500/40">
          <GripVertical className="text-muted-foreground" size={16} />
        </div>
      </div>
    </DragHandle>
  );
}
