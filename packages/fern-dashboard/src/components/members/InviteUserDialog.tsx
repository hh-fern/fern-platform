import type { Auth0Organization } from "@fern-dashboard/services/auth/types";

import PlusIcon from "@heroicons/react/24/outline/PlusIcon";
import { useState } from "react";

import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { InviteUserDialogContent } from "./InviteUserDialogContent";

export declare namespace InviteUserDialog {
    export interface Props {
        org: Auth0Organization | undefined;
    }
}

export function InviteUserDialog({ org }: InviteUserDialog.Props) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="default">
                    <PlusIcon />
                    Add member
                </Button>
            </DialogTrigger>
            <DialogContent
                onEscapeKeyDown={(event) => {
                    event.preventDefault();
                }}
                onInteractOutside={(event) => {
                    event.preventDefault();
                }}
                persistent={true}
            >
                <InviteUserDialogContent
                    org={org}
                    close={() => {
                        setIsOpen(false);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
