import { useState } from "react";

import { ClipboardIcon, LinkIcon } from "@heroicons/react/24/outline";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createInviteLink } from "@/app/actions/createInviteLink";
import { Auth0Organization } from "@/app/services/auth0/types";
import { getOrgDisplayName } from "@/utils/getOrgDisplayName";
import { useOrgNameFromPathname } from "@/utils/useOrgNameFromPathname";

import { Button } from "../ui/button";
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export declare namespace InviteUserDialogContent {
  export interface Props {
    org: Auth0Organization | undefined;
    close: () => void;
  }
}

export function InviteUserDialogContent({
  org,
  close,
}: InviteUserDialogContent.Props) {
  const orgName = useOrgNameFromPathname();

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"link" | "email">("link");
  const [copied, setCopied] = useState(false);

  const createLink = useMutation({
    mutationFn: () => createInviteLink({ orgName }),
    onSuccess: ({ inviteUrl }) => {
      setInviteLink(inviteUrl);
      toast.success("Invite link created successfully");
    },
    onError: (error) => {
      console.error("Failed to create invite link", error);
      toast.error("Failed to create invite link");
    },
  });

  const isCreatingLink = createLink.isPending;

  const copyToClipboard = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      // Reset copied state after 4 seconds so we re-show the copy icon
      setTimeout(() => {
        setCopied(false);
      }, 4000);
      toast.success("Invite link copied to clipboard!");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Invite members to {getOrgDisplayName(org) ?? "organization"}
        </DialogTitle>
        <DialogDescription>
          Choose how you&apos;d like to invite new members to your organization.
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "link" | "email")}
        >
          <TabsList>
            <TabsTrigger value="link">One-time link</TabsTrigger>
          </TabsList>
          <TabsContent value="link">
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Create a one-time use invite link that can be shared with
                anyone.
              </p>
              {!inviteLink ? (
                <Button
                  onClick={() => createLink.mutate()}
                  disabled={isCreatingLink}
                  className="w-full"
                >
                  {isCreatingLink ? (
                    <>
                      Generating link...
                      <Loader2 className="size-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Generate Invite Link
                      <LinkIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Input value={inviteLink} readOnly className="flex-1" />
                      <Button
                        variant="outline"
                        onClick={() => void copyToClipboard()}
                      >
                        {copied ? (
                          <CheckIcon className="text-primary size-4" />
                        ) : (
                          <ClipboardIcon className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    This link can be used once and expires in 24 hours.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={close} disabled={isCreatingLink}>
          {activeTab === "link" ? "Close" : "Cancel"}
        </Button>
      </DialogFooter>
    </>
  );
}
