"use client";

import { Auth0SessionData } from "@/app/services/auth0/getCurrentSession";
import { useOrgInvitations } from "@/state/useOrgInvitations";
import { useOrgMembers } from "@/state/useOrgMembers";
import { useCurrentOrganization } from "@/state/useOrganizations";
import { useUserGithubRepos } from "@/state/useUserGithubRepos";

import { PageHeader } from "../layout/PageHeader";
import GithubBranchTest from "./GithubBranchTest";
import { GithubTestComponent } from "./GithubTestComponent";
import { InviteUserDialog } from "./InviteUserDialog";
import { MembersTable } from "./MembersTable";

export declare namespace MembersPage {
  export interface Props {
    session: Auth0SessionData;
  }
}

export function MembersPage({ session }: MembersPage.Props) {
  const org = useCurrentOrganization();

  const invitations = useOrgInvitations();
  const members = useOrgMembers();

  const repos = useUserGithubRepos();

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <PageHeader
        title="Members"
        subtitle="Manage team members and invitations"
        rightContent={
          <div className="flex md:items-center">
            <InviteUserDialog org={org} />
          </div>
        }
      />
      <MembersTable
        members={members}
        invitations={invitations}
        userId={session.user.sub}
      />
      <GithubTestComponent repos={repos} />
      <GithubBranchTest />
    </div>
  );
}
