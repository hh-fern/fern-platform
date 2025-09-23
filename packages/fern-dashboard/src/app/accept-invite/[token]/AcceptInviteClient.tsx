"use client";

import Link from "next/link";
import { useState } from "react";

import { Loader2 } from "lucide-react";

import {
  RedeemInviteTokenErrors,
  redeemInviteToken,
} from "@/app/actions/redeemInviteToken";
import { Auth0SessionData } from "@/app/services/auth0/getCurrentSession";
import { ProfileImage } from "@/components/layout/ProfileImage";
import { Button } from "@/components/ui/button";

import AcceptInviteSuccess from "./AcceptInviteSuccess";

interface AcceptInviteClientProps {
  token: string;
  session: Auth0SessionData;
}

export function AcceptInviteClient({
  token,
  session,
}: AcceptInviteClientProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAcceptInvite = async () => {
    setIsProcessing(true);
    try {
      const inviteResult = await redeemInviteToken({ token });
      setResult(inviteResult);
    } catch (error) {
      setResult({
        success: false,
        error: { type: "UNKNOWN_ERROR" as const },
        rawError: error,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Accepting invitation...
      </div>
    );
  }

  if (result) {
    if (result.success) {
      return (
        <AcceptInviteSuccess orgName={result.orgName} userId={result.userId} />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-muted-foreground text-sm">
            {DisplayTokenError(result.error)}
          </div>
          <Button asChild>
            <Link href="/">Return to homepage</Link>
          </Button>
        </div>
      );
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <Button onClick={handleAcceptInvite}>
        Accept as{" "}
        <div className="flex items-center gap-1">
          <ProfileImage
            picture={session.user.picture}
            name={session.user.name}
            size={24}
          />
          {session.user.name}
        </div>
      </Button>
      <Button variant="outline">Logout and accept as different user</Button>
    </div>
  );
}

const DisplayTokenError = ({ type }: RedeemInviteTokenErrors) => {
  switch (type) {
    case "NOT_LOGGED_IN":
      return "Please sign in to accept the invitation.";
    case "INVITE_TOKEN_NOT_FOUND":
      return "This invite link was not found or has already been used. Please contact the sender for a new link.";
    case "EXPIRED_INVITE_TOKEN":
      return "This invite link has expired. Please contact the sender for a new link.";
    default:
      return "Failed to accept invitation.";
  }
};
