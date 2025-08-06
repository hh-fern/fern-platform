"use client";

import { UserMinusIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GetMembers200ResponseOneOfInner } from "auth0";
import { toast } from "sonner";

import { removeUserFromOrg } from "@/app/actions/removeUserFromOrg";
import { Auth0UserID } from "@/app/services/auth0/types";
import { ReactQueryKey, inferQueryData } from "@/state/queryKeys";
import { useOrgNameFromPathname } from "@/utils/useOrgNameFromPathname";

import { DropdownMenuItem } from "../ui/dropdown-menu";
import { MemberOrInviteeRow } from "./MemberOrInviteeRow";
import { FernLogger } from "@/utils/logging/logger";
import { DashboardError } from "@/utils/logging/errors";

export declare namespace MemberRow {
  export interface Props {
    member: GetMembers200ResponseOneOfInner;
    currentUserId: Auth0UserID;
  }
}

export function MemberRow({ member, currentUserId }: MemberRow.Props) {
  const orgName = useOrgNameFromPathname();
  const queryKey = ReactQueryKey.orgMembers(orgName);

  const queryClient = useQueryClient();
  const removeMember = useMutation({
    mutationFn: () =>
      removeUserFromOrg({
        orgName,
        userIdToRemove: Auth0UserID(member.user_id),
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousMembers =
        queryClient.getQueryData<inferQueryData<typeof queryKey>>(queryKey);

      queryClient.setQueryData<inferQueryData<typeof queryKey>>(
        queryKey,
        (previousMembers) =>
          previousMembers != null
            ? previousMembers.filter((m) => m.user_id !== member.user_id)
            : previousMembers
      );

      return { previousMembers };
    },
    onError: async (error, _variables, context) => {
      FernLogger.error(DashboardError.FAILED_TO_REMOVE_MEMBER, error, {
        memberName: member.name,
        memberEmail: member.email,
        orgName
      });
      toast.error(`Failed to remove ${member.name}`);
      if (context?.previousMembers != null) {
        queryClient.setQueryData<inferQueryData<typeof queryKey>>(
          queryKey,
          context.previousMembers
        );
      }

      // only invalidate on error. if we invalidate on success, we can wipe
      // out other optimsitic writes (if the user is removing multiple members)
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <MemberOrInviteeRow
      title={member.name}
      subtitle={member.email}
      pictureUrl={member.picture}
      dropdownMenuItems={
        currentUserId !== member.user_id ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              removeMember.mutate();
            }}
          >
            <UserMinusIcon /> Remove member
          </DropdownMenuItem>
        ) : undefined
      }
    />
  );
}
