import { type ComponentProps } from "react";

import { Sparkles } from "lucide-react";

import * as Command from "../cmdk";
import { useSearchBox } from "../search/useSearchBox";

export function CommandAskAIGroup({
  ref,
  onAskAI,
  ...props
}: { onAskAI: (initialInput: string) => void } & ComponentProps<
  typeof Command.Group
>): JSX.Element {
  const { query } = useSearchBox();
  const wordCount = query
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const shouldDisableAutoSelection = wordCount < 5;

  return (
    <Command.Group ref={ref} {...props}>
      <Command.Item
        onSelect={() => onAskAI(query.trim())}
        data-disable-auto-selection={shouldDisableAutoSelection}
      >
        <Sparkles />
        <AskAIText query={query.trim().length > 0 ? query.trim() : ""} />
      </Command.Item>
    </Command.Group>
  );
}

export function AskAIText({
  ref,
  query,
}: {
  ref?: ComponentProps<"span">["ref"];
  query: string;
}): JSX.Element {
  return (
    <span
      ref={ref}
      className="inline-flex items-baseline overflow-hidden whitespace-nowrap"
    >
      Ask AI
      {query.trimStart().length > 0 && (
        <>
          <span className="ms-1">&ldquo;</span>
          <span className="min-w-0 shrink overflow-hidden text-ellipsis font-semibold">
            {query}
          </span>
          <span>&rdquo;</span>
        </>
      )}
    </span>
  );
}
