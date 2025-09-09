import { useCurrentEditor } from "@tiptap/react";

import { SlashDropdownMenu } from "../tiptap-ui/slash-dropdown-menu";

export default function FloatingMenu() {
  const { editor } = useCurrentEditor();
  return (
    <SlashDropdownMenu
      editor={editor}
      config={{
        enabledItems: [
          "text",
          "heading_1",
          "heading_2",
          "heading_3",
          "ordered_list",
          "bullet_list",
          "quote",
        ],
        // showGroups: true,
        // itemGroups: {
        //   text: "Style",
        //   heading_1: "Style",
        //   heading_2: "Style",
        //   bullet_list: "Lists",
        //   quote: "Style",
        //   ordered_list: "Lists",
        // },
      }}
    />
  );
}

// declare namespace FloatingMenuHeading {
//   export interface Props {
//     title: string;
//   }
// }

// function FloatingMenuHeading({ title }: FloatingMenuHeading.Props) {
//   return (
//     <div className="px-3 py-1 text-sm font-bold uppercase text-gray-800">
//       {title}
//     </div>
//   );
// }

// declare namespace FloatingMenuItem {
//   export interface Props {
//     title: string;
//     iconProps: Icon.Props;
//     onClick?: MouseEventHandler<HTMLButtonElement>;
//   }
// }

// function FloatingMenuItem({
//   title,
//   iconProps,
//   onClick,
// }: FloatingMenuItem.Props) {
//   const { size = 20, ...restIconProps } = iconProps;

//   return (
//     <button
//       className="rounded-1 flex h-8 cursor-pointer items-center gap-2 px-3 transition-colors hover:bg-gray-300 hover:transition-none"
//       onClick={onClick}
//     >
//       <div className="flex size-4 items-center justify-center">
//         <Icon size={size} {...restIconProps} />
//       </div>
//       <div className="text-md font-medium">{title}</div>
//     </button>
//   );
// }
