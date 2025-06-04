"use client";

import { DocumentTextIcon } from "@heroicons/react/24/outline";
import {
  BubbleMenu,
  EditorEvents,
  EditorProvider,
  FloatingMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// Configure Tiptap extensions
const extensions = [StarterKit];

// TEMP: hard-coded initial content, will be replaced with content from the docs site
const initialContent = `<h1>Conversational AI Overview</h1>

<h2>Deploy customized, conversational voice agents in minutes.</h2>

<h2>What is Conversational AI?</h2>
<p>
ElevenLabs Conversational AI is a platform for deploying customized, conversational voice agents. 
Built in response to our customers’ needs, our platform eliminates months of development time 
typically spent building conversation stacks from scratch. It combines these building blocks:
</p>

<h3>Speech to text</h3>
<p>Our fine tuned ASR model that transcribes the caller’s dialogue.</p>

<h3>Language model</h3>
<p>Choose from Gemini, Claude, OpenAI and more, or bring your own.</p>

<h3>Text to speech</h3>
<p>Our low latency, human-like TTS across 5k+ voices and 31 languages.</p>

<h3>Turn taking model</h3>
<p>Our custom turn taking model that understands when to speak, like a human would.</p>

<p>
Altogether it is a highly composable AI Voice agent solution that can scale to thousands of calls per day. 
With server & client side tools, knowledge bases, dynamic agent instantiation and overrides, plus built-in monitoring, 
it’s the complete developer toolkit.
</p>`;

export declare namespace Editor {
  export interface Props {
    className?: string;
    disableFloatingMenu?: boolean;
    disableBubbleMenu?: boolean;
  }
}

// SEE: https://tiptap.dev/docs/editor/getting-started/install/react
export default function Editor({
  className,
  disableFloatingMenu,
  disableBubbleMenu,
}: Editor.Props) {
  // TEMP: will eventually be used to submit updates to the markdown serializer
  function onUpdate(props: EditorEvents["update"]) {
    console.log(props);
  }

  return (
    <EditorProvider
      extensions={extensions}
      content={initialContent}
      editorProps={{
        attributes: {
          class: "prose prose-md m-5 focus:outline-none",
        },
      }}
      editorContainerProps={{ className }}
      onUpdate={onUpdate}
    >
      {!disableFloatingMenu && <EditorFloatingMenu />}
      {!disableBubbleMenu && <EditorBubbleMenu />}
    </EditorProvider>
  );
}

function EditorFloatingMenu() {
  return (
    <FloatingMenu editor={null} tippyOptions={{ placement: "auto-start" }}>
      <div className="border-1 flex min-w-60 flex-col border-gray-500 bg-white p-2 text-gray-900 shadow-sm">
        <FloatingMenuHeading title="Basics" />
        <FloatingMenuItem title="Text" icon={<DocumentTextIcon />} />
        <FloatingMenuItem title="Heading 1" icon={<DocumentTextIcon />} />
        <FloatingMenuItem title="Heading 2" icon={<DocumentTextIcon />} />
        <FloatingMenuItem title="Heading 3" icon={<DocumentTextIcon />} />
        <FloatingMenuItem title="Bulleted list" icon={<DocumentTextIcon />} />
        <FloatingMenuItem title="Numbered list" icon={<DocumentTextIcon />} />
        <FloatingMenuItem title="Quote" icon={<DocumentTextIcon />} />
        <FloatingMenuItem title="Link" icon={<DocumentTextIcon />} />
      </div>
    </FloatingMenu>
  );
}

declare namespace FloatingMenuHeading {
  export interface Props {
    title: string;
  }
}

function FloatingMenuHeading({ title }: FloatingMenuHeading.Props) {
  return <div className="p-1 text-sm font-medium uppercase">{title}</div>;
}

declare namespace FloatingMenuItem {
  export interface Props {
    title: string;
    icon: React.ReactNode;
  }
}

function FloatingMenuItem({ title, icon }: FloatingMenuItem.Props) {
  return (
    <button className="flex cursor-pointer items-center gap-2 p-1 hover:bg-gray-500">
      <div className="size-4">{icon}</div>
      <div className="text-md font-medium">{title}</div>
    </button>
  );
}

function EditorBubbleMenu() {
  return (
    <BubbleMenu editor={null}>
      <div className="border-1 flex items-center gap-1 border-gray-500 bg-white p-2 text-gray-900 shadow-sm">
        <BubbleMenuItem icon={<DocumentTextIcon />} />
        <BubbleMenuSeparator />
        <BubbleMenuItem icon={<DocumentTextIcon />} />
        <BubbleMenuItem icon={<DocumentTextIcon />} />
        <BubbleMenuItem icon={<DocumentTextIcon />} />
        <BubbleMenuItem icon={<DocumentTextIcon />} />
        <BubbleMenuItem icon={<DocumentTextIcon />} />
        <BubbleMenuItem icon={<DocumentTextIcon />} />
        <BubbleMenuSeparator />
        <BubbleMenuItem icon={<DocumentTextIcon />} />
        <BubbleMenuItem icon={<DocumentTextIcon />} />
      </div>
    </BubbleMenu>
  );
}

declare namespace BubbleMenuItem {
  export interface Props {
    icon: React.ReactNode;
  }
}

function BubbleMenuItem({ icon }: BubbleMenuItem.Props) {
  return (
    <button className="flex cursor-pointer items-center gap-2 p-1 hover:bg-gray-500">
      <div className="size-4">{icon}</div>
    </button>
  );
}

function BubbleMenuSeparator() {
  return <div>|</div>;
}
