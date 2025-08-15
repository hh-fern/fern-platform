import { PopoverArrow } from "@radix-ui/react-popover";
import { Book, MessageCircleQuestion, RotateCcw } from "lucide-react";

import { Auth0SessionData } from "@/app/services/auth0/getCurrentSession";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { LogoutButton } from "../auth/LogoutButton";
import { OrgSwitcher } from "../auth/OrgSwitcher";
import { ThemeToggle } from "../theme/ThemeToggle";
import { ThemedFernLogo } from "../theme/ThemedFernLogo";
import { HeaderLinkButton } from "./HeaderLinkButton";
import { MaybeDocsHeaderItems } from "./MaybeDocsHeaderItems";
import { ProfileImage } from "./ProfileImage";
import { SupportButton } from "./SupportButton";

export declare namespace Header {
  export interface Props {
    session: Auth0SessionData;
  }
}

export async function Header({ session }: Header.Props) {
  const { name, email, picture } = session.user;

  return (
    <div className="flex justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-4">
        <ThemedFernLogo className="w-16" />
        <OrgSwitcher />
        <MaybeDocsHeaderItems />
      </div>
      <div className="flex shrink-0 gap-2">
        <div className="hidden items-center md:flex">
          <SupportButton className="mr-2" />
          <HeaderLinkButton
            text="Docs"
            href="https://buildwithfern.com/learn"
          />
          <HeaderLinkButton
            text="Changelog"
            href="https://buildwithfern.com/learn/docs/getting-started/changelog"
          />
          <ThemeToggle />
        </div>
        <Popover>
          <PopoverTrigger className="cursor-pointer">
            <ProfileImage picture={picture} name={name} />
          </PopoverTrigger>
          <PopoverContent collisionPadding={8}>
            <PopoverArrow className="fill-popover" />
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <div className="text-gray-1200 text-sm">{name}</div>
                <div className="text-xs text-gray-800">{email}</div>
              </div>
              <div className="flex flex-col md:hidden">
                <SupportButton
                  className="justify-start text-left"
                  buttonProps={{ variant: "ghost" }}
                  icon={
                    <MessageCircleQuestion className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  }
                />
                <HeaderLinkButton
                  text="Docs"
                  className="justify-start !px-0 text-left"
                  href="https://buildwithfern.com/learn"
                  icon={<Book className="h-4 w-4" />}
                />
                <HeaderLinkButton
                  text="Changelog"
                  className="justify-start !px-0 text-left"
                  href="https://buildwithfern.com/learn/docs/getting-started/changelog"
                  icon={<RotateCcw className="h-4 w-4" />}
                />
                <ThemeToggle />
              </div>
              <LogoutButton />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
