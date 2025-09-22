import type { ComponentProps } from "react";

import { Play } from "lucide-react";

import { Kbd } from "@fern-docs/components";

import * as Command from "../cmdk";

export function CommandGroupPlayground({
  ref,
  togglePlayground,
  playgroundOpen,
  ...props
}: ComponentProps<typeof Command.Group> & {
  togglePlayground?: () => void;
  playgroundOpen?: boolean;
}): React.ReactNode {
  if (togglePlayground == null) {
    return false;
  }

  return (
    <Command.Group heading="API Explorer" ref={ref} {...props}>
      <Command.Item
        value={playgroundOpen ? "close api explorer" : "open api explorer"}
        onSelect={() => togglePlayground()}
      >
        <Play />
        {playgroundOpen ? "Close API Explorer" : "Open API Explorer"}
        <Kbd className="ml-auto">ctrl+&#96;</Kbd>
      </Command.Item>
    </Command.Group>
  );
}
