"use client";

import { DesktopCommandWithAskAI } from "../components/search-modal";
import { SearchWidgetTrigger, useIsSearchDialogOpen, useSetSearchDialogOpen } from "../state/search";
import { useConversationId } from "../state/search";

export function TestPageClient() {
  const isModalOpen = useIsSearchDialogOpen();
  const setIsModalOpen = useSetSearchDialogOpen();
  const conversationIdHook = useConversationId();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <SearchWidgetTrigger />

      <DesktopCommandWithAskAI 
          askAI={false}
          defaultAskAI={false}
          setAskAI={() => false}
          domain="https://buildwithfern.com/learn"
          // api?: string;
          // suggestionsApi?: string;
          // body?: object;
          // headers?: Record<string, string>;
          // initialInput?: string;
          // chatId?: string;
          // onSelectHit?: (path: string) => void;
          // prefetch?: (path: string) => Promise<void>;
          // composerActions?: ReactNode;
          // domain: string;
          // renderActions?: (message: SqueezedMessage) => ReactNode;
          // setInitialInput?: (initialInput: string) => void;
          // children?: ReactNode;
          // darkCodeEnabled?: boolean;
          useConversationId={() => conversationIdHook}
      
      />
    </div>
  );
}