export interface FloatingMenuProps {
    slashMenuItems?: any[];
    enabledItems?: string[];
    SlashDropdownMenu?: React.ComponentType<any>;
}

export default function FloatingMenu({ slashMenuItems, enabledItems, SlashDropdownMenu }: FloatingMenuProps) {
    if (!SlashDropdownMenu) {
        return null;
    }

    return (
        <SlashDropdownMenu
            config={{
                enabledItems: enabledItems || [
                    "text",
                    "heading_1",
                    "heading_2",
                    "heading_3",
                    "bullet_list",
                    "ordered_list",
                    "quote"
                ],
                customItems: slashMenuItems || []
            }}
        />
    );
}
