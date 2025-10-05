"use client";

import type { MDXComponents } from "@fern-docs/mdx";
import { NodeViewWrapper } from "@tiptap/react";
import type { ComponentProps } from "react";
import { UnsupportedContent } from "@/client/components/editor/UnsupportedContent";
import { ErrorBoundary, ErrorBoundaryFallback } from "@/client/docs/components/error-boundary";
import { Embed } from "@/client/editor/components/Embed";
import { Accordion, AccordionGroup } from "./accordion/AccordionGroup";
import { Availability } from "./availability/Availability";
import { Badge } from "./badge/Badge";
import { Bleed } from "./bleed/Bleed";
import { Button } from "./button/Button";
import { ButtonGroup } from "./button/ButtonGroup";
import {
    Callout,
    CheckCallout,
    ErrorCallout,
    InfoCallout,
    LaunchNoteCallout,
    NoteCallout,
    SuccessCallout,
    TipCallout,
    WarningCallout
} from "./callout/Callout";
import { Card } from "./card/Card";
import { CardGroup } from "./card/CardGroup";
import { ClientLibraries } from "./client-libraries/ClientLibraries";
import { CodeBlock } from "./code/CodeBlock";
import { CodeBlocks } from "./code/CodeBlocks";
import { CodeGroup } from "./code/CodeGroup";
import { Template } from "./code/Template";
import { Column, ColumnGroup } from "./columns/ColumnGroup";
import { Feature } from "./feature";
import { Frame } from "./frame/Frame";
import { A, HeadingRenderer, Image, Li, Ol, Strong, Ul } from "./html";
import { Table } from "./html-table/Table";
import { Icon } from "./icon/Icon";
import { If } from "./if/If";
import { Json } from "./json/JSON";
import { Mermaid } from "./mermaid/Mermaid";
import { ParamField } from "./parameters/ParamField";
import { EndpointRequestSnippet } from "./snippets/EndpointRequestSnippet";
import { EndpointResponseSnippet } from "./snippets/EndpointResponseSnippet";
import { EndpointSchemaSnippet } from "./snippets/EndpointSchemaSnippet";
import { Step } from "./steps/Step";
import { StepGroup } from "./steps/Steps";
// import { EndpointRequestSnippet, EndpointResponseSnippet } from "./snippets";
// import { EndpointSchemaSnippet } from "./snippets/EndpointSchemaSnippet";
import { Tab, TabGroup } from "./tabs/Tabs";

// const ElevenLabsWaveform = dynamic(
//   () => import("./waveform/WaveformComplex").then((mod) => mod.default),
//   { ssr: false, loading: () => <div className="h-[400px]" /> } // prevent layout shift
// );

const FERN_COMPONENTS = {
    Accordion,
    AccordionGroup,
    Availability,
    Badge,
    Bleed,
    Button,
    ButtonGroup,
    Callout,
    Card,
    CardGroup,
    ClientLibraries,
    CodeBlock,
    CodeGroup,
    Column,
    ColumnGroup,
    // Download,
    EndpointRequestSnippet,
    EndpointResponseSnippet,
    EndpointSchemaSnippet,
    Feature,
    Frame,
    Icon,
    If,
    Json,
    Mermaid,
    ParamField,
    Step,
    Steps: StepGroup,
    Tab,
    TabGroup,
    Template,
    // Tooltip,
    // TwoSlash,
    // callout aliases
    Info: InfoCallout,
    Warning: WarningCallout,
    Success: SuccessCallout,
    Error: ErrorCallout,
    Note: NoteCallout,
    Tip: TipCallout,
    Check: CheckCallout,
    LaunchNote: LaunchNoteCallout
};

// internal-use only
const INTERNAL_COMPONENTS = {
    ErrorBoundary,
    ElevenLabsWaveform: () => (
        <NodeViewWrapper>
            <UnsupportedContent>ElevenLabsWaveform is not supported in the editor.</UnsupportedContent>
        </NodeViewWrapper>
    ),

    /**
     * deprecated but kept for backwards compatibility
     */
    Cards: CardGroup,
    CodeBlocks,
    Tabs: TabGroup
};

const HTML_COMPONENTS = {
    a: A,
    h1: (props: ComponentProps<"h1">) => HeadingRenderer(1, props),
    h2: (props: ComponentProps<"h2">) => HeadingRenderer(2, props),
    h3: (props: ComponentProps<"h3">) => HeadingRenderer(3, props),
    h4: (props: ComponentProps<"h4">) => HeadingRenderer(4, props),
    h5: (props: ComponentProps<"h5">) => HeadingRenderer(5, props),
    h6: (props: ComponentProps<"h6">) => HeadingRenderer(6, props),
    img: "img",
    li: Li,
    ol: Ol,
    strong: Strong,
    table: Table,
    ul: Ul,
    video: "video",
    iframe: "iframe",
    canvas: "canvas",
    embed: "embed",
    br: "br"
};

const ALIASED_HTML_COMPONENTS = {
    A,
    H1: (props: ComponentProps<"h1">) => HeadingRenderer(1, props),
    H2: (props: ComponentProps<"h2">) => HeadingRenderer(2, props),
    H3: (props: ComponentProps<"h3">) => HeadingRenderer(3, props),
    H4: (props: ComponentProps<"h4">) => HeadingRenderer(4, props),
    H5: (props: ComponentProps<"h5">) => HeadingRenderer(5, props),
    H6: (props: ComponentProps<"h6">) => HeadingRenderer(6, props),
    Image,
    Li,
    Ol,
    Strong,
    Table,
    Ul,
    Embed
};

export const MDX_COMPONENTS = {
    ...FERN_COMPONENTS,
    ...INTERNAL_COMPONENTS,
    ...HTML_COMPONENTS,
    ...ALIASED_HTML_COMPONENTS
} as unknown as MDXComponents;

export function createMdxComponents(jsxElements: string[]): MDXComponents {
    return {
        // spread in jsx elements that may be unsupported
        // TODO: fix this type, any is used here just to get this working
        ...jsxElements.reduce<Record<string, any>>((acc, jsxElement) => {
            acc[jsxElement] = () => (
                <ErrorBoundaryFallback error={new Error(`Unsupported JSX tag: <${jsxElement} />`)} />
            );
            return acc;
        }, {}),
        // then, spread in the supported components
        ...MDX_COMPONENTS
    };
}
